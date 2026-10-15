// Shadowbox relay: serves public/ and passes messages between the two players in a room.
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const TOPICS = new Set(['start', 'round', 'pick', 'rematch']);
const rooms = new Map(); // code -> Set<ws>

const server = http.createServer((req, res) => {
  const file = path.join(__dirname, 'public', 'index.html');
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(500); return res.end('Server error'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, maxPayload: 2048 });

function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function peerIds(set) { return [...set].map((w) => w.id); }
function broadcast(set, obj) { set.forEach((w) => send(w, obj)); }

wss.on('connection', (ws) => {
  ws.id = crypto.randomBytes(6).toString('hex');
  ws.room = null;

  ws.on('message', (raw) => {
    let m;
    try { m = JSON.parse(raw); } catch { return; }

    if (m.t === 'join' && !ws.room) {
      const code = String(m.code || '').toUpperCase();
      if (!/^[A-Z]{5}$/.test(code)) return send(ws, { t: 'error', msg: 'Invalid room code' });
      let set = rooms.get(code);
      if (m.create) {
        if (set) return send(ws, { t: 'error', msg: 'That code is already in use' });
        set = new Set(); rooms.set(code, set);
      } else {
        if (!set) return send(ws, { t: 'error', msg: 'No room with that code' });
        if (set.size >= 2) return send(ws, { t: 'error', msg: 'Room is full' });
      }
      set.add(ws); ws.room = code;
      send(ws, { t: 'joined', id: ws.id, peers: peerIds(set) });
      broadcast(set, { t: 'peers', peers: peerIds(set) });
      return;
    }

    if (m.t === 'emit' && ws.room && TOPICS.has(m.topic)) {
      const set = rooms.get(ws.room);
      if (set) broadcast(set, { t: 'msg', topic: m.topic, data: m.data, peer: ws.id });
    }
  });

  ws.on('close', () => {
    const set = ws.room && rooms.get(ws.room);
    if (!set) return;
    set.delete(ws);
    if (set.size === 0) rooms.delete(ws.room);
    else broadcast(set, { t: 'peers', peers: peerIds(set) });
  });
});

server.listen(PORT, () => console.log('Shadowbox running on http://localhost:' + PORT));
