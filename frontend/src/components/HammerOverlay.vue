<script setup>
defineProps({
  winner: { type: Object, default: null },
  totalBids: { type: Number, default: 0 }
})

const emit = defineEmits(['restart', 'leave'])
</script>

<template>
  <div class="overlay">
    <div class="hammer-card">
      <div class="hammer-icon">🔨</div>
      <h2 class="hammer-title">落锤成交！</h2>
      <div class="winner-section" v-if="winner">
        <span class="winner-label">成交者</span>
        <span class="winner-name">{{ winner.username }}</span>
        <span class="winner-amount">¥{{ winner.amount.toLocaleString() }}</span>
      </div>
      <div class="stats">
        <span class="stat">共 {{ totalBids }} 次出价</span>
      </div>
      <div class="actions">
        <button class="btn-restart" @click="emit('restart')">再来一轮</button>
        <button class="btn-back" @click="emit('leave')">返回大厅</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.85);
  animation: fadeIn 0.3s ease;
}

.hammer-card {
  background: #1a1a26;
  border: 1px solid #2a2a3a;
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hammer-icon {
  font-size: 3.5rem;
  animation: bounce 1s ease infinite;
}

.hammer-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #f59e0b;
  margin: 1rem 0;
}

.winner-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 1.25rem;
}

.winner-label {
  font-size: 0.8rem;
  color: #5c5c78;
}

.winner-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #14b8a6;
}

.winner-amount {
  font-size: 2rem;
  font-weight: 800;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: #f59e0b;
}

.stats {
  margin-bottom: 1.5rem;
  font-size: 0.85rem;
  color: #8888a0;
}

.actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-restart {
  padding: 0.6rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0d9488, #059669);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.btn-restart:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-back {
  padding: 0.6rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #8888a0;
  background: transparent;
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, color 0.2s;
}

.btn-back:hover {
  border-color: #8888a0;
  color: #e2e8f0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounceIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
