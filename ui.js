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
    const otherPlayersContainer = document.querySelector("#other-players-list")
    if (!otherPlayersContainer || !state || !Array.isArray(state.peerIds)) {
        return
    }

    const otherPeerIds = state.peerIds.filter(peerId => peerId !== state.peerId)
    let rows = ""
    for (const peerId of otherPeerIds) {
        rows += `<div>Player ${peerId} has N cards in hand</div>`
    }

    otherPlayersContainer.innerHTML = rows
}
