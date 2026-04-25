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
    // We cap at 5 other peers because game size is max 6 including self.
    const cellOrder = [3, 0, 1, 2, 5]
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
