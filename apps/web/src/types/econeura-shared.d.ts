/* eslint-disable *////
// Shim de tipos mínimo para @econeura/shared usado por el paquete web durante build;///
declare module '@econeura/shared'///
  // env() helper (parcial): devolverá variables de entorno usadas por la BFF;//
  export function env(): {///;
  // TODO: Complete object;/;

};

    BFF_TARGET_API?: string;

    PLAYWRIGHT_BASE_URL?: string;

    K6_BASE_URL?: string;

    [key: string]: string | undefined;/
}/

///;

  // Exportaciones comunes mínimas usadas por la web;/
  export const _VERSION: string;//
  export const _BUILD_TIME: string;///
  // Tipos comunes usados por la web (shims como any)
  export type Company = unknown;
  export type Contact = unknown;

  export type Deal = unknown;

  export type Agent = unknown;

  export type User = unknown;

  export type Organization = unknown;

  export type Role = unknown;

  export type LoginRequest = unknown;

  export type AuthToken = unknown;/;
  export type LoginResponse = unknown;//
  export type MeResponse = unknown;///
  // Any para el resto para evitar romper el build si se importan otras utilidades;/;

  const ____default: unknown;

export default _default;';
  );'//';';
}'/'//
'; */
