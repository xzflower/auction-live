const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ============ State ============
const rooms = new Map();
const sockets = new Map();

const INITIAL_TIME = 30;
const BID_EXTEND = 10;

function createRoom(id, item, minBid) {
  const room = {
    id,
    item,
    minBid: parseFloat(minBid) || 0,
    status: 'waiting',
    bids: [],
    winner: null,
    timer: null,
    timeLeft: 0,
  };
  rooms.set(id, room);
  return room;
}

function broadcast(roomId, msg) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(msg);
  for (const [ws, info] of sockets) {
    if (info.roomId === roomId && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

function startTimer(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'active') return;

  if (room.timer) clearInterval(room.timer);
  room.timeLeft = BID_EXTEND;

  room.timer = setInterval(() => {
    room.timeLeft--;
    broadcast(roomId, { type: 'tick', timeLeft: room.timeLeft });

    if (room.timeLeft <= 0) {
      clearInterval(room.timer);
      room.timer = null;
      endAuction(roomId);
    }
  }, 1000);
}

function endAuction(roomId) {
  const room = rooms.get(roomId);
  if (!room || room.status === 'ended') return;
  room.status = 'ended';
  if (room.timer) { clearInterval(room.timer); room.timer = null; }

  const winner = room.bids.length > 0 ? room.bids[room.bids.length - 1] : null;
  room.winner = winner;

  broadcast(roomId, {
    type: 'hammer',
    winner: winner ? { username: winner.username, amount: winner.amount } : null,
    totalBids: room.bids.length,
    history: room.bids,
  });
}

function processBid(roomId, username, amount) {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'active') return { ok: false, reason: '拍卖未进行中' };

  const bidVal = parseFloat(amount);
  if (isNaN(bidVal) || bidVal <= 0) return { ok: false, reason: '无效出价' };

  const currentHighest = room.bids.length > 0 ? room.bids[room.bids.length - 1].amount : room.minBid;
  if (bidVal <= currentHighest) return { ok: false, reason: `出价需高于 ¥${currentHighest}` };

  const bid = { username, amount: bidVal, timestamp: Date.now() };
  room.bids.push(bid);

  if (room.timer) clearInterval(room.timer);
  room.timeLeft = BID_EXTEND;
  startTimer(roomId);

  const sorted = [...room.bids].sort((a, b) => b.amount - a.amount);
  broadcast(roomId, {
    type: 'bid',
    bid: { username, amount: bidVal },
    leaderboard: sorted,
    timeLeft: room.timeLeft,
  });

  return { ok: true };
}

// ============ CORS Helper ============
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS_HEADERS });
  res.end(JSON.stringify(data));
}

// ============ Static File Serving ============
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res, rootDir) {
  let filePath = path.join(rootDir, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, CORS_HEADERS);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain', ...CORS_HEADERS });
    res.end(data);
  });
}

// ============ HTTP Server ============
const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  if (req.url === '/' && !req.headers.accept?.includes('text/html')) {
    jsonResponse(res, { status: 'ok', name: 'auction-live', version: '2.0.0', ws: true });
    return;
  }

  if (req.url === '/api/status') {
    jsonResponse(res, { status: 'ok', name: 'auction-live', version: '2.0.0', ws: true, rooms: rooms.size });
    return;
  }

  const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    serveStatic(req, res, frontendDist);
    return;
  }

  const legacyPublic = path.resolve(__dirname, '..', 'public');
  if (fs.existsSync(path.join(legacyPublic, 'index.html'))) {
    serveStatic(req, res, legacyPublic);
    return;
  }

  jsonResponse(res, { status: 'ok', name: 'auction-live', version: '2.0.0', ws: true });
});

// ============ WebSocket Server ============
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch { return; }

    switch (msg.type) {
      case 'create_room': {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        const room = createRoom(roomId, msg.item, msg.minBid);
        ws.send(JSON.stringify({ type: 'room_created', roomId }));
        break;
      }

      case 'join_room': {
        const room = rooms.get(msg.roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }
        sockets.set(ws, { roomId: msg.roomId, username: msg.username });
        ws.send(JSON.stringify({
          type: 'room_joined',
          room: {
            id: room.id,
            item: room.item,
            status: room.status,
            minBid: room.minBid,
            bids: room.bids,
            winner: room.winner,
          },
        }));
        if (room.status === 'waiting' && room.bids.length === 0) {
          room.status = 'active';
          room.timeLeft = INITIAL_TIME;
          room.timer = setInterval(() => {
            room.timeLeft--;
            broadcast(msg.roomId, { type: 'tick', timeLeft: room.timeLeft });
            if (room.timeLeft <= 0) {
              clearInterval(room.timer);
              room.timer = null;
              endAuction(msg.roomId);
            }
          }, 1000);
          broadcast(msg.roomId, { type: 'start', timeLeft: INITIAL_TIME, item: room.item, minBid: room.minBid });
        }
        break;
      }

      case 'bid': {
        const info = sockets.get(ws);
        if (!info) return;
        const result = processBid(info.roomId, info.username, msg.amount);
        if (!result.ok) {
          ws.send(JSON.stringify({ type: 'bid_error', reason: result.reason }));
        }
        break;
      }

      case 'restart': {
        const info2 = sockets.get(ws);
        if (!info2) return;
        const room = rooms.get(info2.roomId);
        if (!room) return;
        if (room.timer) clearInterval(room.timer);
        room.status = 'active';
        room.bids = [];
        room.winner = null;
        room.timeLeft = INITIAL_TIME;
        room.timer = setInterval(() => {
          room.timeLeft--;
          broadcast(info2.roomId, { type: 'tick', timeLeft: room.timeLeft });
          if (room.timeLeft <= 0) {
            clearInterval(room.timer);
            room.timer = null;
            endAuction(info2.roomId);
          }
        }, 1000);
        broadcast(info2.roomId, { type: 'start', timeLeft: INITIAL_TIME, item: room.item, minBid: room.minBid });
        break;
      }
    }
  });

  ws.on('close', () => {
    sockets.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 直播竞拍服务已启动: http://localhost:${PORT}`);
});
