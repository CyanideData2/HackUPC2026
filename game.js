import Card from './card.js'

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

/**
 * Manages game state including turn tracking and voting
 */
class GameState {
  /**
   * @param {string} peerId - The local peer's ID
   * @param {string[]} [peerIds=[]] - Array of all peer IDs
   */
  constructor(peerId, peerIds = []) {
    /** @type {string} */
    this.peerId = peerId

    /** @type {string[]} */
    this.peerIds = peerIds

    /** @type {number} */
    this.currentPlayerIndex = 0

    /** @type {Card[]} */
    this.playedCards = []

    /** @type {Card|null} */
    this.pendingCard = null

    /** @type {Map<string, string>} */
    this.votes = new Map()

    /** @type {NodeJS.Timeout|null} */
    this.voteTimeout = null
  }

  /**
   * Gets the current player's ID
   * @returns {string}
   */
  get currentPlayer() {
    return this.peerIds[this.currentPlayerIndex]
  }

  /**
   * Checks if it's the local peer's turn
   * @returns {boolean}
   */
  get isMyTurn() {
    return this.currentPlayer === this.peerId
  }

  /**
   * Updates the list of peers
   * @param {string[]} peerIds - New list of peer IDs
   */
  setPeers(peerIds) {
    this.peerIds = peerIds
    if (this.currentPlayerIndex >= peerIds.length) {
      this.currentPlayerIndex = 0
    }
  }

  /**
   * Verifies if a player can play a card
   * @param {Card} card - The card to play
   * @param {string} playerId - The player's ID
   * @returns {VerificationResult}
   */
  verifyTurn(card, playerId) {
    if (playerId !== this.currentPlayer) {
      return { valid: false, reason: `Not your turn. Current turn: ${this.currentPlayer}` }
    }

    if (!card || !(card instanceof Card)) {
      return { valid: false, reason: 'Invalid card' }
    }

    return { valid: true }
  }

  /**
   * Checks if a peer can vote
   * @param {string} playerId - The peer's ID
   * @returns {boolean}
   */
  canVote(playerId) {
    if (this.pendingCard === null) return false
    if (this.votes.has(playerId)) return false
    return true
  }

  /**
   * Attempts to submit a card for the current turn
   * @param {Card} card - The card to play
   * @param {string} playerId - The player's ID
   * @returns {SubmissionResult}
   */
  submitCard(card, playerId) {
    const verification = this.verifyTurn(card, playerId)
    if (!verification.valid) {
      return { accepted: false, ...verification }
    }

    this.pendingCard = card
    this.votes.clear()
    this.votes.set(playerId, 'yes')

    return { accepted: true, card, playerId }
  }

  /**
   * Casts a vote on the pending card
   * @param {string} playerId - The voter's ID
   * @param {'yes'|'no'} vote - The vote
   * @returns {{accepted: boolean, reason?: string}}
   */
  castVote(playerId, vote) {
    if (!this.canVote(playerId)) {
      return { accepted: false, reason: 'Cannot vote now' }
    }

    if (vote !== 'yes' && vote !== 'no') {
      return { accepted: false, reason: 'Invalid vote' }
    }

    this.votes.set(playerId, vote)
    return { accepted: true, vote }
  }

  /**
   * Gets current vote tally
   * @returns {VoteResults}
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
   * @returns {ResolutionResult}
   */
  resolveTurn() {
    const results = this.getVoteResults()
    const majorityRequired = Math.floor(this.peerIds.length / 2) + 1

    if (results.yesVotes >= majorityRequired && this.pendingCard) {
      this.playedCards.push(this.pendingCard)
      this.advanceTurn()
      return { success: true, card: this.pendingCard, results }
    }

    return { success: false, results }
  }

  /**
   * Moves to the next player's turn
   */
  advanceTurn() {
    this.pendingCard = null
    this.votes.clear()
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.peerIds.length
  }

  /**
   * Resets the game state
   */
  reset() {
    this.playedCards = []
    this.pendingCard = null
    this.votes.clear()
    this.currentPlayerIndex = 0
  }
}

export default GameState