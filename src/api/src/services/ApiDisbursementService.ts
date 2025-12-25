/**
 * Balance information
 */
export interface Balance {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
}

/**
 * ApiDisbursementService - Handles AUD disbursement via payment APIs
 * (e.g., bank APIs, Stripe, PayPal, Wise, Monoova, etc.)
 */
export class ApiDisbursementService {
  private apiUrl: string;
  private apiKey: string;
  private accountId: string;

  constructor(apiUrl?: string, apiKey?: string, accountId?: string) {
    this.apiUrl = apiUrl || process.env.PAYMENT_API_URL || "";
    this.apiKey = apiKey || process.env.PAYMENT_API_KEY || "";
    this.accountId = accountId || process.env.PAYMENT_ACCOUNT_ID || "";
  }

  /**
   * Send AUD via payment API
   * @param amountAud - Amount in AUD to send
   * @param recipientAddress - Recipient's account identifier (email, account number, etc.)
   * @returns Payment reference ID
   */
  async send(amountAud: number, recipientAddress: string): Promise<string> {
    console.log(
      `[API] Sending ${amountAud} AUD to ${recipientAddress} via ${this.apiUrl}`
    );

    try {
      // TODO: Implement actual API integration
      // Example implementation:
      //
      // const response = await fetch(`${this.apiUrl}/payments`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     sourceAccountId: this.accountId,
      //     destinationAccount: recipientAddress,
      //     amount: amountAud,
      //     currency: 'AUD',
      //   }),
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`API error: ${response.status}`);
      // }
      //
      // const data = await response.json();
      // return data.paymentReference || data.transactionId;

      // Mock payment reference for now
      return `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    } catch (error) {
      console.error("[API] Payment failed:", error);
      throw new Error(
        `Payment API failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Get available balance from payment API
   * @returns Balance information in AUD
   */
  async balance(): Promise<Balance> {
    console.log(`[API] Fetching balance for account ${this.accountId}`);

    try {
      // TODO: Implement actual API balance check
      // Example implementation:
      //
      // const response = await fetch(`${this.apiUrl}/accounts/${this.accountId}/balance`, {
      //   method: 'GET',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      // });
      //
      // if (!response.ok) {
      //   throw new Error(`API error: ${response.status}`);
      // }
      //
      // const data = await response.json();
      // return {
      //   availableBalance: data.available || 0,
      //   pendingBalance: data.pending || 0,
      //   totalBalance: data.total || 0,
      // };

      // Mock balance for now
      return {
        availableBalance: 250000.0,
        pendingBalance: 5000.0,
        totalBalance: 255000.0,
      };
    } catch (error) {
      console.error("[API] Balance fetch failed:", error);
      throw new Error(
        `Balance API failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
