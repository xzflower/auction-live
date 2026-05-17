# 🎯 Auction Live - 直播竞拍系统

**毫秒级实时出价 · 动态排名 · 落锤成交**

基于 Node.js WebSocket 的全链路直播竞拍闭环系统。

## 功能

- 🏠 多房间并发，6位房间号
- ⏱ 30秒倒计时，每次出价延长10秒
- 📊 实时排行榜（金额降序）
- 🔨 落锤成交动画
- 🎨 深色主题，青绿配色

## 快速开始

```bash
npm install
npm start
```

打开 http://localhost:3000

## 测试

```bash
npm test
```

## 技术栈

- **后端:** Node.js + ws (WebSocket)
- **前端:** 纯 HTML/CSS/JS，无框架
- **数据:** 内存存储
