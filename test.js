import {
  AztecAddress,
  Contract,
  ContractDeployer,
  ExtendedNote,
  Fr,
  Note,
  computeMessageSecretHash,
  createPXEClient,
  getContractDeploymentInfo,
  waitForSandbox,
} from "@aztec/aztec.js";
import { getSandboxAccountsWallets } from "@aztec/accounts/testing";
import TokenContractArtifact from "./Token.json" assert { type: "json" };

const { PXE_URL = "http://localhost:8080" } = process.env;

//delay by t milliseconds
const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

async function main() {
  const pxe = createPXEClient(PXE_URL);
  const { chainId } = await pxe.getNodeInfo();
  console.log(`Connected to chain ${chainId}`);

  const wallets = await getSandboxAccountsWallets(pxe);
  const ownerWallet = wallets[0];
  const ownerAddress = ownerWallet.getAddress();

  const contractAddress =
    "0x14ddb8840adacad1c0adf248a564ba51d1ee61e3a3d16ecbca8cf786fc945b29";

  const token = await Contract.at(
    AztecAddress.fromString(contractAddress),
    TokenContractArtifact,
    ownerWallet
  );

  const oldBalance = await token.methods
    .balance_of_private(ownerWallet.getAddress())
    .view();

  // Create a secret and a corresponding hash that will be used to mint funds privately
  const secret = Fr.random();
  const secretHash = computeMessageSecretHash(secret);

  const tx = token.methods.mint_private(100n, secretHash).send();
  console.log(`\nSent private mint transaction ${await tx.getTxHash()}`);
  
  delay(1000);
  console.log(`Awaiting transaction to be mined`);
  const receipt = await tx.wait();
  console.log(`Transaction has been mined on block ${receipt.blockNumber}`);
  
  delay(1000);
  console.log(`Adding the newly created "pending shield" note to PXE`);

  // Add the newly created "pending shield" note to PXE
  const pendingShieldsStorageSlot = new Fr(5); // The storage slot of `pending_shields` is 5.
  const note = new Note([new Fr(100n), secretHash]);
  await pxe.addNote(
    new ExtendedNote(
      note,
      ownerAddress,
      token.address,
      pendingShieldsStorageSlot,
      receipt.txHash
    )
  );

  console.log(`\nAdded note to PXE with secret ${secret}\n`);

  // Make the tokens spendable by redeeming them using the secret (converts the "pending shield note" created above
  // to a "token note")
  const shieldTx = token.methods
    .redeem_shield(ownerAddress, 100n, secret)
    .send();
  console.log(`Sent private redeem transaction ${await shieldTx.getTxHash()}`);
  delay(1000);
  console.log(`Awaiting transaction to be mined`);
  const shieldReceipt = await shieldTx.wait();
  console.log(
    `Transaction has been mined on block ${shieldReceipt.blockNumber}`
  );
  console.log(
    `${100n} tokens were successfully minted and redeemed by ${ownerAddress}`
  );

  const newBalance = await token.methods
    .balance_of_private(ownerWallet.getAddress())
    .view();

  console.log(`\n\nOld Private balance: ${oldBalance}`);
  console.log(`New Private balance: ${newBalance}`);
}

main().catch((err) => {
  console.error(`Error in app: ${err}`);
  process.exit(1);
});
