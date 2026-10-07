const config = {
  '*.{ts,tsx,js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,yml,yaml,css}': ['prettier --write'],
};
export default config;
