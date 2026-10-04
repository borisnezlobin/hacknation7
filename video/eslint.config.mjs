import tseslint from "typescript-eslint";

export default tseslint.config(...tseslint.configs.recommended, {
  rules: { complexity: ["error", 15] },
});
