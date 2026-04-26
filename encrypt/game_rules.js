import crypto from 'crypto'

const secret = "mysecretkey"
const NumberOfCards = 52
const NumStatesForCardsInHand = 5
const MaxTrackedCardsInHand = 4
const RankName = ["k", "a", "2", "3", "4", "5", "6", "7", "8", "9", "10", "j", "q"]

function normalizeNumCardsInHand(numCardsInHand) {
    return Math.min(numCardsInHand, MaxTrackedCardsInHand)
}

function createHash(currentCard, previousCard, numCardsInHand, action){
    const normalizedNumCardsInHand = normalizeNumCardsInHand(numCardsInHand)
    const action_standardized = action.toLowerCase().replace(/\s+/g, ' ').trim()
    const currentCardStr = String(currentCard).padStart(2, '0');
    const previousCardStr = String(previousCard).padStart(2, '0');
    const numCardsInHandStr = String(normalizedNumCardsInHand);
    const stat = currentCardStr + previousCardStr + numCardsInHandStr + action_standardized

    return crypto.createHmac('sha256', secret)
        .update(stat)
        .digest('hex')
}

function generateHashedRuleSet(){
    const set = new Set()
    for (let currentCard = 1; currentCard <= NumberOfCards; currentCard++) {
        for (let previousCard = 1; previousCard <= NumberOfCards; previousCard++) {
            if (currentCard === previousCard) {
                continue
            }
            const rankCurr = currentCard % 13
            const suitCurr = Math.floor((currentCard-1)/13)
            const rankPrev = previousCard % 13
            const suitPrev = Math.floor((previousCard-1)/13)
            if (rankCurr !== rankPrev && suitCurr !== suitPrev) {
                continue
            }
            let numActions = 0
            for (let numCardsInHand = 0; numCardsInHand < NumStatesForCardsInHand; numCardsInHand++) {
                if (numCardsInHand === 0) {
                    set.add(createHash(currentCard, previousCard, numCardsInHand, "mao"))
                    numActions += 1
                }
                else if (numCardsInHand === 1) { 
                    set.add(createHash(currentCard, previousCard, numCardsInHand, "hit card"))
                    numActions += 1
                }
                else if (numCardsInHand === 2) { 
                    set.add(createHash(currentCard, previousCard, numCardsInHand, "brush cards"))
                    numActions += 1
                }
                if (rankCurr === 1) { 
                    if (rankPrev=== 1) {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "klingae"))
                        numActions += 1
                    }
                    else {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "klingae klingae"))
                        numActions += 1
                    }
                }
                else if (rankCurr === 7) {
                    if (rankPrev=== 7){
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "good morning"))
                        numActions += 1
                    }
                    else {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "very good morning"))
                        numActions += 1
                    }
                }
                else if (rankCurr === 8) {
                    if (rankPrev=== 8){
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "boom"))
                        numActions += 1
                    }
                    else {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "boom boom"))
                        numActions += 1
                    }
                }
                else if (rankCurr === 11) { 
                    if (rankPrev === 11) {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "hit player"))
                        numActions += 1
                    }
                    else {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "hit player twice"))
                        numActions += 1
                    }
                }
                else if (rankCurr === 12) { 
                    if (rankPrev === 12) {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "god save the queen"))
                        numActions += 1
                    }
                    else {
                        set.add(createHash(currentCard, previousCard, numCardsInHand, "god save the queen god save the queen"))
                        numActions += 1
                    }
                }
                if (suitCurr === 0){
                    set.add(createHash(currentCard, previousCard, numCardsInHand, "nah"))
                    numActions += 1
                }
                else if (suitCurr === 3){
                    const action = String(RankName[rankCurr]) + " of spades"
                    set.add(createHash(currentCard, previousCard, numCardsInHand, action))
                    numActions += 1
                }
                if (numActions === 0) {
                    set.add(createHash(currentCard, previousCard, numCardsInHand, ""))
                }
            }
        }
    }

    return set
}

export { createHash, generateHashedRuleSet }

console.log("Generating set...")
const set = generateHashedRuleSet()
console.log("Set generated with " + set.size + " elements.")
// Save the set to a file
import fs from 'fs';
fs.writeFileSync('encrypt/hashed_rules.json', JSON.stringify(Array.from(set)));
console.log("Set saved to encrypt/hashed_rules.json");

