import { ref, onUnmounted } from 'vue'

const connected = ref(false)
const connectionError = ref(null)

let ws = null
let handlers = []
let reconnectTimer = null
let reconnectAttempts = 0
const MAX_RECONNECT_DELAY = 10000

function getReconnectDelay() {
  return Math.min(1000 * 2 ** reconnectAttempts, MAX_RECONNECT_DELAY)
}

export function useWebSocket() {
  function connect(url) {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return
    }

    connectionError.value = null
    ws = new WebSocket(url)

    ws.onopen = () => {
      connected.value = true
      connectionError.value = null
      reconnectAttempts = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        handlers.forEach((fn) => fn(data))
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      connected.value = false
      scheduleReconnect(url)
    }

    ws.onerror = () => {
      connectionError.value = 'Connection failed'
    }
  }

  function send(data) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }

  function onMessage(handler) {
    handlers.push(handler)
    return () => {
      handlers = handlers.filter((fn) => fn !== handler)
    }
  }

  function disconnect() {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
    if (ws) {
      ws.onclose = null
      ws.close()
      ws = null
    }
    connected.value = false
    connectionError.value = null
    handlers = []
  }

  function scheduleReconnect(url) {
    if (reconnectTimer) return
    const delay = getReconnectDelay()
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect(url)
    }, delay)
  }

  onUnmounted(() => {
    // Clean up only the handler, keep the socket alive for other consumers
  })

  return { connected, connectionError, connect, send, onMessage, disconnect }
}
