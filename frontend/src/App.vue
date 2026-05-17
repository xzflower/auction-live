<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from './composables/useWebSocket.js'
import LandingPage from './components/LandingPage.vue'
import AuctionRoom from './components/AuctionRoom.vue'

const currentView = ref('landing')
const currentUser = ref('')
const currentRoom = ref(null)
const createdRoomId = ref('')

const ws = useWebSocket()
let removeMessageHandler = null

onMounted(() => {
  ws.connect('ws://localhost:3000')
  removeMessageHandler = ws.onMessage(handleMessage)
})

onUnmounted(() => {
  if (removeMessageHandler) removeMessageHandler()
  ws.disconnect()
})

function handleMessage(data) {
  switch (data.type) {
    case 'room_created':
      createdRoomId.value = data.roomId
      break
    case 'room_joined':
      currentRoom.value = data.room
      currentView.value = 'room'
      break
    case 'start':
      if (currentRoom.value) {
        currentRoom.value.status = 'active'
        currentRoom.value.timeLeft = data.timeLeft
        currentRoom.value.item = data.item
        currentRoom.value.minBid = data.minBid
      }
      break
    case 'tick':
      if (currentRoom.value) {
        currentRoom.value.timeLeft = data.timeLeft
      }
      break
    case 'bid':
      if (currentRoom.value) {
        currentRoom.value.bids = data.leaderboard
        currentRoom.value.timeLeft = data.timeLeft
      }
      break
    case 'bid_error':
      alert(data.reason)
      break
    case 'hammer':
      if (currentRoom.value) {
        currentRoom.value.status = 'ended'
        currentRoom.value.winner = data.winner
        currentRoom.value.totalBids = data.totalBids
        currentRoom.value.history = data.history
      }
      break
    case 'error':
      alert(data.message)
      break
  }
}

function handleCreateRoom({ item, minBid }) {
  ws.send({ type: 'create_room', item, minBid })
}

function handleJoinRoom({ roomId, username }) {
  currentUser.value = username
  ws.send({ type: 'join_room', roomId, username })
}

function handlePlaceBid(amount) {
  ws.send({ type: 'bid', amount })
}

function handleLeave() {
  currentView.value = 'landing'
  currentRoom.value = null
  currentUser.value = ''
  createdRoomId.value = ''
  ws.disconnect()
  ws.connect('ws://localhost:3000')
}

function handleRestart() {
  ws.send({ type: 'restart' })
}
</script>

<template>
  <LandingPage
    v-if="currentView === 'landing'"
    :created-room-id="createdRoomId"
    @create-room="handleCreateRoom"
    @join-room="handleJoinRoom"
  />
  <AuctionRoom
    v-else
    :room="currentRoom"
    :user="currentUser"
    :ws-connected="ws.connected.value"
    @bid="handlePlaceBid"
    @leave="handleLeave"
    @restart="handleRestart"
  />
</template>
