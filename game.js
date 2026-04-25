import Card from './card.js'
import { RenderScene } from './ui.js'

/**
 * @typedef {Object} VoteResults
 * @property {number} totalVotes - Total number of votes cast
 * @property {number} yesVotes - Number of yes votes
 * @property {number} noVotes - Number of no votes
 */

/**
 * @typedef {Object} VerificationResult
 * @property {boolean} valid - Whether the action is valid
 * @property {string} [reason] - Reason if invalid
 */

/**
 * @typedef {Object} SubmissionResult
 * @property {boolean} accepted - Whether the submission was accepted
 * @property {string} [reason] - Reason if rejected
 * @property {Card} [card] - The submitted card
 * @property {string} [playerId] - The player who submitted
 */

/**
 * @typedef {Object} ResolutionResult
 * @property {boolean} success - Whether the turn was successful
 * @property {VoteResults} results - Vote tally
 * @property {Card} [card] - The card that was played
 */

class GameState {
  constructor(peerId, peerIds = []) {
    this.ongoing = false
    this.peerId = peerId
    this.peerIds = peerIds
    this.currentPlayerIndex = 0
    this.playedCards = []

    this.pendingCard = null
    /** Peer that intiated the vote */
    this.pendingPeer = null

    this.votes = new Map()
    this.voteTimeout = null
    /** @type {Card[]}*/
    this.hand = []
    /** @type {{string: int}}*/
    this.handCount = {}
  }
  startGame(hand) {
    this.reset()
    this.ongoing = true
    this.handCount = this.peerIds.reduce((accDict, id) => {
      accDict[id] = 5
      return accDict
    }, {})
    this.hand = hand
  }

  /**
   * Gets the current player's ID
   */
  get currentPlayer() {
    return this.peerIds[this.currentPlayerIndex]
  }

  /**
   * Checks if it's the local peer's turn
   */
  get isMyTurn() {
    return this.currentPlayer === this.peerId
  }

  /**
   * Updates the list of peers
   */
  setPeers(peerIds) {
    this.peerIds = peerIds
    if (this.currentPlayerIndex >= peerIds.length) {
      this.currentPlayerIndex = 0
    }
  }

  /**
   * Verifies if a player can play a card
   */
  verifyTurn(card, playerId) {
    if (playerId !== this.currentPlayer) {
      return { valid: false, reason: `Not your turn. Current turn: ${this.currentPlayer}` }
    }

    if (!card || !(card instanceof Card)) {
      return { valid: false, reason: 'Invalid card' }
    }
    return { valid: true, gameOver: this.playedCards.length + this.hand.length + sum(this.handCount.values) >= 52 }
  }

  /**
   * Checks if a peer can vote
   */
  canVote(playerId) {
    if (this.pendingCard === null) return false
    if (this.votes.has(playerId)) return false
    return true
  }

  /**
   * Attempts to submit a card for the current turn
   */
  submitCard(card, playerId) {
    if (!this.verifyTurn(card, playerId).valid) {
      return { accepted: false, reason: `Not your turn. Current turn: ${this.currentPlayer}` }
    }

    this.pendingCard = card
    this.pendingPeer = playerId
    this.votes.clear()
    this.votes.set(playerId, 'yes')

    return { accepted: true, card, playerId }
  }

  /**
   * Casts a vote on the pending card
   */
  castVote(playerId, vote) {
    if (!this.canVote(playerId)) {
      return { accepted: false, reason: 'Cannot vote now' }
    }

    if (vote !== 'yes' && vote !== 'no') {
      return { accepted: false, reason: 'Invalid vote' }
    }

    this.votes.set(playerId, vote)
    return { accepted: true, voteCount: this.votes.length }
  }

  /**
   * Gets current vote tally
   */
  getVoteResults() {
    const voteValues = [...this.votes.values()]
    const yesVotes = voteValues.filter(v => v === 'yes').length
    const noVotes = voteValues.filter(v => v === 'no').length

    return {
      totalVotes: this.votes.size,
      yesVotes,
      noVotes
    }
  }

  /**
   * Resolves the turn based on votes
   */
  resolveTurn() {
    const results = this.getVoteResults()
    const majorityRequired = Math.floor(this.peerIds.length / 2) + 1

    if (results.yesVotes >= majorityRequired && this.pendingCard) {
      this.playedCards.push(this.pendingCard)
      this.handCount[this.pendingPeer] -= 1
      this.advanceTurn()
      return { success: true, card, results }
    }

    return { success: false, results }
  }

  /**
   * Moves to the next player's turn
   */
  advanceTurn() {
    this.pendingCard = null
    this.pendingPeer = null
    this.votes.clear()
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.peerIds.length
  }

  /**
   * Resets the game state
   */
  reset() {
    this.ongoing = false
    this.playedCards = []
    this.pendingCard = null
    this.votes.clear()
    this.currentPlayerIndex = 0
  }
}

export default GameState
