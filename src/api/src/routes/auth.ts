import { Router, Request, Response } from "express";
import { findUserByEmail, findCustomerByUserId, verifyPassword } from "../services/userService.js";

const router = Router();

interface LoginRequest {
  email: string;
  password: string;
}

router.post("/login", async (req: Request<object, object, LoginRequest>, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    console.log("Login attempt:", { email, password: "***" });

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Get customer info
    const customer = await findCustomerByUserId(user.id);

    console.log("Login successful:", { userId: user.id, email: user.email });

    res.json({
      token: `jwt-token-${user.id}`, // TODO: Generate real JWT
      user: {
        id: user.id,
        email: user.email,
        customerId: customer?.id,
        firstName: customer?.first_name,
        lastName: customer?.last_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/apple", (_req: Request, res: Response) => {
  // TODO: Implement Apple OAuth
  console.log("Apple login attempt");

  res.json({
    token: "stub-apple-jwt-token",
    user: {
      id: "stub-apple-user-id",
      email: "apple-user@example.com",
    },
  });
});

router.post("/passkey", (_req: Request, res: Response) => {
  // TODO: Implement Passkey/WebAuthn authentication
  console.log("Passkey login attempt");

  res.json({
    token: "stub-passkey-jwt-token",
    user: {
      id: "stub-passkey-user-id",
      email: "passkey-user@example.com",
    },
  });
});

router.post("/logout", (_req: Request, res: Response) => {
  // TODO: Implement logout (invalidate token)
  console.log("Logout attempt");

  res.json({ success: true });
});

export default router;
