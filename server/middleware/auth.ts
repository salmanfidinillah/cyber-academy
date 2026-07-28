import { Response, NextFunction } from "express";
import { DecodedIdToken } from "firebase-admin/auth";
import { AuthenticatedRequest } from "../types";
import { adminAuth } from "../firebaseAdmin";

export interface VerifyTokenService {
  verifyIdToken(token: string, checkRevoked?: boolean): Promise<DecodedIdToken>;
}

let tokenVerifier: VerifyTokenService = adminAuth;

export function setTokenVerifierForTesting(mockVerifier: VerifyTokenService | null) {
  tokenVerifier = mockVerifier || adminAuth;
}

export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") {
    res.status(401).json({ error: "Sesi tidak valid atau telah berakhir." });
    return;
  }

  // Strictly split by spaces and expect exactly 2 tokens: ["Bearer", "<token>"]
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1] || parts[1].trim() === "") {
    res.status(401).json({ error: "Sesi tidak valid atau telah berakhir." });
    return;
  }

  const token = parts[1];

  try {
    const decodedToken = await tokenVerifier.verifyIdToken(token, true);
    if (!decodedToken || !decodedToken.uid) {
      res.status(401).json({ error: "Sesi tidak valid atau telah berakhir." });
      return;
    }

    const isAdmin = decodedToken.admin === true;

    req.authUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      admin: isAdmin,
      token: decodedToken,
    };

    next();
  } catch (error) {
    res.status(401).json({ error: "Sesi tidak valid atau telah berakhir." });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.authUser) {
    res.status(401).json({ error: "Sesi tidak valid atau telah berakhir." });
    return;
  }

  if (req.authUser.admin !== true) {
    res.status(403).json({ error: "Anda tidak memiliki akses." });
    return;
  }

  next();
}
