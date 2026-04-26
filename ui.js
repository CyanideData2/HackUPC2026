import GameState from "./game.js"

const SUITS = ["hearts", "diamonds", "clubs", "spades"]


/**
 *@param {GameState} state 
    */
function RenderScene(state) {
    const gameHand = document.querySelector("#game-hand")
    if (!Array.isArray(state.actionMessages)) {
        state.actionMessages = []
    }
    // Render a chat box at the right of the hand so that the 
    // active player can type the action they want to perform 
    // with the card they want to play. 
    // The chat box should have a send button that will trigger the action 
    // when clicked.

    const chatBoxString = `        
        <div id="chat-thread" class="chat-thread">${renderChatMessages(state.actionMessages)}</div>
        <form id="chat-box-form">
            <button type="submit" id="send-message-button">Send</button>
            <input
                required
                id="chat-message"
                type="text"
                placeholder="Type your message..."
            />
        </form>
    `

    if (gameHand && Array.isArray(state.hand)) {
        let hand = ""
        for (const card of state.hand) {
            hand += `<span class="pcard-${card.toCode()} card"></span>`
        }

        gameHand.innerHTML = `
            <div class="hand-layout">
                <div class="hand-cards">${hand}</div>
                <div class="hand-chat">${chatBoxString}</div>
            </div>
        `
    }


    const board = document.querySelector("#game-board")
    if (!board) {
        return
    }

    board.innerHTML = ""

    // 3x3 grid, center cell contains deck and pile. Max 5 other peers around it.
    const cellOrder = [3, 0, 1, 2, 5]
    // const otherPeerIds = state.peerIds.filter(peerId => peerId !== state.myPosition)
    const cells = Array(9).fill("")
    const remainingDeckCount = getRemainingDeckCount(state)
    const pileCards = renderPileCards(state)

    cells[4] = `
        <div class="center-zone">
            <div class="deck-zone-wrapper">
                <button id="center-deck" class="deck-zone" type="button" aria-label="Draw from deck">
                    <span class="pcard-back card center-deck-card"></span>
                    <span class="deck-count">${remainingDeckCount}</span>
                </button>
            </div>
            <div class="pile-zone-wrapper">
                <div class="pile-zone">${pileCards}</div>
            </div>
        </div>
    `

    // for (let i = 0; i < otherPeerIds.length && i < cellOrder.length; ++i) {
    //     const idx = cellOrder[i]
    //     cells[idx] = `<div class="other-player-cell">Player ${otherPeerIds[i]}<br><span class="card-count">N</span></div>`
    // }

    for (let i = 0; i < 9; ++i) {
        const cell = document.createElement("div")
        cell.className = "game-board-cell"
        cell.innerHTML = cells[i]
        board.appendChild(cell)
    }

    const deckButton = document.querySelector("#center-deck")
    if (deckButton) {
        deckButton.addEventListener("click", () => {
            if (getRemainingDeckCount(state) <= 0) {
                return
            }

            state.remainingDeckCount -= 1
            if (!Array.isArray(state.hand)) {
                state.hand = []
            }
            state.hand.push(generateLocalDrawCard(state))

            if (
                typeof state.advanceTurn === "function"
                && Array.isArray(state.peerIds)
                && state.peerIds.length > 0
            ) {
                state.advanceTurn()
            }
            RenderScene(state)
        })
    }

}

function updateChatThread(messages) {
    const chatThread = document.querySelector("#chat-thread")
    if (!chatThread) {
        return
    }
    chatThread.innerHTML = renderChatMessages(messages)
    chatThread.scrollTop = chatThread.scrollHeight
}

function renderChatMessages(messages) {
    let html = ""
    for (let i = 0; i < messages.length; ++i) {
        html += `<div class="chat-bubble">${escapeHtml(messages[i])}</div>`
    }
    return html
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;")
}

function getRemainingDeckCount(state) {
    if (typeof state.remainingDeckCount === "number") {
        return state.remainingDeckCount
    }
    const playedCount = Array.isArray(state.playedCards) ? state.playedCards.length : 0
    const handCount = Array.isArray(state.hand) ? state.hand.length : 0
    state.remainingDeckCount = Math.max(0, 52 - playedCount - handCount)
    return state.remainingDeckCount
}

function generateLocalDrawCard(state) {
    const drawIndex = typeof state.localDrawIndex === "number" ? state.localDrawIndex : 0
    state.localDrawIndex = drawIndex + 1
    const rank = (drawIndex % 13) + 1
    const suit = SUITS[drawIndex % SUITS.length]
    return {
        rank,
        suit,
        toCode() {
            if (rank === 1) {
                return `a${suit[0]}`
            }
            const highs = ["j", "q", "k"]
            if (rank > 10) {
                return `${highs[rank - 11]}${suit[0]}`
            }
            return `${rank}${suit[0]}`
        }
    }
}

function renderPileCards(state) {
    const cards = Array.isArray(state.playedCards) ? state.playedCards.slice(-3) : []
    let pileHtml = ""
    for (let i = 0; i < cards.length; ++i) {
        const card = cards[i]
        if (!card || typeof card.toCode !== "function") continue
        pileHtml += `<span class="pcard-${card.toCode()} card pile-card pile-card-${i}"></span>`
    }
    return pileHtml
}

export { RenderScene }
