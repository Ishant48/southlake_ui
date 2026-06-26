#!/usr/bin/env bash
# Run once after `npm install` to add ESLint + Prettier devDependencies.
# Delete this file after running.
npm install --save-dev \
  eslint@^9 \
  @eslint/js@^9 \
  typescript-eslint@^8 \
  angular-eslint@^19 \
  eslint-plugin-prettier@^5 \
  eslint-config-prettier@^9 \
  prettier@^3 \
  lint-staged@^15

echo ""
echo "Lint deps installed. The eslint.config.mjs and .prettierrc are already in place."
echo "Run: npm run lint       (check)"
echo "Run: npm run lint:fix   (auto-fix)"
echo "Run: npm run format     (prettier write)"
