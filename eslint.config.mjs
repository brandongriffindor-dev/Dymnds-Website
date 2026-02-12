import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      ".next-verify/**",
      ".next-verify2/**",
      "out/**",
      "build/**",
      "sessions/**",
      "**/chunks/**",
      "next-env.d.ts",
    ],
  },
  ...nextVitals,
  ...nextTs,
];

export default eslintConfig;
