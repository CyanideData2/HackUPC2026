class Card {
  static SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
  static RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

  constructor(rank, suit) {
    if (!Card.SUITS.includes(suit)) {
      throw new Error(`Invalid suit: ${suit}`)
    }

    if (!Card.RANKS.includes(rank)) {
      throw new Error(`Invalid rank: ${rank}`)
    }

    this.rank = rank
    this.suit = suit
  }

  // Compare this card to another
  compareTo(otherCard) {
    const diff = this.getValue() - otherCard.getValue()

    if (diff > 0) return 1
    if (diff < 0) return -1
    return 0
  }

  equals(otherCard) {
    return this.rank === otherCard.rank && this.suit === otherCard.suit
  }

  toString() {
    return `${this.rank} of ${this.suit}`
  }
  toCode() {
    highs = ['j', 'q', 'k']
    if (self.rank > 10) {
      return "" + highs[self.rank - 11] + self.suit[0]
    } else return "" + self.rank + self.suit[0]
  }
}
export default Card
