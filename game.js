import { Card } from './card.js'
import { RenderScene } from './ui.js'
import Deck from './deck.js'

/**
 * @typedef {Object} Play
 * @property {Card} card
 * @property {string[]} actions
 */
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
 * @param {string} id 
 * @param {string[]} actions
 */

class GameState {
  /** @param {Deck} deck */
  constructor(peerCount, myPosition, deck) {
    this.ongoing = false
    this.myPosition = myPosition
    this.peerCount = peerCount
    this.currentPlayerIndex = 0
    this.playedCards = []

    this.pendingCard = null
    /** Peer that intiated the vote */
    this.pendingPeer = null
    this.pendingOperation = null

    this.votes = new Map()
    this.voteTimeout = null
    /** @type {Card[]}*/
    this.hand = []
    /** @type {int}*/
    this.handCount = []
    /** @type {Deck}*/
    this.deck = deck
  }
  startGame() {
    this.reset()
    this.ongoing = true
    this.handCount = Array(this.peerCount).fill(3);

    let i = 0
    for (; i < this.myPosition; i++) {
      this.deck.deal()
      this.deck.deal()
      this.deck.deal()
    }
    this.hand.push(this.deck.deal())
    this.hand.push(this.deck.deal())
    this.hand.push(this.deck.deal())
    i++
    for (; i < this.peerCount; i++) {
      this.deck.deal()
      this.deck.deal()
      this.deck.deal()
    }

  }


  playCard() {
    this.playedCards.push(this.pendingCard)
    this.handCount[this.pendingPeer] -= 1
    if (this.pendingPeer == this.myPosition) {
      this.hand = this.hand.filter(card => card.hashCode != this.pendingCard.hashCode)
    }
    this.advanceTurn()
  }

  drawCard() {
    this.handCount[this.pendingPeer] += 1
    const nextCard = this.deck.deal()
    console.log("drawing")
    console.log(this.pendingPeer, this.myPosition)
    if (this.pendingPeer == this.myPosition) {
      this.hand.push(nextCard)
    }
  }

  /**
   * Verifies if a player can play a card
   * @param {Play} play 
   */
  verifyTurn(card, playerId) {
    if (playerId != this.currentPlayerIndex) {
      return { valid: false, reason: `Not your turn. Current turn: ${this.currentPlayerIndex}` }
    }

    if (!card || !(card instanceof Card)) {
      return { valid: false, reason: 'Invalid card' }
    }

    return { valid: true }
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
  submitCard(card, playerId, operation) {
    const result = this.verifyTurn(card, playerId).valid
    if (!result) {
      return { accepted: false, reason: `Not your turn. Current turn: ${this.currentPlayerIndex}` }
    }

    this.pendingCard = card
    this.pendingPeer = playerId
    this.pendingOperation = operation
    this.votes.clear()
    this.votes.set(playerId, 'yes')

    return { accepted: true, card, playerId }
  }

  /**
   * Casts a vote on the pending card
   */
  castVote(playerId, vote) {
    this.votes.set(playerId, vote)
    return this.votes.size
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
    const majorityRequired = Math.floor(this.peerCount / 2) + 1
    console.log("resolving")
    if (results.yesVotes >= majorityRequired && this.pendingCard) {
      switch (this.pendingOperation) {
        case 'play':
          this.playCard()
          break
        case 'draw':
          this.drawCard()
          this.advanceTurn()
          break
        default:
          console.warn("Operation unknown: ", this.pendingOperation)
          break
      }
    } else {
      this.drawCard()
    }
  }

  /**
   * Moves to the next player's turn
   */
  advanceTurn() {
    this.pendingCard = null
    this.pendingPeer = null
    this.pendingOperation = null
    this.votes.clear()
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % (this.peerCount + 1)
  }

  /**
   * Resets the game state
   */
  reset() {
    this.ongoing = false
    this.playedCards = []
    this.pendingCard = null
    this.pendingPeer = null
    this.pendingOperation = null
    this.votes.clear()
    this.currentPlayerIndex = 0
  }
}

export default GameState
