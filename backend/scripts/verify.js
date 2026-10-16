const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const cfgPath = path.join(__dirname, "..", "..", "frontend", "static", "config.json");
  if (!fs.existsSync(cfgPath)) throw new Error("frontend/static/config.json nav atrasts. Vispirms izpildi deploy.");
  const { address } = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  if (!address) throw new Error("config.json nav līguma adreses.");
  if (!process.env.ETHERSCAN_API_KEY) {
    throw new Error("Ieraksti ETHERSCAN_API_KEY failā ../.env (bezmaksas atslēga no etherscan.io).");
  }
  try {
    await hre.run("verify:verify", { address, constructorArguments: [] });
    console.log("✓ Verificēts: https://sepolia.etherscan.io/address/" + address + "#code");
  } catch (e) {
    if (/already verified/i.test(e.message)) console.log("Līgums jau ir verificēts.");
    else throw e;
  }
}

main().catch((e) => {
  console.error("✗ " + (e.message || e));
  process.exitCode = 1;
});
