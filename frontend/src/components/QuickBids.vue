<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentHighestBid: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['quick-bid'])

const options = computed(() => {
  const base = props.currentHighestBid || 0
  return [
    { label: '+10%', amount: Math.ceil(base * 1.1) },
    { label: '+20%', amount: Math.ceil(base * 1.2) },
    { label: '+50%', amount: Math.ceil(base * 1.5) },
    { label: '×2', amount: base * 2 || base }
  ]
})

function handleClick(amount) {
  if (amount <= 0) return
  emit('quick-bid', amount)
}
</script>

<template>
  <div class="quick-bids">
    <span class="quick-label">快捷出价</span>
    <div class="pills">
      <button
        v-for="opt in options"
        :key="opt.label"
        class="pill"
        :disabled="disabled || currentHighestBid <= 0"
        @click="handleClick(opt.amount)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.quick-bids {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quick-label {
  font-size: 0.75rem;
  color: #5c5c78;
  white-space: nowrap;
}

.pills {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.pill {
  padding: 0.25rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #14b8a6;
  background: rgba(13, 148, 136, 0.1);
  border: 1px solid rgba(13, 148, 136, 0.25);
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}

.pill:hover:not(:disabled) {
  background: rgba(13, 148, 136, 0.2);
  transform: translateY(-1px);
}

.pill:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
