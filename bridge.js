import { ethers } from "ethers";
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

// Define the contract ABIs
const fathomUsdAbi = [
  // FathomUSD ERC20 contract ABI
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function burn(uint256 amount) public",
  "function transferFrom(address sender, address recipient, uint256 amount) public returns (bool)",
];

const bridgeContractAbi = [
  // BridgeContract ABI
  "function bridgeTokens(uint256 amount) public",
];

// Contract addresses
const fathomUsdAddress = "0x81aC77864c5962482cB6E743A2ddecDee8120823"; // Replace with your contract address
const bridgeContractAddress = "0xD7a71796213AB860e5f261D4e2eC62767a6A4Dd4"; // Replace with your contract address

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

async function main() {

  // Fetch private key from environment variable
  const privateKey = process.env.PVT;
  if (!privateKey) {
    console.error(
      "Private key not provided. Set the PVT environment variable."
    );
    process.exit(1);
  }

  // Connect to the Ethereum network
  const provider = new ethers.JsonRpcProvider("https://erpc.apothem.network"); // Replace with your network URL
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Connected to ${await wallet.getAddress()}`);

  // Create contract instances
  const fathomUsd = new ethers.Contract(fathomUsdAddress, fathomUsdAbi, wallet);
  const bridgeContract = new ethers.Contract(
    bridgeContractAddress,
    bridgeContractAbi,
    wallet
  );

  // Process command-line arguments
  if (process.argv.length < 4) {
    console.log("Usage: node bridgeCli.js [toAddress] [amount]");
    process.exit(1);
  }
  const toAddress = process.argv[2]
  const rawAmount = parseInt(process.argv[3]);
  const amount = ethers.parseUnits(process.argv[3], 18);

  // Step 1: Approve tokens
  console.log("Approving Fathom USD tokens...");
  const approveTx = await fathomUsd.approve(bridgeContractAddress, amount, {
    from: await wallet.getAddress(),
  });
  await approveTx.wait();
  console.log(`Fathom USD Tokens approved for bridging: ${amount.toString()}`);

  // Step 2: Bridge tokens
  console.log("Bridging Fathom USD tokens...");
  const bridgeTx = await bridgeContract.bridgeTokens(amount);
  await bridgeTx.wait();
  console.log("Tokens locked successfully on XDC.");

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

  const tx = token.methods.mint_private(rawAmount, secretHash).send();
  console.log(`\nSent private mint transaction ${await tx.getTxHash()}`);

  delay(1000);
  console.log(`Awaiting transaction to be mined`);
  const receipt = await tx.wait();
  console.log(`Transaction has been mined on block ${receipt.blockNumber}`);

  delay(1000);
  console.log(`Adding the newly created "pending shield" note to PXE`);

  // Add the newly created "pending shield" note to PXE
  const pendingShieldsStorageSlot = new Fr(5); // The storage slot of `pending_shields` is 5.
  const note = new Note([new Fr(rawAmount), secretHash]);
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
    .redeem_shield(ownerAddress, rawAmount, secret)
    .send();
  console.log(`Sent private redeem transaction ${await shieldTx.getTxHash()}`);
  delay(1000);
  console.log(`Awaiting transaction to be mined`);
  const shieldReceipt = await shieldTx.wait();
  console.log(
    `Transaction has been mined on block ${shieldReceipt.blockNumber}`
  );
  console.log(
    `${rawAmount} tokens were successfully minted and redeemed by ${ownerAddress}`
  );

  const newBalance = await token.methods
    .balance_of_private(ownerWallet.getAddress())
    .view();

  console.log(`\n\nOld Private balance: ${oldBalance}`);
  console.log(`New Private balance: ${newBalance}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
