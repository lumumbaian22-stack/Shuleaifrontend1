(function(){
  'use strict';
  let socket=null, activeConversation=null, recovering=false;
  function token(){return localStorage.getItem('authToken')||localStorage.getItem('token');}
  function user(){try{return JSON.parse(localStorage.getItem('user')||'{}');}catch(_){return {};}}
  function base(){return (localStorage.getItem('SHULE_API_BASE_URL')||window.SHULE_API_BASE_URL||'https://shuleaibackend-32h1.onrender.com').replace(/\/api\/?$/,'');}
  function status(value){document.documentElement.dataset.realtime=value;window.dispatchEvent(new CustomEvent('shule:realtime-status',{detail:{status:value}}));}
  function route(evt){
    if(!window.ShuleRealtimeStore?.accept(evt))return;
    const me=user(); if(evt.schoolCode&&me.schoolCode&&String(evt.schoolCode)!==String(me.schoolCode)&&me.role!=='super_admin')return;
    window.dispatchEvent(new CustomEvent('shule:realtime-event',{detail:evt}));
  }
  async function recover(){
    if(recovering||!token())return; recovering=true;
    try{let after=window.ShuleRealtimeStore?.lastEventId?.()||0, loops=0;do{const res=await window.apiRequest(`/api/realtime/sync?after=${after}&limit=200`);const rows=res?.data||[];rows.forEach(route);const next=Number(res?.meta?.lastEventId||after)||after;if(next===after)break;after=next;loops++;if(!res?.meta?.hasMore)break;}while(loops<5);}catch(error){console.warn('[Realtime] missed-event recovery failed:',error.message);}finally{recovering=false;}
  }
  function joinConversation(key){
    const next=key?String(key):null;
    if(activeConversation&&activeConversation!==next&&socket?.connected)socket.emit('chat:leave_conversation',activeConversation);
    activeConversation=next;
    if(next&&socket?.connected)socket.emit('chat:join_conversation',next,ack=>{if(!ack?.success)console.warn('[Realtime] conversation join denied:',ack?.message);});
  }
  function connect(){
    const authToken=token(), me=user(); if(!authToken||!me.id||typeof window.io!=='function')return null;
    if(socket){socket.auth={token:authToken};if(!socket.connected)socket.connect();return socket;}
    socket=window.io(base(),{auth:{token:authToken},transports:['websocket','polling'],reconnection:true,reconnectionAttempts:Infinity,reconnectionDelay:800,reconnectionDelayMax:10000,timeout:20000});
    window.socket=socket;
    socket.on('connect',()=>{status('connected');recover();if(activeConversation)joinConversation(activeConversation);});
    socket.on('realtime:event',route);
    socket.on('disconnect',()=>status('offline'));
    socket.on('connect_error',()=>status('offline'));
    return socket;
  }
  function disconnect(){if(socket){socket.removeAllListeners();socket.disconnect();}socket=null;window.socket=null;status('offline');}
  window.connectWebSocket=connect;
  window.ShuleRealtime={connect,disconnect,joinConversation,leaveConversation:()=>joinConversation(null),recover,get socket(){return socket;},get activeConversation(){return activeConversation;}};
  window.addEventListener('online',()=>{connect();recover();}); window.addEventListener('offline',()=>status('offline'));
  document.addEventListener('DOMContentLoaded',()=>{if(token())connect();});
})();
