import {
    AztecAddress,
  Contract,
  ContractDeployer,
  createPXEClient,
  getContractDeploymentInfo,
  waitForSandbox,
} from "@aztec/aztec.js";
import { getSandboxAccountsWallets } from "@aztec/accounts/testing";
import TokenContractArtifact from "./Token.json" assert { type: "json" };

const { PXE_URL = "http://localhost:8080" } = process.env;


async function showPublicBalances(pxe, token) {
    // docs:start:showPublicBalances
    const accounts = await pxe.getRegisteredAccounts();
  
    for (const account of accounts) {
      // highlight-next-line:showPublicBalances
      const balance = await token.methods.balance_of_public(account.address).view();
      console.log(`Balance of ${account.address}: ${balance}`);
    }
    // docs:end:showPublicBalances
  }

async function main() {
  const pxe = createPXEClient(PXE_URL);
  const { chainId } = await pxe.getNodeInfo();
  console.log(`Connected to chain ${chainId}`);

  const wallets = await getSandboxAccountsWallets(pxe);
  const ownerWallet = await wallets[0];
  const ownerAddress = await ownerWallet.getCompleteAddress();

  const contractAddress =
    "0x08de844c2d0d4fe8d076d1d7fcb358268617c3fd683a0568f7caae73a3fae979";
  const token = await Contract.at(
    AztecAddress.fromString(contractAddress),
    TokenContractArtifact,
    ownerWallet
  );

  const balance = await token.methods
    .balance_of_private(ownerWallet.getAddress())
    .view();
  console.log(`Account balance is ${balance}`);


  // docs:start:mintPublicFunds
  const [owner] = await getSandboxAccountsWallets(pxe);

  const tx = token.methods.mint_private(ownerWallet.getAddress(), 100n).send();
  console.log(`Sent mint transaction ${await tx.getTxHash()}`);
//   await showPublicBalances(pxe, token);

  console.log(`Awaiting transaction to be mined`);
  const receipt = await tx.wait();
  console.log(`Transaction has been mined on block ${receipt.blockNumber}`);
//   await showPublicBalances(pxe, token);
  // docs:end:mintPublicFunds

  // docs:start:showLogs
  const blockNumber = await pxe.getBlockNumber();
  const logs = (await pxe.getUnencryptedLogs(blockNumber, 1)).logs;
  const textLogs = logs.map(extendedLog => extendedLog.log.data.toString('ascii'));
  for (const log of textLogs) console.log(`Log emitted: ${log}`);
}

main().catch((err) => {
  console.error(`Error in app: ${err}`);
  process.exit(1);
});
