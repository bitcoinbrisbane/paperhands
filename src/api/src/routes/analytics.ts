import { Router, Request, Response } from "express";

const router = Router();

// Get loans with LVR data
router.get("/loans-lvr", async (req: Request, res: Response) => {
  try {
    // Mock data for loans with different LVR (Loan-to-Value Ratio) percentages
    const data = [
      { lvr: "0-20%", count: 12, amount: 145000 },
      { lvr: "20-40%", count: 28, amount: 320000 },
      { lvr: "40-60%", count: 45, amount: 580000 },
      { lvr: "60-80%", count: 18, amount: 210000 },
      { lvr: "80-100%", count: 7, amount: 85000 },
    ];

    res.json(data);
  } catch (error) {
    console.error("Error fetching loans LVR data:", error);
    res.status(500).json({ error: "Failed to fetch loans LVR data" });
  }
});

// Get capital supplied and utilization data
router.get("/capital-utilization", async (req: Request, res: Response) => {
  try {
    // Mock data for capital supplied vs utilized over time
    const data = [
      { month: "Jan", supplied: 500000, utilized: 320000 },
      { month: "Feb", supplied: 580000, utilized: 385000 },
      { month: "Mar", supplied: 720000, utilized: 490000 },
      { month: "Apr", supplied: 850000, utilized: 620000 },
      { month: "May", supplied: 950000, utilized: 715000 },
      { month: "Jun", supplied: 1100000, utilized: 850000 },
    ];

    res.json(data);
  } catch (error) {
    console.error("Error fetching capital utilization data:", error);
    res.status(500).json({ error: "Failed to fetch capital utilization data" });
  }
});

// Get interest earned data
router.get("/interest-earned", async (req: Request, res: Response) => {
  try {
    // Mock data for interest earned over time
    const data = [
      { month: "Jan", interest: 3500 },
      { month: "Feb", interest: 4200 },
      { month: "Mar", interest: 5800 },
      { month: "Apr", interest: 7400 },
      { month: "May", interest: 8500 },
      { month: "Jun", interest: 10200 },
    ];

    res.json(data);
  } catch (error) {
    console.error("Error fetching interest earned data:", error);
    res.status(500).json({ error: "Failed to fetch interest earned data" });
  }
});

// Get summary statistics
router.get("/summary", async (req: Request, res: Response) => {
  try {
    // Mock summary data
    const summary = {
      totalLoans: 110,
      totalLoanValue: 1340000,
      totalCapitalSupplied: 1100000,
      utilizationRate: 77.3,
      totalInterestEarned: 39600,
      averageLVR: 52.5,
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

export default router;
