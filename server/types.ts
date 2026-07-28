import { Request } from "express";
import { DecodedIdToken } from "firebase-admin/auth";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  admin: boolean;
  token: DecodedIdToken;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthenticatedUser;
}
