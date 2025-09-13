# CODE STYLE

Reglas básicas:

- TypeScript: prefer `unknown` sobre `any`; usar `as` sólo cuando necesario.
- Imports: `consistent-type-imports` en tsconfig/eslint.
- Formato: Prettier con reglas del repo (delegar a .prettierrc si existe).
- No `console.log` en producción; usar `packages/shared/logging`.
