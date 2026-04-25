import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      // Local-only dev scripts (not part of the app bundle)
      "scripts/**",
      // Standalone test files outside the Next.js project (Playwright, etc.)
      "imagegen-ui.spec.js"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
