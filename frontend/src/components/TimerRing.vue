<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeLeft: { type: Number, default: 0 },
  status: { type: String, default: 'waiting' }
})

const TOTAL_TIME = 30
const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const fraction = computed(() => {
  if (props.status === 'waiting') return 1
  if (props.status === 'ended') return 0
  return Math.max(0, props.timeLeft / TOTAL_TIME)
})

const dashOffset = computed(() => {
  return CIRCUMFERENCE * (1 - fraction.value)
})

const ringColor = computed(() => {
  if (props.status === 'ended') return '#ef4444'
  if (props.status === 'waiting') return '#0d9488'
  if (props.timeLeft <= 5) return '#ef4444'
  if (props.timeLeft <= 10) return '#f59e0b'
  return '#0d9488'
})

const displayTime = computed(() => {
  if (props.status === 'waiting') return '···'
  if (props.status === 'ended') return '0'
  return String(props.timeLeft)
})
</script>

<template>
  <div class="timer-ring">
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle
        cx="70" cy="70" :r="RADIUS"
        fill="none"
        stroke="#2a2a3a"
        stroke-width="6"
      />
      <circle
        cx="70" cy="70" :r="RADIUS"
        fill="none"
        :stroke="ringColor"
        stroke-width="6"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90 70 70)"
        class="timer-arc"
      />
    </svg>
    <div class="timer-text" :style="{ color: ringColor }">
      {{ displayTime }}
    </div>
  </div>
</template>

<style scoped>
.timer-ring {
  position: relative;
  width: 140px;
  height: 140px;
}

.timer-arc {
  transition: stroke-dashoffset 1s linear, stroke 0.5s ease;
}

.timer-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  color: #0d9488;
  transition: color 0.5s ease;
}
</style>
