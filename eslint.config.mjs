import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Phase 1 guardrail: warn before files become unmaintainable monoliths.
      // Hard limit for new code: use `npm run lint:file-sizes:strict`.
      "max-lines": [
        "warn",
        { max: 400, skipBlankLines: true, skipComments: true },
      ],
    },
  },
  {
    // App route files should stay thin wrappers; delegate to src/features/.
    files: ["app/**/page.tsx"],
    rules: {
      "max-lines": [
        "warn",
        { max: 80, skipBlankLines: true, skipComments: true },
      ],
    },
  },
]);

export default eslintConfig;
