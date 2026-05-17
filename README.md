# 🎯 Auction Live - 直播竞拍系统

毫秒级实时出价 · 动态排名 · 落锤成交

## 架构

```
auction-live/
├── server/                # 后端 (Node.js + WebSocket)
│   └── index.js           # HTTP/WS 服务 + 拍卖逻辑
├── frontend/              # 前端 (Vue 3 + Vite)
│   └── src/
│       ├── components/    # 7 个 Vue 组件
│       └── composables/   # WebSocket 通信封装
├── test/
│   └── test.js            # 11 个测试用例
└── public/                # 旧版前端（兼容）
```

## 快速开始

```bash
# 安装后端依赖
npm install

# 构建前端
npm run build-frontend

# 启动服务（生产模式）
npm start

# 开发模式（前后端分离）
# 终端 1: 启动后端
npm run dev
# 终端 2: 启动 Vue 开发服务器
cd frontend && npm run dev
```

访问 http://localhost:3000 即可使用。

## 开发

前端使用 Vue 3 Composition API + Vite，热更新开发：
```bash
cd frontend && npm run dev
```
Vue 开发服务器默认在 http://localhost:5173，WebSocket 请求自动代理到后端 :3000。

## 测试

```bash
npm test
```

包含 11 个测试用例：房间创建、加入、自动开始、出价排序、低价拒绝、倒计时、并发出价等。

## WebSocket 协议

| 方向 | type | 说明 |
|------|------|------|
| C→S | `create_room` | 创建房间，参数: item, minBid |
| S→C | `room_created` | 返回: roomId |
| C→S | `join_room` | 加入房间，参数: roomId, username |
| S→C | `room_joined` | 返回完整房间状态 |
| S→C | `start` | 拍卖开始，携带倒计时 |
| S→C | `tick` | 每秒倒计时更新 |
| C→S | `bid` | 出价，参数: amount |
| S→C | `bid` | 出价成功广播，含排行榜 |
| S→C | `bid_error` | 出价被拒绝 |
| S→C | `hammer` | 落锤成交，含赢家信息 |
| C→S | `restart` | 重置当前房间竞拍 |

## 配色

青绿/翠绿/暖金配色，深色主题，无蓝紫。
