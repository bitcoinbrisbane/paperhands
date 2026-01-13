import { ethers, network } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();

  // Get contract addresses from environment
  const disbursementAddress = process.env.DISBURSEMENT_CONTRACT_ADDRESS;
  if (!disbursementAddress) {
    throw new Error("DISBURSEMENT_CONTRACT_ADDRESS environment variable not set");
  }

  // Get disbursement parameters from command line or environment
  const loanId = process.env.LOAN_ID;
  const recipient = process.env.RECIPIENT_ADDRESS;
  const amount = process.env.DISBURSEMENT_AMOUNT;

  if (!loanId || !recipient || !amount) {
    throw new Error("Missing required parameters: LOAN_ID, RECIPIENT_ADDRESS, DISBURSEMENT_AMOUNT");
  }

  console.log("Executing disbursement...");
  console.log("Network:", network.name);
  console.log("Signer:", signer.address);
  console.log("Disbursement Contract:", disbursementAddress);
  console.log("Loan ID:", loanId);
  console.log("Recipient:", recipient);
  console.log("Amount:", amount, "(smallest unit)");

  // Connect to the Disbursement contract
  const Disbursement = await ethers.getContractFactory("Disbursement");
  const disbursement = Disbursement.attach(disbursementAddress);

  // Convert loan ID to bytes32
  const loanIdBytes32 = ethers.encodeBytes32String(loanId);

  // Execute disbursement
  const tx = await disbursement.disburse(loanIdBytes32, recipient, BigInt(amount));
  console.log("Transaction hash:", tx.hash);

  const receipt = await tx.wait();
  console.log("Transaction confirmed in block:", receipt?.blockNumber);

  // Get the disbursement count
  const count = await disbursement.getDisbursementCount();
  console.log("Total disbursements:", count.toString());
}

main()
  .then(() => {
    console.log("\nDisbursement successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Disbursement failed:", error);
    process.exit(1);
  });
