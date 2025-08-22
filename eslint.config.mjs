// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tsParser from "@typescript-eslint/parser";
import tseslint from "@typescript-eslint/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });
const Module = [
  // Next.js 권장 설정
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // 타입스크립트 추가 설정
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ["./tsconfig.json"], // 있으면 지정
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      '@next/next/no-img-element': 'off',  // <<< 이 줄 추가
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },
];
export default Module