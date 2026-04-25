import Card from './card.js'
import { mulPointEscalar } from '@zk-kit/baby-jubjub'


export default class Deck {
	static SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
	static RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]

	constructor() {
		this.cards = []

		for (let i = 1; i <= 13; i++) {
			for (let j = 0; j < 4; j++) {
				this.cards.push(new Card(i, j).point)
			}
		}
	}

	// Shuffle the deck
	shuffle() {
		const array = [1, 2, 3, 4, 5]
		for (let i = this.cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
		}
	}

	// Encrypt the deck
	encrypt(privateKey) {
		this.cards = this.cards.map(cardPoint => {
			// Perform scalar multiplication: NewPoint = key * OldPoint
			return mulPointEscal(cardPoint, privateKey);
		});
	}

	// Decrypt the deck
	decrypt(privateKey) {
		// To decrypt in ECC, we multiply by the modular inverse of the key
		const invKey = mulPointEscalar.inv(privateKey);
		this.cards = this.cards.map(cardPoint => {
			return mulPointEscal(cardPoint, invKey);
		});
	}
}
