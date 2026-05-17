<script setup>
import { computed } from 'vue'

const props = defineProps({
  bids: { type: Array, default: () => [] }
})

const ranked = computed(() => {
  return [...props.bids].sort((a, b) => b.amount - a.amount)
})

function rankBadge(index) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return ''
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="leaderboard">
    <div v-if="!bids.length" class="empty-state">
      暂无出价，开始竞拍吧！
    </div>
    <div v-else class="bid-list">
      <div
        v-for="(bid, i) in ranked"
        :key="bid.username + bid.amount + i"
        class="bid-row"
        :class="{ top: i === 0 }"
      >
        <span class="rank">{{ rankBadge(i) || `#${i + 1}` }}</span>
        <span class="username">{{ bid.username }}</span>
        <span class="amount">¥{{ bid.amount.toLocaleString() }}</span>
        <span class="time">{{ formatTime(bid.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leaderboard {
  min-height: 80px;
}

.empty-state {
  text-align: center;
  color: #5c5c78;
  padding: 1.5rem 0;
  font-size: 0.9rem;
}

.bid-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.bid-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 6px;
  background: rgba(42, 42, 58, 0.3);
  animation: slideIn 0.3s ease;
}

.bid-row.top {
  background: rgba(13, 148, 136, 0.12);
  border: 1px solid rgba(13, 148, 136, 0.25);
}

.rank {
  width: 2rem;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: #8888a0;
}

.username {
  flex: 1;
  font-weight: 600;
  color: #e2e8f0;
  font-size: 0.9rem;
}

.amount {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-weight: 700;
  color: #14b8a6;
  font-size: 0.9rem;
}

.time {
  font-size: 0.75rem;
  color: #5c5c78;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
