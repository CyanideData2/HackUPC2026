// For interactive documentation and code auto-completion in editor
/** @typedef {import('pear-interface')} */
import Hyperswarm from 'hyperswarm'
import crypto from 'hypercore-crypto'
import b4a from 'b4a'
import { Card, getDeck } from './card.js'
import GameState from './game.js'
import { RenderScene } from './ui.js'
//import ProtocolEngine from './protocolEngine.js'
//import Deck from './deck.js'

const { teardown } = Pear

const swarm = new Hyperswarm({ maxPeers: 6 })
const peers = new Map()
let topicBuffer = null
let myPeerId = null
/** @type GameState */
let gameState = null
let protocolEngine = null

const DEBOG = true

teardown(() => swarm.destroy())

swarm.on('connection', (peer) => {
  const peerId = b4a.toString(peer.remotePublicKey, 'hex').substr(0, 6)
  peers.set(peerId, peer)
  console.log(peers)

  peer.on('data', (message) => onMessageReceived(peerId, message))
  peer.on('error', (e) => {
    console.log(`Connection error: ${e}`)
    peers.delete(peerId)
  })

  updatePeersCount()

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
async function joinSwarm() {
  document.querySelector('#setup').classList.add('hidden')
  document.querySelector('#loading').classList.remove('hidden')

  const discovery = swarm.join(topicBuffer, { client: true, server: true })
  await discovery.flushed()

  myPeerId = b4a.toString(topicBuffer, 'hex').substr(0, 6)
}
async function updateGameListeners() {
  var cards = document.getElementsByClassName("card");
  for (const card of cards) {
    card.addEventListener("click", async (e) => {
      //find card name
      //find card in hand
    })
  }
}

async function startGame() {
  gameState = new GameState(myPeerId, [...peers.keys()])
  //const deck = new Deck()
  //protocolEngine = new ProtocolEngine(gameState, deck, peers, myPeerId)
  
  //protocolEngine.initiateShuffle();
  //console.log('Shuffling deck with peers')
  
  gameState.startGame([])
  RenderScene(gameState)
  updateGameListeners()
  document.querySelector('#header').classList.add('hidden')
  document.querySelector('#game-board').classList.remove('hidden')
  document.querySelector('#game-hand').classList.remove('hidden')
}
async function loadLobby() {
  document.querySelector('#loading').classList.add('hidden')
  document.querySelector("#game-id").innerHTML = topicBuffer.toString("hex")
  document.querySelector('#game').classList.remove('hidden')

  document.querySelector('#start-game').addEventListener("click", () => {
	
    broadcastMessage(
      JSON.stringify({
        type: 'start',
      })
    )
    startGame()
  })

}
async function unloadGame() {
  document.querySelector('#setup').classList.remove('hidden')
  document.querySelector('#loading').classList.add('hidden')
  document.querySelector('#game').classList.add('hidden')

  swarm.leave(topicBuffer)
  gameState = null
  topicBuffer = null
}

/**
 * Creates a new game room
 */
async function createCardRoom() {
  topicBuffer = crypto.randomBytes(32)
  await joinSwarm(topicBuffer)
  loadLobby(topicBuffer)
}

/**
 * Joins an existing game room
 */
async function joinCardRoom(e) {
  e.preventDefault()
  const topicStr = document.querySelector('#join-card-room-id').value
  topicBuffer = b4a.from(topicStr, 'hex')
  await joinSwarm(topicBuffer)
  loadLobby(topicBuffer)
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
      case 'PROTOCOL_SHUFFLE_STEP':
		protocolEngine.handleShuffleStep(data.deck)
		break
	  case 'PROTOCOL_SHUFFLE_FINAL':
		protocolEngine.handleShuffleFinal(data.deck)
		break
      case 'start':
        console.log(gameState)
        if (gameState == null || !gameState.ongoing) {
          startGame()
        }
        break
      default:
        console.warn(`Unknown message type "${data.type}" from ${peerId}. Ignoring.`)
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

  if (result.accepted && result.voteCount >= peerCount) {
    const resolved = gameState.resolveTurn()
    if (!resolved.success) {
      console.warn("turn couldn't resolve")
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
}


/**
 * Attempts to play a card
 */
function playCard(card) {
  if (!gameState.isMyTurn) {
    return { success: false, reason: 'Not your turn' }
  }

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


document.querySelector('#create-card-room').addEventListener('click', createCardRoom)
document.querySelector('#join-form').addEventListener('submit', joinCardRoom)
document.addEventListener("keypress", (e) => {
  if (e.key == 'q') {
    if (gameState) {
      console.log("leaving")
      unloadGame()
    }
  }
})

export { playCard, castVote, gameState, swarm }
