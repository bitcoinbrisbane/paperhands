import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));
  console.log("Network:", network.name);

  // Get the AUDC token address from environment or use a default for testing
  let audcTokenAddress = process.env.AUDC_CONTRACT_ADDRESS;

  // For localhost/hardhat, deploy a mock token first
  if (network.name === "localhost" || network.name === "hardhat") {
    console.log("\nDeploying MockAUDC token for testing...");
    const MockAUDC = await ethers.getContractFactory("MockAUDC");
    const mockAudc = await MockAUDC.deploy("Australian Dollar Coin", "AUDC", 6);
    await mockAudc.waitForDeployment();

    audcTokenAddress = await mockAudc.getAddress();
    console.log("MockAUDC deployed to:", audcTokenAddress);

    // Mint some tokens to deployer for testing
    const mintAmount = ethers.parseUnits("1000000", 6); // 1M AUDC
    await mockAudc.mint(deployer.address, mintAmount);
    console.log("Minted", ethers.formatUnits(mintAmount, 6), "AUDC to deployer");
  }

  if (!audcTokenAddress) {
    throw new Error("AUDC_CONTRACT_ADDRESS environment variable not set");
  }

  // Deploy Disbursement contract
  console.log("\nDeploying Disbursement contract...");
  const Disbursement = await ethers.getContractFactory("Disbursement");
  const disbursement = await Disbursement.deploy(audcTokenAddress);
  await disbursement.waitForDeployment();

  const disbursementAddress = await disbursement.getAddress();
  console.log("Disbursement contract deployed to:", disbursementAddress);

  // For localhost/hardhat, fund the disbursement contract
  if (network.name === "localhost" || network.name === "hardhat") {
    const MockAUDC = await ethers.getContractFactory("MockAUDC");
    const mockAudc = MockAUDC.attach(audcTokenAddress);

    const fundAmount = ethers.parseUnits("500000", 6); // 500K AUDC
    await mockAudc.mint(disbursementAddress, fundAmount);
    console.log("Funded Disbursement contract with", ethers.formatUnits(fundAmount, 6), "AUDC");
  }

  console.log("\n--- Deployment Summary ---");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("AUDC Token:", audcTokenAddress);
  console.log("Disbursement:", disbursementAddress);
  console.log("--------------------------");

  // Return addresses for programmatic use
  return {
    audcToken: audcTokenAddress,
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
