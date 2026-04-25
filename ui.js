import GameState from "./game"


/**
 *@param {GameState} state 
    */
function RenderScene(state) {
    let hand = ""
    for (const hand of state.hand) {
        hand += `<span class="pcard-${hand.toCode()}"></span>`
    }
    document.querySelector("game-hand").innerHTML = hand
}
export {RenderScene}
