import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  console.log("Network:", network.name);

  // Get the AUDM token address from environment or use a default for testing
  let audmTokenAddress = process.env.AUDM_CONTRACT_ADDRESS;

  // For localhost/hardhat, deploy a mock token first
  if (network.name === "localhost" || network.name === "hardhat") {
    console.log("\nDeploying MockAUDM token for testing...");
    const MockAUDM = await ethers.getContractFactory("MockAUDM");
    const mockAudm = await MockAUDM.deploy("Australian Dollar Coin", "AUDM", 6);
    await mockAudm.waitForDeployment();

    audmTokenAddress = await mockAudm.getAddress();
    console.log("MockAUDM deployed to:", audmTokenAddress);

    // Mint some tokens to deployer for testing
    const mintAmount = ethers.parseUnits("1000000", 6); // 1M AUDM
    await mockAudm.mint(deployer.address, mintAmount);
    console.log("Minted", ethers.formatUnits(mintAmount, 6), "AUDM to deployer");
  }

  if (!audmTokenAddress) {
    throw new Error("AUDM_CONTRACT_ADDRESS environment variable not set");
  }

  // Deploy Disbursement contract
  console.log("\nDeploying Disbursement contract...");
  const Disbursement = await ethers.getContractFactory("Disbursement");
  const disbursement = await Disbursement.deploy(audmTokenAddress);
  await disbursement.waitForDeployment();

  const disbursementAddress = await disbursement.getAddress();
  console.log("Disbursement contract deployed to:", disbursementAddress);

  // For localhost/hardhat, fund the disbursement contract
  if (network.name === "localhost" || network.name === "hardhat") {
    const MockAUDM = await ethers.getContractFactory("MockAUDM");
    const mockAudm = MockAUDM.attach(audmTokenAddress);

    const fundAmount = ethers.parseUnits("500000", 6); // 500K AUDM
    await mockAudm.mint(disbursementAddress, fundAmount);
    console.log("Funded Disbursement contract with", ethers.formatUnits(fundAmount, 6), "AUDM");
  }

  console.log("\n--- Deployment Summary ---");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("AUDM Token:", audmTokenAddress);
  console.log("Disbursement:", disbursementAddress);
  console.log("--------------------------");

  // Return addresses for programmatic use
  return {
    audcToken: audmTokenAddress,
    disbursement: disbursementAddress,
  };
}

main()
  .then((addresses) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
