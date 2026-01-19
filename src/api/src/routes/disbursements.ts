import express, { Request, Response } from "express";
import { OnChainDisbursementService } from "../services/OnChainDisbursementService.js";
import {
  DisbursementMethod,
  DisbursementStatus,
  createDisbursement,
  updateDisbursement,
  getDisbursement,
  getDisbursementsByLoan,
  getDisbursementsByCustomer,
} from "../services/disbursementRepository.js";

const router = express.Router();

// Initialize on-chain service
const onChainService = new OnChainDisbursementService();

interface CreateDisbursementRequest {
  loanId: number;
  customerId: number;
  amountAud: number;
  recipientAddress: string;
  method: DisbursementMethod;
}

/**
 * POST /api/disbursements
 * Create and process a new disbursement
 */
router.post(
  "/",
  async (req: Request<object, object, CreateDisbursementRequest>, res: Response) => {
    try {
      const { loanId, customerId, amountAud, recipientAddress, method } = req.body;

      // Validate required fields
      if (!loanId || !customerId || !amountAud || !recipientAddress || !method) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Validate method - only ON_CHAIN is supported
      if (method !== DisbursementMethod.ON_CHAIN) {
        res.status(400).json({ error: "Invalid disbursement method. Only 'on_chain' is supported." });
        return;
      }

      // Create disbursement record
      const disbursement = await createDisbursement(
        loanId,
        customerId,
        amountAud,
        recipientAddress,
        method
      );

      try {
        // Update to processing
        await updateDisbursement(disbursement.id, DisbursementStatus.PROCESSING);

        // Send using on-chain service
        const txHash = await onChainService.send(amountAud, recipientAddress);

        // Update to completed
        await updateDisbursement(disbursement.id, DisbursementStatus.COMPLETED, txHash);

        // Get updated record
        const updatedDisbursement = await getDisbursement(disbursement.id);

        res.status(201).json({
          success: true,
          disbursement: updatedDisbursement,
        });
      } catch (error) {
        // Update to failed
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await updateDisbursement(
          disbursement.id,
          DisbursementStatus.FAILED,
          undefined,
          errorMessage
        );

        res.status(500).json({
          success: false,
          error: errorMessage,
          disbursement: await getDisbursement(disbursement.id),
        });
      }
    } catch (error) {
      console.error("Error creating disbursement:", error);
      res.status(500).json({
        error: "Failed to create disbursement",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

/**
 * GET /api/disbursements/balance/:method
 * Get available balance for a disbursement method
 */
router.get("/balance/:method", async (req: Request<{ method: string }>, res: Response) => {
  try {
    const method = req.params.method as DisbursementMethod;

    // Validate method - only ON_CHAIN is supported
    if (method !== DisbursementMethod.ON_CHAIN) {
      res.status(400).json({ error: "Invalid disbursement method. Only 'on_chain' is supported." });
      return;
    }

    // Get balance from on-chain service
    const balance = await onChainService.balance();

    res.json({
      method,
      balance,
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({
      error: "Failed to fetch balance",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/disbursements/:id
 * Get disbursement by ID
 */
router.get("/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const disbursement = await getDisbursement(id);

    if (!disbursement) {
      res.status(404).json({ error: "Disbursement not found" });
      return;
    }

    res.json(disbursement);
  } catch (error) {
    console.error("Error fetching disbursement:", error);
    res.status(500).json({ error: "Failed to fetch disbursement" });
  }
});

/**
 * GET /api/disbursements/loan/:loanId
 * Get all disbursements for a loan
 */
router.get("/loan/:loanId", async (req: Request<{ loanId: string }>, res: Response) => {
  try {
    const loanId = parseInt(req.params.loanId);
    const disbursements = await getDisbursementsByLoan(loanId);
    res.json(disbursements);
  } catch (error) {
    console.error("Error fetching disbursements:", error);
    res.status(500).json({ error: "Failed to fetch disbursements" });
  }
});

/**
 * GET /api/disbursements/customer/:customerId
 * Get all disbursements for a customer
 */
router.get(
  "/customer/:customerId",
  async (req: Request<{ customerId: string }>, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const disbursements = await getDisbursementsByCustomer(customerId);
      res.json(disbursements);
    } catch (error) {
      console.error("Error fetching disbursements:", error);
      res.status(500).json({ error: "Failed to fetch disbursements" });
    }
  }
);

export default router;
