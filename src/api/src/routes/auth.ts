import { Router, Request, Response } from "express";

const router = Router();

interface LoginRequest {
  email: string;
  password: string;
}

router.post("/login", (req: Request<object, object, LoginRequest>, res: Response) => {
  const { email, password } = req.body;

  // TODO: Implement actual authentication
  console.log("Login attempt:", { email, password: "***" });

  res.json({
    token: "stub-jwt-token",
    user: {
      id: "stub-user-id",
      email: email,
    },
  });
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
