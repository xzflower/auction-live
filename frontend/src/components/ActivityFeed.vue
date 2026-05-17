<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  activities: { type: Array, default: () => [] }
})

const feedEl = ref(null)

watch(
  () => props.activities.length,
  async () => {
    await nextTick()
    if (feedEl.value) {
      feedEl.value.scrollTop = feedEl.value.scrollHeight
    }
  }
)

function typeClass(type) {
  return `type-${type}`
}

function formatTimestamp(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <div class="activity-feed" ref="feedEl">
    <div v-if="!activities.length" class="empty">暂无活动</div>
    <TransitionGroup name="feed-item" tag="div">
      <div
        v-for="(act, i) in activities"
        :key="act.timestamp + i"
        class="feed-entry"
        :class="typeClass(act.type)"
      >
        <span class="feed-time">{{ formatTimestamp(act.timestamp) }}</span>
        <span class="feed-text" v-html="act.text.replace(act.highlight, `<span class='hl'>${act.highlight}</span>`)"></span>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.activity-feed {
  max-height: 150px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.empty {
  text-align: center;
  color: #5c5c78;
  font-size: 0.85rem;
  padding: 1rem 0;
}

.feed-entry {
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  font-size: 0.82rem;
  animation: slideIn 0.3s ease;
}

.feed-entry.type-start {
  background: rgba(5, 150, 105, 0.1);
  color: #059669;
}

.feed-entry.type-bid {
  background: rgba(13, 148, 136, 0.06);
  color: #e2e8f0;
}

.feed-entry.type-hammer {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  font-weight: 600;
}

.feed-time {
  color: #5c5c78;
  font-size: 0.72rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  white-space: nowrap;
}

.feed-text {
  flex: 1;
}

.feed-text :deep(.hl) {
  color: #14b8a6;
  font-weight: 700;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feed-item-enter-active {
  transition: all 0.3s ease;
}

.feed-item-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
