class Card {

  static SUITS = [0, 1, 2, 3]
  static SUIT_TO_STRING = {0: 'hearts', 1: 'diamonds', 2: 'clubs', 3: 'spades'}
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
    const highs = ['t', 'j', 'q', 'k']
    this.hashCode = this.rank > 9 ? "" + highs[this.rank - 11] + Array.from(this.suit)[0] : "" + this.rank + Array.from(this.suit)[0]
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
    return `${this.rank} of ${Card.SUIT_TO_STRING[this.suit]}`
  }
  toCode() {
    if (this.rank === 1) {
      return `a${Card.SUIT_TO_STRING[this.suit][0]}`
    }
    const highs = ['j', 'q', 'k']
    if (this.rank > 10) {
      return "" + highs[this.rank - 11] + Card.SUIT_TO_STRING[this.suit][0]
    } else return "" + this.rank + Card.SUIT_TO_STRING[this.suit][0]
  }
}
function getDeck() {
  let result = []
  for (const suit of Card.SUITS){
    for (const rank of Card.RANKS){
      result.push(new Card(rank, suit))
    }
  }
  return result
}
export { Card, getDeck }
