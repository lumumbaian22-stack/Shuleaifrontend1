// V143 compatibility shim. The only Socket.IO owner is realtime-client.js.
function connectWebSocket(){ return window.ShuleRealtime?.connect?.(); }
