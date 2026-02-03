import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.header("Authorization") || req.header("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid or missing token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  try {
    const secret = process.env.JWT_SECRET || "default_secret";
    const payload = jwt.verify(token, secret);
    // @ts-ignore
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
