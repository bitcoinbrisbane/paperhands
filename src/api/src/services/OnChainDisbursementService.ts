import { Balance } from "./types.js";

/**
 * OnChainDisbursementService - Handles AUD disbursement via blockchain
 * (e.g., AUDC stablecoin on Ethereum or other blockchains)
 */
export class OnChainDisbursementService {
  private readonly rpcUrl: string;
  private readonly contractAddress: string;
  private readonly privateKey: string;

  constructor(rpcUrl?: string, contractAddress?: string, privateKey?: string) {
    this.rpcUrl = rpcUrl || process.env.BLOCKCHAIN_RPC_URL || "";
    this.contractAddress =
      contractAddress || process.env.AUDC_CONTRACT_ADDRESS || "";
    this.privateKey = privateKey || process.env.DISBURSEMENT_PRIVATE_KEY || "";
  }

  /**
   * Send AUD stablecoins on-chain
   * @param amountAud - Amount in AUD to send
   * @param recipientAddress - Recipient's wallet address (e.g., Ethereum address)
   * @returns Transaction hash
   */
  async send(amountAud: number, recipientAddress: string): Promise<string> {
    console.log(
      `[OnChain] Sending ${amountAud} AUD to ${recipientAddress} via contract ${this.contractAddress}`,
    );

    // TODO: Implement actual blockchain transaction
    // Example implementation using ethers.js or web3.js:
    //
    // const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    // const wallet = new ethers.Wallet(this.privateKey, provider);
    // const contract = new ethers.Contract(this.contractAddress, ABI, wallet);
    // const decimals = await contract.decimals();
    // const amount = ethers.utils.parseUnits(amountAud.toString(), decimals);
    // const tx = await contract.transfer(recipientAddress, amount);
    // await tx.wait();
    // return tx.hash;

    // Mock transaction hash for now
    return `0x${Buffer.from(`onchain-${Date.now()}-${Math.random()}`).toString("hex")}`;
  }

  /**
   * Get available balance from blockchain
   * @returns Balance information in AUD
   */
  async balance(): Promise<Balance> {
    console.log(
      `[OnChain] Fetching balance from contract ${this.contractAddress}`,
    );

    // TODO: Implement actual blockchain balance check
    // Example implementation:
    //
    // const provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
    // const wallet = new ethers.Wallet(this.privateKey, provider);
    // const contract = new ethers.Contract(this.contractAddress, ABI, provider);
    // const balance = await contract.balanceOf(wallet.address);
    // const decimals = await contract.decimals();
    // const balanceAud = parseFloat(ethers.utils.formatUnits(balance, decimals));

    // Mock balance for now
    return {
      availableBalance: 100000.0,
      pendingBalance: 0,
      totalBalance: 100000.0,
    };
  }
}
