// For interactive documentation and code auto-completion in editor
/** @typedef {import('pear-interface')} */
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
import Card from './card.js'
import GameState from './game.js'

const { teardown } = Pear

/** @type {Hyperswarm} */
const swarm = new Hyperswarm({ maxPeers: 6 })

/** @type {Map<string, import('stream').Duplex>} */
const peers = new Map()

/** @type {string|null} */
let myPeerId = null

/** @type {GameState|null} */
let gameState = null

teardown(() => swarm.destroy())

/**
 * Handles new peer connections
 * @param {import('stream').Duplex} peer - The peer connection
 */
swarm.on('connection', (peer) => {
  /** @type {string} */
  const peerId = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  peers.set(peerId, peer)

  peer.on('data', (/** @type {Buffer} */ message) => onMessageReceived(peerId, message))
  peer.on('error', (/** @type {Error} */ e) => {
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
 * @param {Buffer} topicBuffer - The topic buffer for the swarm
 */
async function joinSwarm(topicBuffer) {
  document.querySelector('#setup').classList.add('hidden')
  document.querySelector('#loading').classList.remove('hidden')

  const discovery = swarm.join(topicBuffer, { client: true, server: true })
  await discovery.flush()

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
 * @param {Event} e - Form submit event
 */
async function joinCardRoom(e) {
  e.preventDefault()
  const topicStr = document.querySelector('#join-card-room-id').value
  const topicBuffer = b4a.from(topicStr, 'hex')
  joinSwarm(topicBuffer)
}

/**
 * Broadcasts a message to all peers
 * @param {string|Buffer} message - The message to send
 */
function broadcastMessage(message) {
  peers.forEach(peer => peer.write(message))
}

/**
 * Handles incoming messages from peers
 * @param {string} peerId - The sender's peer ID
 * @param {Buffer} message - The raw message data
 */
function onMessageReceived(peerId, message) {
  try {
    /** @type {{type: string, rank?: number, suit?: string, vote?: string, senderId?: string, peerIds?: string[], currentPlayerIndex?: number}} */
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
 * @param {string} senderId - The sender's peer ID
 * @param {{type: string, rank: number, suit: string}} data - The play data
 */
function handleCardPlay(senderId, data) {
  const card = new Card(data.rank, data.suit)
  const result = gameState.submitCard(card, senderId)

  if (result.accepted) {
    broadcastVoteRequest(senderId, card)
  } else {
    /** @type {{type: string, card: null, vote: string, reason: string}} */
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
 * @param {string} senderId - The sender's ID
 * @param {Card} card - The card being voted on
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
 * @param {string} voterId - The voter's peer ID
 * @param {{type: string, vote: string}} data - Vote data
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
 * @param {{success: boolean, card?: Card, results: {totalVotes: number, yesVotes: number, noVotes: number}}} resolved
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
 * @param {string} peerId - The sender's peer ID
 * @param {{type: string, peerIds?: string[], currentPlayerIndex?: number}} data
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
 * @param {number} rank - Card rank
 * @param {string} suit - Card suit
 * @returns {{success: boolean, reason?: string}}
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
 * @param {'yes'|'no'} vote - The vote
 * @returns {{success: boolean, reason?: string}}
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