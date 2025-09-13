// Shim para tests: declarar HilState igual que en apps/api/src/hil/service.ts
// Esto evita casts innecesarios en los tests durante el typecheck.
declare type HilState = "draft" | "pending_approval" | "approved" | "rejected" | "dispatched" | "completed" | "failed";
