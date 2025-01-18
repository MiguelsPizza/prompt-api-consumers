import securityPlugin from "eslint-plugin-security";
import tseslint from "typescript-eslint";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ["**/*.ts"],
    plugins: {
      security: securityPlugin,
    },
    rules: {
      // Security rules
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-eval-with-expression": "error",
      "security/detect-no-csrf-before-method-override": "error",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-unsafe-regex": "error",

      // MongoDB specific security rules
      "security/detect-non-literal-fs-filename": "error",
    },
  },
];