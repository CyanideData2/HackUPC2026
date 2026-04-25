import b4a from 'b4a';

class ProtocolEngine {
  constructor(gameState, deck, peers, myPeerId) {
    this.gameState = gameState;
    this.deck = deck;
    this.peers = peers; // This is your peers Map from app.js
    this.myPeerId = myPeerId;
    this.myPrivateKey = this._generatePrivateKey();
  }

  // ... (keep the _generatePrivateKey and shuffle logic from before) ...
  /**
     * Internal: Generate a valid BabyJubJub scalar
     */
    _generatePrivateKey() {
        // Use a secure random source for the scalar
        const rand = crypto.getRandomValues(new Uint8Array(32));
        return babyJub.scalar.reduce(BigInt('0x' + Array.from(rand).map(b => b.toString(16).padStart(2, '0')).join('')));
    }
    
    /**
     * Listen for network events related to the deck protocol
     */
    setupListeners() {
        this.network.on('data', (peerId, message) => {
            switch (message.type) {
                case 'PROTOCOL_SHUFFLE_STEP':
                    this.handleShuffleStep(message.deck);
                    break;
                case 'PROTOCOL_SHUFFLE_FINAL':
                    this.handleShuffleFinal(message.deck);
                    break;
            }
        });
    }
    
    /**
     * Step 1: Start the shuffle (Usually called by the 'Host')
     */
    async initiateShuffle() {
        console.log("Initiating deck shuffle...");
        this.deck.initializeDeck(); // Start with fresh card points
        this.deck.encrypt(this.myPrivateKey);
        this.deck.shuffle();

        this.passToNextPeer('PROTOCOL_SHUFFLE_STEP');
    }
    
    /**
     * Step 2: Handle incoming shuffled deck from a peer
     */
    handleShuffleStep(incomingCards) {
        console.log("Received deck for shuffling...");
        this.deck.cards = incomingCards;
        
        // Add our layer of encryption and shuffle
        this.deck.encrypt(this.myPrivateKey);
        this.deck.shuffle();

        // Check if I am the last person in the peer list
        const myIndex = this.gameState.peerIds.indexOf(this.gameState.peerId);
        if (myIndex === this.gameState.peerIds.length - 1) {
            // Everyone has shuffled! Broadcast the final encrypted deck
            this.broadcastFinalDeck();
        } else {
            this.passToNextPeer('PROTOCOL_SHUFFLE_STEP');
        }
    }
    
    /**
     * Step 3: Broadcast the fully locked deck to everyone
     */
    broadcastFinalDeck() {
        this.isShuffleComplete = true;
        this.network.broadcast({
            type: 'PROTOCOL_SHUFFLE_FINAL',
            deck: this.deck.cards
        });
    }

    handleShuffleFinal(finalCards) {
        console.log("Deck shuffle finalized by all peers.");
        this.deck.cards = finalCards;
        this.isShuffleComplete = true;
    }

  /**
   * Sending data via Hyperswarm peers
   */
  async sendToPeer(peerId, data) {
    const peer = this.peers.get(peerId);
    if (peer) {
      // Stringify BigInts properly
      const payload = JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
      peer.write(b4a.from(payload));
    }
  }

  /**
   * Logic to pass the deck to the next person in the swarm
   */
  passToNext() {
    const allIds = [this.myPeerId, ...this.gameState.peerIds].sort();
    const myIndex = allIds.indexOf(this.myPeerId);
    const nextId = allIds[myIndex + 1];

    if (nextId) {
      this.sendToPeer(nextId, { type: 'SHUFFLE_STEP', deck: this.deck.cards });
    } else {
      // I am the last one! Finish shuffle.
      this.broadcastFinal();
    }
  }
}
}
