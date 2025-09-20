declare module '@econeura/db' {
  // Minimal shape to satisfy shared cost-meter dynamic imports in Next build
  export const db: any
  export const setOrg: (orgId: string) => Promise<void>
  export const aiCostUsage: any
}
