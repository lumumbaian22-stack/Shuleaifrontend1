(function(){
  'use strict';
  const seen=new Set(); const versions=new Map(); const MAX=1200;
  function cursorKey(){
    let user={};try{user=typeof getCurrentUser==='function'?(getCurrentUser()||{}):JSON.parse(localStorage.getItem('user')||'{}');}catch(_){}
    return `shuleRealtimeLastEventId:${user.schoolCode||'no-school'}:${user.id||'no-user'}`;
  }
  function accept(evt){
    if(!evt||!evt.type)return false;
    const id=String(evt.eventId||''); if(id&&seen.has(id))return false;
    const entity=evt.entity||{}; const key=entity.type&&entity.id?`${entity.type}:${entity.id}`:null;
    if(key){const incoming=Number(entity.version||0), current=Number(versions.get(key)||0);if(incoming&&incoming<current)return false;if(incoming)versions.set(key,incoming);}
    if(id){seen.add(id);if(seen.size>MAX)seen.delete(seen.values().next().value);if(/^\d+$/.test(id)){const key=cursorKey();const current=Number(localStorage.getItem(key)||0)||0;const incoming=Number(id)||0;if(incoming>current)localStorage.setItem(key,String(incoming));}}
    return true;
  }
  function lastEventId(){return Number(localStorage.getItem(cursorKey())||0)||0;}
  function reset(){seen.clear();versions.clear();}
  window.ShuleRealtimeStore={accept,lastEventId,versions,reset};
})();
