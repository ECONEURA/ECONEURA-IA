import js from "@eslint/js";
import ts from "typescript-eslint";
export default [
  { ignores:["**/{node_modules,dist,build,.next,out,coverage,reports}/**"] },
  js.configs.recommended, ...ts.configs.recommended,
  { rules:{
      "no-console":["warn",{allow:["warn","error"]}],
      "@typescript-eslint/no-unused-vars":["error",{argsIgnorePattern:"^_",varsIgnorePattern:"^_"}],
      "@typescript-eslint/no-explicit-any":"warn"
  }}
];