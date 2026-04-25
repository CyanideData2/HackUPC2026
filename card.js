
let PUBLIC_CARD_POINTS = null;

export default class Card {

  static SUITS = [0, 1, 2, 3]
  static RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] 

  constructor(rank, suit) {
    if (!Card.SUITS.includes(suit)) {
      throw new Error(`Invalid suit: ${suit}`)
    }

    if (!Card.RANKS.includes(rank)) {
      throw new Error(`Invalid rank: ${rank}`)
    }
    
    if (!PUBLIC_CARD_POINTS) {
            this._initializePoints();
        }

    this.rank = rank
    this.suit = suit
    this.id = suit*13 + rank
    
    const point = PUBLIC_CARD_POINTS[this.id]
    this.x = point.x
    this.y = point.y
  }
  
  _initializePoints() {
        if (typeof babyJub === 'undefined') {
            throw new Error("babyJub library not found. Check your index.html script tag.");
        }
        
        PUBLIC_CARD_POINTS = [];
        for (let i = 1; i <= 52; i++) {
            // Generate valid points on the curve: P = i * G
            const pt = babyJub.mulPointEscal(babyJub.Base8, BigInt(i));
            PUBLIC_CARD_POINTS.push(pt);
        }
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
    const highs = ['j', 'q', 'k']
    if (this.rank > 10) {
      return "" + highs[this.rank - 11] + this.suit[0]
    } else return "" + this.rank + this.suit[0]
  }
}
function getDeck(){
  let result = []
  for( suit of ['hearts', 'diamonds', 'clubs', 'spades']){
    for (rank of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]){
      result.push(new Card(rank, suit))
    }
  }
  return result
}
export { Card, getDeck }
