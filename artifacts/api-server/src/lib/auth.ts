/**
 * Auth + security middleware — Week 13
 */
import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

const ALLOWED_KEYS = new Set(
  (process.env["API_KEYS"] ?? "dev-key-change-before-production").split(",").map(k => k.trim())
);

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const id = (req.headers["x-correlation-id"] as string) ?? crypto.randomUUID();
  (req as Record<string,unknown> & Request)["correlationId"] = id;
  res.setHeader("x-correlation-id", id);
  next();
}

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const key = (req.headers["x-api-key"] as string) ?? "";
  if (!key || !ALLOWED_KEYS.has(key)) {
    res.status(401).json({ error: "Unauthorized", message: "Valid x-api-key header required" });
    return;
  }
  next();
}

export function largePayloadGuard(req: Request, res: Response, next: NextFunction): void {
  const MAX = 5 * 1024 * 1024;
  const len = parseInt(req.headers["content-length"] ?? "0", 10);
  if (len > MAX) { res.status(413).json({ error: "Payload too large", maxBytes: MAX }); return; }
  next();
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
}
