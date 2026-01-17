# Independent Reserve Integration

This document describes the integration with Independent Reserve API for AUD balance checking and withdrawals.

## Overview

The `IndependentReserveService` provides a TypeScript wrapper around the Independent Reserve API, implementing:
- **Balance checking**: Get available AUD balance from your Independent Reserve account
- **Withdrawals**: Withdraw AUD to registered bank accounts
- **HMAC-SHA256 authentication**: Secure API authentication using your API key and secret

## Setup

### 1. Generate API Credentials

1. Visit https://portal.independentreserve.com/settings/api-keys
2. Click "Generate API Key"
3. Choose your required access level:
   - **Full Access**: Required for withdrawals and all operations
   - **Restricted Withdrawals**: Can only withdraw to whitelisted bank accounts (recommended for security)
4. **Recommended**: Whitelist your server's IP addresses for additional security

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Independent Reserve API Configuration
IR_API_KEY=your_api_key_here
IR_API_SECRET=your_api_secret_here
```

### 3. Register Bank Accounts

Before you can withdraw funds, you need to register bank accounts in your Independent Reserve portal:

1. Go to https://portal.independentreserve.com/settings/bank-accounts
2. Add your bank account details
3. Complete verification process
4. The account will receive a `bankAccountGuid` that can be used for withdrawals

## Usage

### Check AUD Balance

```typescript
import { IndependentReserveService } from './services/IndependentReserveService.js';

const irService = new IndependentReserveService();

// Get AUD balance
const balance = await irService.balance();
console.log(`Available: ${balance.availableBalance} AUD`);
console.log(`Pending: ${balance.pendingBalance} AUD`);
console.log(`Total: ${balance.totalBalance} AUD`);
```

### Withdraw AUD

```typescript
// Withdraw to default active bank account
const withdrawal = await irService.withdraw(
  1000.00,              // Amount in AUD
  undefined,            // Bank account GUID (undefined = use first active account)
  'Loan disbursement',  // Optional comment
  true                  // Use NPP (New Payments Platform) for faster transfers
);

console.log(`Withdrawal initiated: ${withdrawal.fiatWithdrawalRequestGuid}`);
console.log(`Total amount: ${withdrawal.totalWithdrawalAmount} AUD`);
console.log(`Fee: ${withdrawal.feeAmount} AUD`);
console.log(`Status: ${withdrawal.status}`);
```

### Withdraw to Specific Bank Account

```typescript
// Get list of registered bank accounts
const bankAccounts = await irService.getBankAccounts();
const targetAccount = bankAccounts.find(acc => acc.isActive);

if (targetAccount) {
  const withdrawal = await irService.withdraw(
    1000.00,
    targetAccount.bankAccountGuid,  // Specific bank account
    'Loan disbursement'
  );
}
```

### Get Withdrawal Fees

```typescript
const fees = await irService.getWithdrawalFees();
console.log('Withdrawal fees:', fees);
```

## API Endpoints Used

The service integrates with the following Independent Reserve API endpoints:

### Private Endpoints (require authentication)

- `POST /Private/GetAccounts` - Retrieve account information and balances
- `POST /Private/GetFiatBankAccounts` - Get list of registered bank accounts
- `POST /Private/WithdrawFiatCurrency` - Initiate AUD withdrawal
- `POST /Private/GetFiatWithdrawalFees` - Get withdrawal fee information

## Integration with ApiDisbursementService

The `ApiDisbursementService` has been updated to use Independent Reserve:

```typescript
import { ApiDisbursementService } from './services/ApiDisbursementService.js';

const service = new ApiDisbursementService();

// Check balance (uses Independent Reserve)
const balance = await service.balance();

// Send AUD (uses Independent Reserve withdrawal)
const txRef = await service.send(
  1000.00,              // Amount
  bankAccountGuid       // Optional - uses default if not provided
);
```

## API Routes

The disbursement routes automatically use Independent Reserve:

### Get Balance
```bash
GET /api/disbursements/balance/api
```

Response:
```json
{
  "method": "api",
  "balance": {
    "availableBalance": 50000.00,
    "pendingBalance": 500.00,
    "totalBalance": 50500.00
  }
}
```

### Create Disbursement
```bash
POST /api/disbursements
```

Request body:
```json
{
  "loanId": 123,
  "customerId": 456,
  "amountAud": 1000.00,
  "recipientAddress": "bank-account-guid-or-empty",
  "method": "api"
}
```

## Authentication Details

The service uses HMAC-SHA256 authentication:

1. **Nonce**: Auto-incremented timestamp-based value
2. **Signature**: HMAC-SHA256 hash of the request URL and parameters
3. **Message format**: `url,param1=value1,param2=value2,...` (parameters sorted alphabetically)

Example signature creation:
```typescript
const message = "https://api.independentreserve.com/Private/GetAccounts,apiKey=ABC123,nonce=1234567890";
const signature = crypto.createHmac('sha256', apiSecret)
  .update(message)
  .digest('hex');
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const balance = await irService.balance();
} catch (error) {
  console.error('Failed to fetch balance:', error.message);
  // Handle error appropriately
}
```

Common errors:
- Missing API credentials
- Invalid signature (check your API secret)
- Insufficient balance for withdrawal
- No active bank accounts registered
- API rate limiting

## Security Considerations

1. **Never commit API credentials** to version control
2. Use environment variables for API keys
3. **Whitelist IP addresses** in Independent Reserve portal
4. Use **Restricted Withdrawals** role if possible
5. Only withdraw to **pre-registered and verified** bank accounts
6. Monitor withdrawal limits and implement rate limiting

## Testing

For testing, you can use Independent Reserve's test environment (if available) or use small amounts on the production API with proper controls in place.

## Support

For API issues or questions:
- Email: support@independentreserve.com
- Documentation: https://www.independentreserve.com/features/api
- Portal: https://portal.independentreserve.com

## Rate Limits

Be aware of API rate limits. The service automatically:
- Uses sequential nonces to prevent replay attacks
- Implements automatic retry logic with delays (up to 3 times)
- Times out after 2.5 seconds by default

## NPP (New Payments Platform)

When `useNpp: true` is set in withdrawals:
- Transfers are typically completed within minutes
- Available for transfers between participating Australian banks
- Same-day settlement
- May have different fee structure than standard transfers
