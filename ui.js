import GameState from "./game.js"


/**
 *@param {GameState} state 
    */
function RenderScene(state) {
    let hand = ""
    for (const card of state.hand) {
        hand += `<span class="pcard-${card.toCode()} card"></span>`
    }
    document.querySelector("#game-hand").innerHTML = hand
    RenderOtherPlayers(state)
}
export { RenderScene, RenderOtherPlayers }

function RenderOtherPlayers(state) {
    const board = document.querySelector("#game-board")
    if (!board || !state || !Array.isArray(state.peerIds)) return

    // Clear board
    board.innerHTML = ""

    // 3x3 grid, skip center (4), max 5 other peers
    // Cell order: 0 1 2
    //             3 4 5
    //             6 7 8
    // Map: [top, top-right, right, bottom-right, bottom, bottom-left, left, top-left]
    // For 2-5 others, fill clockwise, skip 4 (center)
    const cellOrder = [0, 1, 2, 5, 8, 7, 6, 3] // up to 8, but only 5 others max
    const otherPeerIds = state.peerIds.filter(peerId => peerId !== state.peerId)
    const cells = Array(9).fill("")

    for (let i = 0; i < otherPeerIds.length && i < cellOrder.length; ++i) {
        const idx = cellOrder[i]
        cells[idx] = `<div class="other-player-cell">Player ${otherPeerIds[i]}<br><span class="card-count">N</span></div>`
    }

    // Optionally, put your own hand in the center cell (4), or leave blank
    // cells[4] = ''

    for (let i = 0; i < 9; ++i) {
        const cell = document.createElement("div")
        cell.className = "game-board-cell"
        cell.innerHTML = cells[i]
        board.appendChild(cell)
    }
}
