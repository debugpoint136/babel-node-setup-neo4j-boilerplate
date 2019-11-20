import Neo4jDataImporter from './Neo4jDataImporter';
// to make fetch work in node : https://github.com/d3/d3-fetch/issues/19#issuecomment-391318445
if (typeof fetch !== 'function') {
  global.fetch = require('node-fetch-polyfill');
}
// web-socket polyfill
Object.assign(global, { WebSocket: require('websocket').w3cwebsocket }); // https://stomp-js.github.io/guide/stompjs/rx-stomp/ng2-stompjs/2018/06/29/pollyfils-for-stompjs-v5.html

const worker = new Neo4jDataImporter();
try {
  worker.start();
} catch (error) {
  console.log(error)
}

