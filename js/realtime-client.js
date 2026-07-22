(function(){
  'use strict';
  let socket=null, activeConversation=null, recovering=false;
  const DIRECT_CHAT_EVENTS=['chat:message_created','chat:message_edited','chat:message_deleted','chat:message_delivered','chat:message_read','chat:message_pinned','chat:message_unpinned'];
  const LEGACY_CHAT_EVENTS=['private-message','new-private-message','new-message','new-student-message','new-group-message','message:new','message:created'];
  function token(){return localStorage.getItem('authToken')||localStorage.getItem('token');}
  function user(){try{return JSON.parse(localStorage.getItem('user')||'{}');}catch(_){return {};}}
  function base(){return (localStorage.getItem('SHULE_API_BASE_URL')||window.SHULE_API_BASE_URL||'https://api.shuleai.live').replace(/\/api\/?$/,'');}
  function status(value){document.documentElement.dataset.realtime=value;window.dispatchEvent(new CustomEvent('shule:realtime-status',{detail:{status:value}}));}
  function route(evt){
    if(!evt||!evt.type)return;
    if(!window.ShuleRealtimeStore?.accept(evt))return;
    const me=user(); if(evt.schoolCode&&me.schoolCode&&String(evt.schoolCode)!==String(me.schoolCode)&&me.role!=='super_admin')return;
    window.dispatchEvent(new CustomEvent('shule:realtime-event',{detail:evt}));
  }
  function stableEventId(type,data={}){
    const id=data.id||data.messageId||data.clientMessageId||data.metadata?.clientMessageId||'';
    const stamp=data.createdAt||data.sentAt||data.timestamp||'';
    const participants=[data.senderId||data.from||data.fromId||'',data.receiverId||data.to||data.toId||''].join(':');
    const key=data.conversationKey||data.conversationId||data.metadata?.conversationKey||'';
    return `socket:${type}:${id||`${participants}:${key}:${String(data.content||data.body||data.message||'').slice(0,48)}:${stamp}`}`;
  }
  function normalizeEnvelope(type,payload){
    if(payload&&payload.type&&payload.data)return payload;
    if(payload&&payload.eventId&&payload.type)return payload;
    const me=user(); const data={...(payload||{})};
    if(data.from&&!data.senderId)data.senderId=data.from;
    if(data.fromId&&!data.senderId)data.senderId=data.fromId;
    if(data.to&&!data.receiverId)data.receiverId=data.to;
    if(data.toId&&!data.receiverId)data.receiverId=data.toId;
    if(data.fromName&&!data.senderName)data.senderName=data.fromName;
    if(data.message&&!data.content)data.content=data.message;
    if(data.body&&!data.content)data.content=data.body;
    if(!data.schoolCode&&me.schoolCode)data.schoolCode=me.schoolCode;
    if(!data.conversationKey&&data.conversationId)data.conversationKey=data.conversationId;
    if(!data.conversationId&&data.conversationKey)data.conversationId=data.conversationKey;
    if(!data.conversationKey&&data.metadata?.conversationKey){data.conversationKey=data.metadata.conversationKey;data.conversationId=data.metadata.conversationKey;}
    if(!data.conversationKey&&data.senderId&&data.receiverId){const ids=[Number(data.senderId),Number(data.receiverId)].sort((a,b)=>a-b);data.conversationKey=`direct:${ids[0]}:${ids[1]}`;data.conversationId=data.conversationKey;}
    const syntheticId=stableEventId(type,data);
    if(!data.id&&!data.messageId&&data.clientMessageId)data.id=data.clientMessageId;
    return {eventId:syntheticId,type,schoolCode:data.schoolCode||me.schoolCode||null,entity:{type:data.threadId?'ThreadReply':'Message',id:data.id||data.messageId||data.clientMessageId||syntheticId,version:Number(data.version||1)},audience:{school:false},data,createdAt:data.createdAt||data.sentAt||data.timestamp||new Date().toISOString()};
  }
  function routeDirect(type,payload){
    const canonical=DIRECT_CHAT_EVENTS.includes(type)?type:'chat:message_created';
    const actualPayload=payload?.envelope&&payload?.data?payload.data:payload;
    route(normalizeEnvelope(canonical,actualPayload));
  }
  async function recover(){
    if(recovering||!token())return; recovering=true;
    try{let after=window.ShuleRealtimeStore?.lastEventId?.()||0, loops=0;do{const res=await window.apiRequest(`/api/realtime/sync?after=${after}&limit=200`);cons