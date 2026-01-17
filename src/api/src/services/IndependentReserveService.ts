import crypto from "crypto";
import axios, { type AxiosInstance } from "axios";
import type { Balance } from "./types.js";

/**
 * Independent Reserve API response types
 */
interface IRAccount {
  accountGuid: string;
  accountStatus: string;
  availableBalance: number;
  currencyCode: string;
  totalBalance: number;
}

interface IRWithdrawalResponse {
  accountGuid: string;
  fiatWithdrawalRequestGuid: string;
  status: string;
  currency: string;
  totalWithdrawalAmount: number;
  feeAmount: number;
  createdTimestampUtc: string;
}

interface IRBankAccount {
  bankAccountGuid: string;
  bankAccountName: string;
  bankName: string;
  accountNumber: string;
  isActive: boolean;
}

interface IRWithdrawalFees {
  withdrawalType: string;
  minimumAmount: number;
  currencyCode: string;
  fixedFee: number;
  percentageFee: number;
}

/**
 * IndependentReserveService - Handles AUD balance checking and withdrawals via Independent Reserve API
 */
export class IndependentReserveService {
  private readonly baseUrl: string = "https://api.independentreserve.com";
  private apiKey: string;
  private apiSecret: string;
  private nonce: number;
  private axiosClient: AxiosInstance;

  constructor(apiKey?: string, apiSecret?: string) {
    this.apiKey = apiKey || process.env.IR_API_KEY || "";
    this.apiSecret = apiSecret || process.env.IR_API_SECRET || "";
    this.nonce = Date.now();

    // Initialize axios client
    this.axiosClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!this.apiKey || !this.apiSecret) {
      console.warn(
        "[IndependentReserve] API credentials not configured. Please set IR_API_KEY and IR_API_SECRET environment variables."
      );
    }
  }

  /**
   * Generate nonce for request authentication
   * @returns Next nonce value
   */
  private generateNonce(): number {
    this.nonce += 1;
    return this.nonce;
  }

  /**
   * Create HMAC-SHA256 signature for API authentication
   * @param url - Full API endpoint URL
   * @param parameters - Request parameters as object
   * @returns Hex-encoded signature
   */
  private createSignature(url: string, parameters: Record<string, string | number | boolean>): string {
    // Convert parameters to comma-separated key=value pairs, sorted alphabetically by key
    const sortedParams = Object.keys(parameters)
      .sort()
      .map((key) => `${key}=${parameters[key]}`)
      .join(",");

    // Message format: url,param1=value1,param2=value2,...
    const message = [url, sortedParams].filter(Boolean).join(",");

    // Create HMAC-SHA256 signature
    const signature = crypto
      .createHmac("sha256", this.apiSecret)
      .update(message)
      .digest("hex");

    return signature;
  }

  /**
   * Make authenticated request to Independent Reserve API
   * @param endpoint - API endpoint path
   * @param parameters - Request parameters
   * @returns API response data
   */
  private async makePrivateRequest<T>(
    endpoint: string,
    parameters: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const nonce = this.generateNonce();

    // Add authentication parameters
    const authParams = {
      apiKey: this.apiKey,
      nonce,
      ...parameters,
    };

    // Generate signature
    const signature = this.createSignature(url, authParams);

    // Create request body
    const requestBody = {
      ...authParams,
      signature,
    };

    try {
      const response = await this.axiosClient.post<T>(endpoint, requestBody);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
        throw new Error(
          `Independent Reserve API error (${error.response?.status || 'unknown'}): ${errorMessage}`
        );
      }
      console.error("[IndependentReserve] API request failed:", error);
      throw new Error(
        `Independent Reserve API failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get all accounts from Independent Reserve
   * @returns Array of account information
   */
  async getAccounts(): Promise<IRAccount[]> {
    console.log("[IndependentReserve] Fetching accounts");
    return this.makePrivateRequest<IRAccount[]>("/Private/GetAccounts");
  }

  /**
   * Get available balance in AUD
   * @returns Balance information in AUD
   */
  async balance(): Promise<Balance> {
    console.log("[IndependentReserve] Fetching AUD balance");

    try {
      const accounts = await this.getAccounts();

      // Find AUD account
      const audAccount = accounts.find(
        (account) => account.currencyCode.toUpperCase() === "AUD"
      );

      if (!audAccount) {
        throw new Error("AUD account not found");
      }

      // Independent Reserve provides availableBalance and totalBalance
      // Calculate pending as difference
      const pendingBalance =
        audAccount.totalBalance - audAccount.availableBalance;

      return {
        availableBalance: audAccount.availableBalance,
        pendingBalance: pendingBalance,
        totalBalance: audAccount.totalBalance,
      };
    } catch (error) {
      console.error("[IndependentReserve] Balance fetch failed:", error);
      throw new Error(
        `Balance fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get registered bank accounts
   * @returns Array of bank account information
   */
  async getBankAccounts(): Promise<IRBankAccount[]> {
    console.log("[IndependentReserve] Fetching bank accounts");
    return this.makePrivateRequest<IRBankAccount[]>(
      "/Private/GetFiatBankAccounts"
    );
  }

  /**
   * Withdraw AUD to a registered bank account
   * @param amountAud - Amount in AUD to withdraw
   * @param bankAccountGuid - GUID of the registered bank account (optional - will use first active account if not provided)
   * @param comment - Optional comment for the withdrawal
   * @param useNpp - Whether to use New Payments Platform (NPP) for faster transfers
   * @returns Withdrawal reference information
   */
  async withdraw(
    amountAud: number,
    bankAccountGuid?: string,
    comment?: string,
    useNpp: boolean = true
  ): Promise<IRWithdrawalResponse> {
    console.log(
      `[IndependentReserve] Initiating withdrawal of ${amountAud} AUD`
    );

    try {
      let targetBankAccountGuid = bankAccountGuid;

      // If no bank account GUID provided, get the first active account
      if (!targetBankAccountGuid) {
        const bankAccounts = await this.getBankAccounts();
        const activeBankAccount = bankAccounts.find(
          (account) => account.isActive
        );

        if (!activeBankAccount) {
          throw new Error("No active bank account found");
        }

        targetBankAccountGuid = activeBankAccount.bankAccountGuid;
        console.log(
          `[IndependentReserve] Using bank account: ${activeBankAccount.bankAccountName}`
        );
      }

      const withdrawalParams = {
        secondaryCurrencyCode: "Aud",
        withdrawalAmount: amountAud,
        fiatBankAccountGuid: targetBankAccountGuid,
        useNpp,
        ...(comment && { comment }),
      };

      const response = await this.makePrivateRequest<IRWithdrawalResponse>(
        "/Private/WithdrawFiatCurrency",
        withdrawalParams
      );

      console.log(
        `[IndependentReserve] Withdrawal initiated: ${response.fiatWithdrawalRequestGuid}`
      );
      console.log(
        `[IndependentReserve] Total amount: ${response.totalWithdrawalAmount} (including fee: ${response.feeAmount})`
      );

      return response;
    } catch (error) {
      console.error("[IndependentReserve] Withdrawal failed:", error);
      throw new Error(
        `Withdrawal failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get withdrawal fees for AUD
   * @returns Withdrawal fee information
   */
  async getWithdrawalFees(): Promise<IRWithdrawalFees[]> {
    console.log("[IndependentReserve] Fetching withdrawal fees");
    return this.makePrivateRequest<IRWithdrawalFees[]>("/Private/GetFiatWithdrawalFees");
  }
}
