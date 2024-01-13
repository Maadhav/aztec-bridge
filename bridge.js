const ethers = require("ethers");
const aztec = require("@aztec/aztec.js");
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

async function main() {
  const contract = await aztec.Contract.at(
    "0x2989fbc9e90a7898922dab29a416ad4fda747cad2ed57d2f08f2f35a6ffad898",
    MyContractArtifact,
    wallet
  );
  const balance = await contract.methods.getBalance(wallet.getAddress()).view();
  console.log(`Account balance is ${balance}`);

  // Fetch private key from environment variable
  //   const privateKey = process.env.PVT;
  //   if (!privateKey) {
  //     console.error(
  //       "Private key not provided. Set the PVT environment variable."
  //     );
  //     process.exit(1);
  //   }

  //   // Connect to the Ethereum network
  //   const provider = new ethers.JsonRpcProvider("https://erpc.apothem.network"); // Replace with your network URL
  //   const wallet = new ethers.Wallet(privateKey, provider);

  //   console.log(`Connected to ${await wallet.getAddress()}`);

  //   // Create contract instances
  //   const fathomUsd = new ethers.Contract(fathomUsdAddress, fathomUsdAbi, wallet);
  //   const bridgeContract = new ethers.Contract(
  //     bridgeContractAddress,
  //     bridgeContractAbi,
  //     wallet
  //   );

  //   // Process command-line arguments
  //   if (process.argv.length < 4) {
  //     console.log("Usage: node bridgeCli.js [toAddress] [amount]");
  //     process.exit(1);
  //   }
  //   const toAddress = process.argv[2];
  //   const amount = ethers.parseUnits(process.argv[3], 18);

  //   // Step 1: Approve tokens
  //   console.log("Approving tokens...");
  //   const approveTx = await fathomUsd.approve(bridgeContractAddress, amount, {
  //     from: await wallet.getAddress(),
  //   });
  //   await approveTx.wait();
  //   console.log(`Tokens approved for bridging: ${amount.toString()}`);

  //   // Step 2: Bridge tokens
  //   console.log("Bridging tokens...");
  //   const bridgeTx = await bridgeContract.bridgeTokens(amount);
  //   await bridgeTx.wait();
  //   console.log("Tokens bridged successfully.");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
