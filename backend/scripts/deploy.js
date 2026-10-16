const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const TARGET_DIRS = [
  path.join(__dirname, "..", "..", "frontend", "static"),
  path.join(__dirname, "..", "..", "public"),
];

async function main() {
  const { ethers, network, artifacts } = hre;

  if (network.name !== "sepolia") {
    throw new Error(
      `Izvietošana jāveic Sepolia tīklā (--network sepolia). Pašreizējais tīkls: ${network.name}`
    );
  }

  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("Nav konta. Ieraksti PRIVATE_KEY failā ../.env (testa maks, nevis īsts!).");
  }
  const deployer = signers[0];
  const chain = await ethers.provider.getNetwork();
  if (chain.chainId !== 11155111n) {
    throw new Error(`RPC nav Sepolia (chainId ${chain.chainId}). Pārbaudi SEPOLIA_RPC_URL.`);
  }

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Izvietotājs :", deployer.address);
  console.log("Atlikums    :", ethers.formatEther(balance), "Sepolia ETH");
  if (balance === 0n) {
    throw new Error("Atlikums ir 0. Dabū testa ETH no Sepolia faucet.");
  }

  const Reach21 = await ethers.getContractFactory("Reach21");
  console.log("Izvieto līgumu Reach21 ...");
  const contract = await Reach21.deploy();
  const deployTx = contract.deploymentTransaction();
  console.log("Darījums    :", deployTx.hash);
  await contract.waitForDeployment();
  const receipt = await deployTx.wait();
  const address = await contract.getAddress();

  console.log("\n✓ Līgums izvietots!");
  console.log("Adrese      :", address);
  console.log("Etherscan   : https://sepolia.etherscan.io/address/" + address);
  console.log("Deploy tx   : https://sepolia.etherscan.io/tx/" + deployTx.hash);

  const artifact = await artifacts.readArtifact("Reach21");
  const config = {
    chainId: 11155111,
    contractName: "Reach21",
    address,
    deployBlock: receipt.blockNumber,
    deployTx: deployTx.hash,
    deployer: deployer.address,
  };
  for (const dir of TARGET_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "config.json"), JSON.stringify(config, null, 2) + "\n");
    fs.writeFileSync(path.join(dir, "abi.json"), JSON.stringify(artifact.abi, null, 2) + "\n");
    fs.copyFileSync(path.join(__dirname, "..", "contracts", "Game.sol"), path.join(dir, "Game.sol"));
  }
  console.log("\nAtjaunoti: frontend/static un public (config.json, abi.json, Game.sol)");
  console.log("Nākamais solis: npm run verify:sepolia (izvēles), tad augšupielādē projektu GitHub (bez .env).");
}

main().catch((e) => {
  console.error("\n✗ " + (e.message || e));
  process.exitCode = 1;
});
