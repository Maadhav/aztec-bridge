import { Contract, createPXEClient } from "@aztec/aztec.js";
import TokenContractArtifact from "./Token.json" assert { type: "json" };
import { getSandboxAccountsWallets } from "@aztec/accounts/testing";

const { PXE_URL = "http://localhost:8080" } = process.env;

async function main() {
  const pxe = createPXEClient(PXE_URL);
  const [ownerWallet] = await getSandboxAccountsWallets(pxe);
  const ownerAddress = ownerWallet.getCompleteAddress();

  const token = await Contract.deploy(ownerWallet, TokenContractArtifact, [
    ownerAddress,
  ])
    .send()
    .deployed();
  console.log(`Token deployed at ${token.address.toString()}`);
}

main().catch((err) => {
  console.error(`Error in app: ${err}`);
  process.exit(1);
});
