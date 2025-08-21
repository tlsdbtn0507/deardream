module.exports = {
  parser: "@typescript-eslint/parser", // 타입스크립트 파서 사용
  plugins: ["@typescript-eslint"],     // 타입스크립트 플러그인 활성화
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended", // 추천 규칙
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "off", // any 허용
  },
};