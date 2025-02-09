// eslint.config.mjs
import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default tsEslint.config(
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  prettierConfig,
  prettierPlugin
);
