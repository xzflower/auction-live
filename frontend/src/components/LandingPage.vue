<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  createdRoomId: { type: String, default: '' }
})

const emit = defineEmits(['create-room', 'join-room'])

const itemName = ref('')
const minBid = ref('')
const roomId = ref('')
const username = ref('')

watch(() => props.createdRoomId, (val) => {
  if (val) roomId.value = val
})

function handleCreate() {
  if (!itemName.value.trim() || !minBid.value) return
  emit('create-room', { item: itemName.value.trim(), minBid: Number(minBid.value) })
}

function handleJoin() {
  if (!roomId.value.trim() || !username.value.trim()) return
  emit('join-room', { roomId: roomId.value.trim(), username: username.value.trim() })
}
</script>

<template>
  <div class="landing">
    <header class="landing-header">
      <h1 class="logo">🔥 直播竞拍</h1>
      <p class="tagline">毫秒级实时出价 · 动态排名 · 落锤成交</p>
    </header>

    <div class="cards">
      <div class="card">
        <h2 class="card-title">创建拍卖</h2>
        <div class="field">
          <label>拍品名称</label>
          <input v-model="itemName" placeholder="输入拍品名称" @keyup.enter="handleCreate" />
        </div>
        <div class="field">
          <label>起拍价 (¥)</label>
          <input v-model="minBid" type="number" min="1" placeholder="输入最低出价" @keyup.enter="handleCreate" />
        </div>
        <button class="btn-primary" @click="handleCreate" :disabled="!itemName.trim() || !minBid">
          创建房间
        </button>
        <Transition name="fade">
          <div v-if="createdRoomId" class="room-id-display">
            <span class="room-id-label">房间号</span>
            <span class="room-id-value">{{ createdRoomId }}</span>
          </div>
        </Transition>
      </div>

      <div class="card">
        <h2 class="card-title">加入拍卖</h2>
        <div class="field">
          <label>房间号</label>
          <input v-model="roomId" placeholder="输入房间号" @keyup.enter="handleJoin" />
        </div>
        <div class="field">
          <label>用户名</label>
          <input v-model="username" placeholder="输入你的昵称" @keyup.enter="handleJoin" />
        </div>
        <button class="btn-primary" @click="handleJoin" :disabled="!roomId.trim() || !username.trim()">
          加入房间
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.landing {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.landing-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo {
  font-size: 2.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #14b8a6, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tagline {
  margin-top: 0.5rem;
  color: #5c5c78;
  font-size: 0.95rem;
  letter-spacing: 0.05em;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  width: 100%;
}

@media (max-width: 640px) {
  .cards {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #1a1a26;
  border: 1px solid #2a2a3a;
  border-radius: 12px;
  padding: 1.75rem;
  transition: border-color 0.3s;
}

.card:hover {
  border-color: #0d9488;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #14b8a6;
  margin-bottom: 1.25rem;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-size: 0.85rem;
  color: #8888a0;
  margin-bottom: 0.35rem;
}

.field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: #12121a;
  border: 1px solid #2a2a3a;
  border-radius: 8px;
  color: #e2e8f0;
  outline: none;
  transition: border-color 0.2s;
}

.field input:focus {
  border-color: #0d9488;
}

.btn-primary {
  width: 100%;
  padding: 0.7rem;
  margin-top: 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #0d9488, #059669);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.room-id-display {
  margin-top: 1rem;
  padding: 0.75rem;
  background: rgba(13, 148, 136, 0.1);
  border: 1px solid #0d9488;
  border-radius: 8px;
  text-align: center;
}

.room-id-label {
  display: block;
  font-size: 0.75rem;
  color: #8888a0;
  margin-bottom: 0.25rem;
}

.room-id-value {
  font-size: 1.5rem;
  font-weight: 800;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: #14b8a6;
  letter-spacing: 0.1em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s, transform 0.4s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
