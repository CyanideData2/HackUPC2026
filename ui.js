import GameState from "./game"


/**
 *@param {GameState} state 
    */
function RenderScene(state) {
    let hand = ""
    for (const card of state.hand) {
        hand += `<span class="pcard-${card.toCode()} card"></span>`
    }
    document.querySelector("#game-hand").innerHTML = hand
}
export {RenderScene}
