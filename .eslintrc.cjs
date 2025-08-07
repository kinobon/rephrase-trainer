module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "solid", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:solid/recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: ["dist", "node_modules", "target", "*.css", "*.json"],
};
