import type { Request, Response, NextFunction } from "express";
export function requireAADRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = (req as any).user?.roles ?? [];
    if (!Array.isArray(roles) || !roles.includes(role)) {
      return res.status(403).json({ type:"about:blank", title:"Forbidden", status:403, detail:`Requires role: ${role}`, instance:req.originalUrl });
    }
    next();
  };
}
