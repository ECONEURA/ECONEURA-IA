// Shim de tipos mínimo para @econeura/shared usado por el paquete web durante build
declare module '@econeura/shared' {
  // env() helper (parcial): devolverá variables de entorno usadas por la BFF
  export function env(): {
    BFF_TARGET_API?: string
    PLAYWRIGHT_BASE_URL?: string
    K6_BASE_URL?: string
    [key: string]: string | undefined
  }

  // Exportaciones comunes mínimas usadas por la web
  export const VERSION: string
  export const BUILD_TIME: string

  // Tipos comunes usados por la web (shims como any)
  export type Company = any
  export type Contact = any
  export type Deal = any
  export type Agent = any
  export type User = any
  export type Organization = any
  export type Role = any
  export type LoginRequest = any
  export type AuthToken = any
  export type LoginResponse = any
  export type MeResponse = any

  // Any para el resto para evitar romper el build si se importan otras utilidades
  const _default: any
  export default _default
}
