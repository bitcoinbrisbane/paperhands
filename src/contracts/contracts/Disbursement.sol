// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Disbursement
 * @dev Contract for disbursing ERC20 tokens (AUDC) to loan recipients
 * @notice Used by PaperHands for on-chain loan disbursements
 */
contract Disbursement is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // The stablecoin token used for disbursements (e.g., AUDC)
    IERC20 public disbursementToken;

    // Mapping of loan ID to disbursement status
    mapping(bytes32 => DisbursementRecord) public disbursements;

    // Array of all disbursement IDs for enumeration
    bytes32[] public disbursementIds;

    struct DisbursementRecord {
        bytes32 loanId;
        address recipient;
        uint256 amount;
        uint256 timestamp;
        bool completed;
    }

    event DisbursementCreated(
        bytes32 indexed disbursementId,
        bytes32 indexed loanId,
        address indexed recipient,
        uint256 amount
    );

    event DisbursementCompleted(
        bytes32 indexed disbursementId,
        bytes32 indexed loanId,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event TokenUpdated(address indexed oldToken, address indexed newToken);

    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount);

    error InvalidAddress();
    error InvalidAmount();
    error DisbursementAlreadyExists();
    error DisbursementNotFound();
    error DisbursementAlreadyCompleted();
    error InsufficientBalance();
    error ArrayLengthMismatch();

    /**
     * @dev Constructor sets the initial owner and disbursement token
     * @param _disbursementToken Address of the ERC20 token used for disbursements
     */
    constructor(address _disbursementToken) Ownable(msg.sender) {
        if (_disbursementToken == address(0)) revert InvalidAddress();
        disbursementToken = IERC20(_disbursementToken);
    }

    /**
     * @dev Disburse tokens to a recipient for a specific loan
     * @param loanId Unique identifier for the loan
     * @param recipient Address to receive the disbursement
     * @param amount Amount of tokens to disburse
     */
    function disburse(
        bytes32 loanId,
        address recipient,
        uint256 amount
    ) external onlyOwner nonReentrant whenNotPaused {
        if (recipient == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        bytes32 disbursementId = keccak256(abi.encodePacked(loanId, recipient, amount, block.timestamp));

        if (disbursements[disbursementId].completed) revert DisbursementAlreadyExists();

        uint256 balance = disbursementToken.balanceOf(address(this));
        if (balance < amount) revert InsufficientBalance();

        disbursements[disbursementId] = DisbursementRecord({
            loanId: loanId,
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            completed: true
        });

        disbursementIds.push(disbursementId);

        disbursementToken.safeTransfer(recipient, amount);

        emit DisbursementCreated(disbursementId, loanId, recipient, amount);
        emit DisbursementCompleted(disbursementId, loanId, recipient, amount, block.timestamp);
    }

    /**
     * @dev Batch disburse tokens to multiple recipients
     * @param loanIds Array of loan identifiers
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to disburse
     */
    function batchDisburse(
        bytes32[] calldata loanIds,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner nonReentrant whenNotPaused {
        if (loanIds.length != recipients.length || recipients.length != amounts.length) {
            revert ArrayLengthMismatch();
        }

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        uint256 balance = disbursementToken.balanceOf(address(this));
        if (balance < totalAmount) revert InsufficientBalance();

        for (uint256 i = 0; i < loanIds.length; i++) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (amounts[i] == 0) revert InvalidAmount();

            bytes32 disbursementId = keccak256(
                abi.encodePacked(loanIds[i], recipients[i], amounts[i], block.timestamp, i)
            );

            disbursements[disbursementId] = DisbursementRecord({
                loanId: loanIds[i],
                recipient: recipients[i],
                amount: amounts[i],
                timestamp: block.timestamp,
                completed: true
            });

            disbursementIds.push(disbursementId);

            disbursementToken.safeTransfer(recipients[i], amounts[i]);

            emit DisbursementCreated(disbursementId, loanIds[i], recipients[i], amounts[i]);
            emit DisbursementCompleted(disbursementId, loanIds[i], recipients[i], amounts[i], block.timestamp);
        }
    }

    /**
     * @dev Get the total number of disbursements
     * @return Total count of disbursements
     */
    function getDisbursementCount() external view returns (uint256) {
        return disbursementIds.length;
    }

    /**
     * @dev Get disbursement details by ID
     * @param disbursementId The disbursement identifier
     * @return DisbursementRecord struct with details
     */
    function getDisbursement(bytes32 disbursementId) external view returns (DisbursementRecord memory) {
        return disbursements[disbursementId];
    }

    /**
     * @dev Update the disbursement token address
     * @param newToken Address of the new ERC20 token
     */
    function setDisbursementToken(address newToken) external onlyOwner {
        if (newToken == address(0)) revert InvalidAddress();
        address oldToken = address(disbursementToken);
        disbursementToken = IERC20(newToken);
        emit TokenUpdated(oldToken, newToken);
    }

    /**
     * @dev Get the contract's token balance
     * @return Current balance of disbursement tokens
     */
    function getBalance() external view returns (uint256) {
        return disbursementToken.balanceOf(address(this));
    }

    /**
     * @dev Withdraw tokens from the contract (emergency function)
     * @param token Address of the token to withdraw
     * @param to Address to send tokens to
     * @param amount Amount to withdraw
     */
    function withdrawTokens(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner nonReentrant {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        IERC20(token).safeTransfer(to, amount);
        emit FundsWithdrawn(token, to, amount);
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
