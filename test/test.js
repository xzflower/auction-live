const WebSocket = require('ws');
const http = require('http');

// Start server
const server = require('child_process').spawn('node', ['server/index.js'], {
  cwd: '/tmp/auction-live',
  stdio: 'pipe',
});

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.log(`  ❌ ${msg}`); }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runTests() {
  console.log('\n🧪 直播竞拍系统测试\n');

  // Wait for server to start
  await wait(1500);

  // Connect 3 clients
  const c1 = new WebSocket('ws://localhost:3000');
  const c2 = new WebSocket('ws://localhost:3000');
  const c3 = new WebSocket('ws://localhost:3000');

  await wait(500);

  const msgs1 = [], msgs2 = [], msgs3 = [];
  c1.on('message', d => msgs1.push(JSON.parse(d.toString())));
  c2.on('message', d => msgs2.push(JSON.parse(d.toString())));
  c3.on('message', d => msgs3.push(JSON.parse(d.toString())));

  // Test 1: Create room
  c1.send(JSON.stringify({ type: 'create_room', item: '测试拍品', minBid: 100 }));
  await wait(500);
  const createResp = msgs1.find(m => m.type === 'room_created');
  assert(createResp && createResp.roomId, '创建房间成功');
  const roomId = createResp?.roomId;

  // Test 2: Join room
  c1.send(JSON.stringify({ type: 'join_room', roomId, username: '玩家A' }));
  await wait(500);
  const joinResp = msgs1.find(m => m.type === 'room_joined');
  assert(joinResp && joinResp.room, '加入房间成功');

  // Test 3: Join second player
  c2.send(JSON.stringify({ type: 'join_room', roomId, username: '玩家B' }));
  await wait(500);
  assert(msgs2.some(m => m.type === 'room_joined'), '玩家B加入成功');

  // Test 4: Room auto-starts
  const startMsg = msgs1.find(m => m.type === 'start') || msgs2.find(m => m.type === 'start');
  assert(startMsg && startMsg.timeLeft > 0, '房间自动开始竞拍');

  // Test 5: Place valid bid
  c1.send(JSON.stringify({ type: 'bid', amount: 200 }));
  await wait(500);
  const bidResp = msgs1.filter(m => m.type === 'bid');
  const bidResp2 = msgs2.filter(m => m.type === 'bid');
  assert(bidResp.length > 0 || bidResp2.length > 0, '出价成功并广播');

  // Test 6: Higher bid
  c2.send(JSON.stringify({ type: 'bid', amount: 300 }));
  await wait(500);
  const bidMsgs = [...msgs1, ...msgs2, ...msgs3].filter(m => m.type === 'bid');
  const highestBid = bidMsgs[bidMsgs.length - 1];
  assert(highestBid && highestBid.bid.amount === 300, '高价出价覆盖低价');

  // Test 7: Low bid rejected
  c1.send(JSON.stringify({ type: 'bid', amount: 250 }));
  await wait(500);
  const errMsg = msgs1.find(m => m.type === 'bid_error');
  assert(errMsg && errMsg.reason, '低价出价被拒绝');

  // Test 8: Leaderboard ordering
  const lastBid = [...msgs1, ...msgs2, ...msgs3].filter(m => m.type === 'bid').pop();
  assert(lastBid && lastBid.leaderboard, '排行榜数据存在');
  if (lastBid && lastBid.leaderboard) {
    const sorted = lastBid.leaderboard;
    const correct = sorted.every((b, i) => i === 0 || b.amount <= sorted[i - 1].amount);
    assert(correct, '排行榜按金额降序排列');
  }

  // Test 9: Timer ticks
  const tickMsg = msgs1.find(m => m.type === 'tick');
  assert(tickMsg && typeof tickMsg.timeLeft === 'number', '倒计时信号正常');

  // Close room 1 and test room 2 (concurrent)
  c1.close(); c2.close(); c3.close();
  await wait(300);

  // Test 10: Concurrent bids in a new room
  const d1 = new WebSocket('ws://localhost:3000');
  const d2 = new WebSocket('ws://localhost:3000');
  await wait(300);

  const msgsD1 = [], msgsD2 = [];
  d1.on('message', d => msgsD1.push(JSON.parse(d.toString())));
  d2.on('message', d => msgsD2.push(JSON.parse(d.toString())));

  d1.send(JSON.stringify({ type: 'create_room', item: '并发测试', minBid: 50 }));
  await wait(300);
  const roomId2 = msgsD1.find(m => m.type === 'room_created')?.roomId;

  d1.send(JSON.stringify({ type: 'join_room', roomId: roomId2, username: '速手A' }));
  d2.send(JSON.stringify({ type: 'join_room', roomId: roomId2, username: '速手B' }));
  await wait(600);

  // Both send bids nearly simultaneously
  d1.send(JSON.stringify({ type: 'bid', amount: 500 }));
  d2.send(JSON.stringify({ type: 'bid', amount: 600 }));
  await wait(500);

  const allBids = [...msgsD1, ...msgsD2].filter(m => m.type === 'bid' && m.leaderboard);
  assert(allBids.length >= 1, '并发出价不崩溃');

  d1.close(); d2.close();
  server.kill();

  console.log(`\n📊 结果: ${passed} 通过, ${failed} 失败\n`);
  process.exit(failed > 0 ? 1 : 0);
}

setTimeout(() => {
  console.log('⏰ 测试超时');
  server.kill();
  process.exit(1);
}, 20000);

server.stderr.on('data', d => {
  const s = d.toString();
  if (s.includes('启动')) {
    console.log('  ℹ️  服务已启动');
    runTests();
  }
});

server.stdout.on('data', d => {
  const s = d.toString();
  if (s.includes('启动')) {
    console.log('  ℹ️  服务已启动');
    runTests();
  }
});
