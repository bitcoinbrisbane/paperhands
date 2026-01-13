# PaperHands Smart Contracts

Solidity smart contracts for on-chain AUD disbursements using Hardhat and TypeScript.

## Overview

The `Disbursement` contract enables on-chain disbursement of ERC20 stablecoins (like AUDC) to loan recipients. It supports:

- Single disbursements with loan ID tracking
- Batch disbursements for multiple recipients
- Pause/unpause functionality for emergency stops
- Token withdrawal for contract management

## Setup

```bash
# Install dependencies
yarn install

# Copy environment file and configure
cp .env.example .env
```

## Development

```bash
# Compile contracts
yarn compile

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Start local Hardhat node
yarn node

# Deploy to local network (in another terminal)
yarn deploy:localhost
```

## Deployment

### Local Development

```bash
# Start local node
yarn node

# Deploy (separate terminal)
yarn deploy:localhost
```

### Testnet (Sepolia)

```bash
# Set environment variables
export INFURA_API_KEY=your_key
export DEPLOYER_PRIVATE_KEY=your_key
export AUDC_CONTRACT_ADDRESS=0x...

# Deploy
yarn deploy:sepolia
```

### Mainnet

```bash
yarn deploy:mainnet
```

## Contract Architecture

### Disbursement.sol

The main contract for managing on-chain disbursements.

**Key Functions:**

- `disburse(bytes32 loanId, address recipient, uint256 amount)` - Disburse tokens to a single recipient
- `batchDisburse(bytes32[] loanIds, address[] recipients, uint256[] amounts)` - Batch disbursement
- `getBalance()` - Get contract's token balance
- `getDisbursementCount()` - Get total number of disbursements
- `setDisbursementToken(address newToken)` - Update the disbursement token
- `withdrawTokens(address token, address to, uint256 amount)` - Emergency token withdrawal
- `pause()` / `unpause()` - Circuit breaker functionality

**Events:**

- `DisbursementCreated` - Emitted when a disbursement is initiated
- `DisbursementCompleted` - Emitted when a disbursement is completed
- `TokenUpdated` - Emitted when the disbursement token is changed
- `FundsWithdrawn` - Emitted when tokens are withdrawn

### MockAUDC.sol

A mock ERC20 token for testing purposes only.

## Integration with API

The contracts are designed to integrate with the existing `OnChainDisbursementService` in the Node.js API. To integrate:

1. Deploy the contracts to your target network
2. Set `DISBURSEMENT_CONTRACT_ADDRESS` in your API environment
3. Fund the contract with AUDC tokens
4. Update `OnChainDisbursementService` to call the contract's `disburse` function

## Security Considerations

- Only the contract owner can execute disbursements
- Reentrancy protection on all state-changing functions
- Pausable in case of emergency
- Custom errors for gas-efficient reverts

## Networks Supported

- Ethereum Mainnet
- Sepolia Testnet
- Arbitrum One
- Arbitrum Sepolia
- Base
- Base Sepolia

## Gas Estimates

| Function | Estimated Gas |
|----------|---------------|
| disburse | ~80,000 |
| batchDisburse (2) | ~130,000 |
| batchDisburse (10) | ~450,000 |
