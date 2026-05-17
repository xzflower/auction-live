<script setup>
import { ref, computed, watch } from 'vue'
import TimerRing from './TimerRing.vue'
import QuickBids from './QuickBids.vue'
import LeaderBoard from './LeaderBoard.vue'
import ActivityFeed from './ActivityFeed.vue'
import HammerOverlay from './HammerOverlay.vue'

const props = defineProps({
  room: { type: Object, default: null },
  user: { type: String, default: '' },
  wsConnected: { type: Boolean, default: false }
})

const emit = defineEmits(['bid', 'leave', 'restart'])

const bidAmount = ref('')
const activities = ref([])
const showHammer = ref(false)

const status = computed(() => props.room?.status || 'waiting')
const timeLeft = computed(() => props.room?.timeLeft ?? 0)
const bids = computed(() => props.room?.bids || [])
const currentHighestBid = computed(() => {
  if (!bids.value.length) return props.room?.minBid || 0
  return Math.max(...bids.value.map(b => b.amount))
})
const winner = computed(() => props.room?.winner || null)
const totalBids = computed(() => props.room?.totalBids || 0)

watch(status, (val, old) => {
  if (val === 'active' && old === 'waiting') {
    activities.value.push({
      type: 'start',
      text: `竞拍开始！${props.room?.item || ''}`,
      timestamp: Date.now()
    })
    showHammer.value = false
  }
  if (val === 'ended') {
    showHammer.value = true
  }
})

watch(bids, (newBids, oldBids) => {
  if (newBids.length > (oldBids?.length || 0)) {
    const latest = newBids[0]
    if (latest) {
      activities.value.push({
        type: 'bid',
        text: `${latest.username} 出价 ¥${latest.amount.toLocaleString()}`,
        highlight: latest.username,
        timestamp: Date.now()
      })
    }
  }
}, { deep: true })

function handlePlaceBid() {
  const amount = Number(bidAmount.value)
  if (!amount || amount <= 0) return
  emit('bid', amount)
  bidAmount.value = ''
}

function handleQuickBid(amount) {
  bidAmount.value = amount
  emit('bid', amount)
  bidAmount.value = ''
}

function handleLeave() {
  showHammer.value = false
  activities.value = []
  bidAmount.value = ''
  emit('leave')
}

function handleRestart() {
  showHammer.value = false
  activities.value = []
  bidAmount.value = ''
  emit('restart')
}

const statusLabel = computed(() => {
  switch (status.value) {
    case 'waiting': return '等待开始'
    case 'active': return '竞拍中'
    case 'ended': return '已结束'
    default: return status.value
  }
})

const statusClass = computed(() => status.value)
</script>

<template>
  <div class="auction-room">
    <header class="room-header">
      <div class="header-left">
        <h1 class="logo">🔥 直播竞拍</h1>
        <span class="item-name" v-if="room?.item">{{ room.item }}</span>
      </div>
      <div class="header-right">
        <span class="conn-dot" :class="{ on: wsConnected }"></span>
        <span class="conn-text">{{ wsConnected ? '已连接' : '连接中...' }}</span>
        <span class="status-badge" :class="statusClass">{{ statusLabel }}</span>
        <span class="user-badge">{{ user }}</span>
        <button class="btn-leave" @click="handleLeave">离开</button>
      </div>
    </header>

    <div class="room-grid">
      <div class="col-left">
        <div class="panel timer-panel">
          <TimerRing :time-left="timeLeft" :status="status" />
          <div class="bid-controls" v-if="status === 'active'">
            <QuickBids
              :current-highest-bid="currentHighestBid"
              :disabled="status !== 'active'"
              @quick-bid="handleQuickBid"
            />
            <div class="bid-row">
              <input
                v-model="bidAmount"
                type="number"
                class="bid-input"
                placeholder="输入出价金额"
                min="1"
                @keyup.enter="handlePlaceBid"
              />
              <button class="btn-bid" @click="handlePlaceBid" :disabled="!bidAmount">
                出价
              </button>
            </div>
            <div class="min-bid-hint">
              当前最高出价: ¥{{ currentHighestBid.toLocaleString() }}
            </div>
          </div>
          <div class="waiting-hint" v-else-if="status === 'waiting'">
            <p>等待拍卖师开始竞拍...</p>
          </div>
        </div>
      </div>

      <div class="col-right">
        <div class="panel">
          <h3 class="panel-title">🏆 排行榜</h3>
          <LeaderBoard :bids="bids" />
        </div>
        <div class="panel">
          <h3 class="panel-title">📋 活动日志</h3>
          <ActivityFeed :activities="activities" />
        </div>
      </div>
    </div>

    <HammerOverlay
      v-if="showHammer && winner"
      :winner="winner"
      :total-bids="totalBids"
      @restart="handleRestart"
      @leave="handleLeave"
    />
  </div>
</template>

<style scoped>
.auction-room {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  min-height: 100vh;
}

.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1rem;
  border-bottom: 1px solid #2a2a3a;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: 800;
  background: linear-gradient(135deg, #14b8a6, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.item-name {
  font-size: 0.9rem;
  color: #8888a0;
  padding: 0.2rem 0.6rem;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.conn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  transition: background 0.3s;
}

.conn-dot.on {
  background: #059669;
  box-shadow: 0 0 6px #059669;
}

.conn-text {
  font-size: 0.8rem;
  color: #5c5c78;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: rgba(92, 92, 120, 0.2);
  color: #5c5c78;
}

.status-badge.active {
  background: rgba(13, 148, 136, 0.15);
  color: #14b8a6;
}

.status-badge.ended {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.user-badge {
  font-size: 0.8rem;
  color: #14b8a6;
  padding: 0.2rem 0.5rem;
  background: rgba(13, 148, 136, 0.1);
  border-radius: 4px;
}

.btn-leave {
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  border: 1px solid #2a2a3a;
  border-radius: 6px;
  color: #5c5c78;
  transition: border-color 0.2s, color 0.2s;
}

.btn-leave:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.room-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

@media (max-width: 720px) {
  .room-grid {
    grid-template-columns: 1fr;
  }
}

.col-left,
.col-right {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.panel {
  background: #1a1a26;
  border: 1px solid #2a2a3a;
  border-radius: 12px;
  padding: 1.25rem;
}

.panel-title {
  font-size: 1rem;
  font-weight: 700;
  color: #14b8a6;
  margin-bottom: 0.75rem;
}

.timer-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.bid-controls {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.bid-row {
  display: flex;
  gap: 0.5rem;
}

.bid-input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  color: #e2e8f0;
  outline: none;
  font-size: 1rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  transition: border-color 0.2s;
}

.bid-input:focus {
  border-color: #0d9488;
}

.btn-bid {
  padding: 0.6rem 1.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0d9488, #059669);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.btn-bid:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-bid:active:not(:disabled) {
  transform: translateY(0);
}

.btn-bid:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.min-bid-hint {
  text-align: center;
  font-size: 0.8rem;
  color: #5c5c78;
}

.waiting-hint {
  text-align: center;
  color: #5c5c78;
  font-size: 0.9rem;
}
</style>
