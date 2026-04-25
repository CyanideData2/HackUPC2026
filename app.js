// For interactive documentation and code auto-completion in editor
/** @typedef {import('pear-interface')} */
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
import Card from './card.js'
import GameState from './game.js'
import { RenderScene } from './ui.js'

const { teardown } = Pear

const swarm = new Hyperswarm({ maxPeers: 6 })
const peers = new Map()
let myPeerId = null
/** @type GameState */
let gameState = null

teardown(() => swarm.destroy())

swarm.on('connection', (peer) => {
  const peerId = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  peers.set(peerId, peer)

  peer.on('data', (message) => onMessageReceived(peerId, message))
  peer.on('error', (e) => {
    console.log(`Connection error: ${e}`)
    peers.delete(peerId)
  })

  updatePeersCount()

  if (gameState) {
    const allPeerIds = [...peers.keys()]
    gameState.setPeers(allPeerIds)
  }
})

swarm.on('update', updatePeersCount)

/**
 * Updates the peers count display
 */
function updatePeersCount() {
  document.querySelector('#peers-count').textContent = peers.size
}

/**
 * Joins a game swarm
 */
async function joinSwarm(topicBuffer) {
  document.querySelector('#setup').classList.add('hidden')
  document.querySelector('#loading').classList.remove('hidden')

  const discovery = swarm.join(topicBuffer, { client: true, server: true })
  await discovery.flushed()

  myPeerId = b4a.toString(topicBuffer, 'hex').substr(0, 6)
  gameState = new GameState(myPeerId, [...peers.keys()])

  document.querySelector('#loading').classList.add('hidden')
  document.querySelector('#game').classList.remove('hidden')
  updateTurnIndicator()
}

/**
 * Creates a new game room
 */
async function createChatRoom() {
  const topicBuffer = crypto.randomBytes(32)
  joinSwarm(topicBuffer)
}

/**
 * Joins an existing game room
 */
async function joinCardRoom(e) {
  e.preventDefault()
  const topicStr = document.querySelector('#join-card-room-id').value
  const topicBuffer = b4a.from(topicStr, 'hex')
  joinSwarm(topicBuffer)
}

/**
 * Broadcasts a message to all peers
 */
function broadcastMessage(message) {
  peers.forEach(peer => peer.write(message))
}

/**
 * Handles incoming messages from peers
 */
function onMessageReceived(peerId, message) {
  try {
    const data = JSON.parse(message.toString())

    switch (data.type) {
      case 'play':
        handleCardPlay(peerId, data)
        break
      case 'vote':
        handleVote(peerId, data)
        break
      case 'turn':
        handleTurnUpdate(peerId, data)
        break
    }
  } catch (e) {
    console.log('Failed to parse message:', e)
  }
}

/**
 * Handles an attempted card play
 */
function handleCardPlay(senderId, data) {
  const card = new Card(data.rank, data.suit)
  const result = gameState.submitCard(card, senderId)

  if (result.accepted) {
    broadcastVoteRequest(senderId, card)
  } else {
    const response = JSON.stringify({
      type: 'vote',
      card: null,
      vote: 'no',
      reason: result.reason
    })
    broadcastMessage(response)
  }
}

/**
 * Broadcasts a vote request to all peers
 */
function broadcastVoteRequest(senderId, card) {
  const message = JSON.stringify({
    type: 'vote-request',
    card: { rank: card.rank, suit: card.suit },
    senderId
  })
  broadcastMessage(message)
}

/**
 * Handles an incoming vote
 */
function handleVote(voterId, data) {
  if (voterId === myPeerId) return

  const result = gameState.castVote(voterId, data.vote)

  if (result.accepted) {
    const results = gameState.getVoteResults()
    const peerCount = peers.size
    const majorityRequired = Math.floor(peerCount / 2) + 1

    if (results.totalVotes >= peerCount) {
      const resolved = gameState.resolveTurn()
      broadcastTurnResult(resolved)
    }
  }
}
/**
 * Broadcasts the turn resolution result
 */
function broadcastTurnResult(resolved) {
  const message = JSON.stringify({
    type: 'turn-result',
    success: resolved.success,
    card: resolved.card ? { rank: resolved.card.rank, suit: resolved.card.suit } : null,
    results: resolved.results
  })
  broadcastMessage(message)
}

/**
 * Handles turn updates from peers
 */
function handleTurnUpdate(peerId, data) {
  if (data.peerIds) {
    gameState.setPeers(data.peerIds)
  }
  if (data.currentPlayerIndex !== undefined) {
    gameState.currentPlayerIndex = data.currentPlayerIndex
  }
  updateTurnIndicator()
}

/**
 * Updates the turn indicator UI
 */
function updateTurnIndicator() {
  const indicator = document.querySelector('#turn-indicator')
  if (indicator) {
    indicator.textContent = gameState.isMyTurn ? 'Your Turn!' : `${gameState.currentPlayer}'s Turn`
  }

  const playBtn = document.querySelector('#play-card-btn')
  if (playBtn) {
    playBtn.disabled = !gameState.isMyTurn
  }
}

/**
 * Attempts to play a card
 */
function playCard(rank, suit) {
  if (!gameState.isMyTurn) {
    return { success: false, reason: 'Not your turn' }
  }

  const card = new Card(rank, suit)
  const result = gameState.submitCard(card, myPeerId)

  if (result.accepted) {
    const message = JSON.stringify({
      type: 'play',
      rank: card.rank,
      suit: card.suit
    })
    broadcastMessage(message)
    return { success: true }
  }

  return { success: false, reason: result.reason }
}

/**
 * Casts a vote on the pending card
 */
function castVote(vote) {
  if (!gameState.canVote(myPeerId)) {
    return { success: false, reason: 'Cannot vote now' }
  }

  const result = gameState.castVote(myPeerId, vote)

  if (result.accepted) {
    const message = JSON.stringify({
      type: 'vote',
      vote: vote
    })
    broadcastMessage(message)
    return { success: true }
  }

  return { success: false, reason: result.reason }
}


document.querySelector('#create-card-room').addEventListener('click', createChatRoom)
document.querySelector('#join-form').addEventListener('submit', joinCardRoom)

export { playCard, castVote, gameState }
