import { getSchnorrAccount } from '@aztec/accounts/schnorr';
import { GrumpkinPrivateKey } from '@aztec/types';

const encryptionPrivateKey = GrumpkinPrivateKey.random();
const signingPrivateKey = GrumpkinPrivateKey.random();
const wallet = getSchnorrAccount(pxe, encryptionPrivateKey, signingPrivateKey).waitDeploy();
console.log(`New account deployed at ${wallet.getAddress()}`);