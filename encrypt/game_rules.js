import crypto from 'crypto'

const secret = "mysecretkey"
const NumberOfCards = 52
const NumberOfStatesCardsInHand = 4
const nameofcards = ["K","A","2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q"]

function createHash(currentCard, previousCard, numCardsInHand, action){
    const action_standardized = action.toLowerCase().replace(/\s+/g, ' ').trim()
    const currentCardStr = String(currentCard).padStart(2, '0');
    const previousCardStr = String(previousCard).padStart(2, '0');
    const numCardsInHandStr = String(numCardsInHand);
    const stat = currentCardStr + previousCardStr + numCardsInHandStr + action_standardized

    return crypto.createHmac('sha256', secret)
        .update(stat)
        .digest('hex')
}

function generateSet(){
    let set = []
    for (let currentCard = 1; currentCard <= NumberOfCards; currentCard++) {
        for (let previousCard = 1; previousCard <= NumberOfCards; previousCard++) {
            if (currentCard === previousCard) {
                continue
            }
            for (let numCardsInHand = 0; numCardsInHand < NumberOfStatesCardsInHand; numCardsInHand++) {
                let ranki = currentCard % 13
                let suiti = Math.floor((currentCard-1)/13)
                let rankj = previousCard % 13
                let suitj = Math.floor((previousCard-1)/13)
                if (numCardsInHand === 0) { set.push(createHash(currentCard, previousCard, numCardsInHand, "mao"))}
                else if (numCardsInHand === 1) { set.push(createHash(currentCard, previousCard, numCardsInHand, "hit card"))}
                else if (numCardsInHand === 2) { set.push(createHash(currentCard, previousCard, numCardsInHand, "fregar les cartes"))}
                if (ranki === 1) { 
                    if (rankj=== 1)
                        {set.push(createHash(currentCard, previousCard, numCardsInHand, "klingae"))}
                    else 
                        {set.push(createHash(currentCard, previousCard, numCardsInHand, "klingae klingae"))}
                }
                else if (ranki === 7) {
                    if (rankj=== 7){set.push(createHash(currentCard, previousCard, numCardsInHand, "bon dia"))}
                    else {set.push(createHash(currentCard, previousCard, numCardsInHand, "molt bon dia"))}
                }
                else if (ranki === 8) {
                    if (rankj=== 8){set.push(createHash(currentCard, previousCard, numCardsInHand, "bon"))}
                    else {set.push(createHash(currentCard, previousCard, numCardsInHand, "bon bon"))}
                }
                else if (ranki === 11) { 
                    if (rankj === 11) {set.push(createHash(currentCard, previousCard, numCardsInHand, "hit player"))}
                    else {set.push(createHash(currentCard, previousCard, numCardsInHand, "hit player twice"))}
                }
                else if (ranki === 12) { 
                    if (rankj === 12) {set.push(createHash(currentCard, previousCard, numCardsInHand, "god save the queen"))}
                    else {set.push(createHash(currentCard, previousCard, numCardsInHand, "god save the queen god save the queen"))}
                }
                if (suiti === 0){
                    set.push(createHash(currentCard, previousCard, numCardsInHand, "nah"))
                }
                else if (suiti === 3){
                    set.push(createHash(currentCard, previousCard, numCardsInHand, String(nameofcards[ranki]) + " of spades"))
                }
            }
        }
    }

    return set
}

export { createHash, generateSet }

// console.log("Generating set...")
// const set = generateSet()
// console.log("Set generated with " + set.length + " elements.")
// Save the set to a file
// import fs from 'fs';
// fs.writeFileSync('encrypt/hashed_rules.json', JSON.stringify(set));
// console.log("Set saved to encrypt/hashed_rules.json");

