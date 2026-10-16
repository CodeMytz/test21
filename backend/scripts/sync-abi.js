const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  await hre.run("compile");
  const artifact = await hre.artifacts.readArtifact("Reach21");
  const dirs = [
    path.join(__dirname, "..", "..", "frontend", "static"),
    path.join(__dirname, "..", "..", "public"),
  ];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "abi.json"), JSON.stringify(artifact.abi, null, 2) + "\n");
    fs.copyFileSync(path.join(__dirname, "..", "contracts", "Game.sol"), path.join(dir, "Game.sol"));
  }
  console.log("✓ abi.json un Game.sol atjaunoti mapēs frontend/static un public.");
}

main().catch((e) => {
  console.error("✗ " + (e.message || e));
  process.exitCode = 1;
});
