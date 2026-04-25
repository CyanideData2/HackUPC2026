pragma circom 2.0.0;

// Import the BabyJubJub scalar multiplication circuit from circomlib
include "node_modules/circomlib/circuits/escalarmulany.circom";

template EncryptCard() {
    // Private Input: Alice's secret key (must be provided as bits)
    signal input privateKeyBits[253];

    // Public Inputs: The unencrypted card's coordinates on the curve
    signal input cardX;
    signal input cardY;

    // Public Outputs: The encrypted card's coordinates
    signal output encryptedX;
    signal output encryptedY;

    // Instantiate the multiplier
    component mul = EscalarMulAny(253);

    mul.p[0] <== cardX;
    mul.p[1] <== cardY;

    // Feed the private key bits into the multiplier
    for (var i = 0; i < 253; i++) {
        mul.e[i] <== privateKeyBits[i];
    }

    // Output the resulting point
    encryptedX <== mul.out[0];
    encryptedY <== mul.out[1];
}

// cardX and cardY are public so Bob can verify them. 
// privateKeyBits remains completely hidden.
component main {public [cardX, cardY]} = EncryptCard();

