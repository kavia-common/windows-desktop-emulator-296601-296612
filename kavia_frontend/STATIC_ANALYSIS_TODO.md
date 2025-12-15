# Frontend Static Analysis TODO (React)

Current: No code present. Create baseline scaffolding and tools.

1) Initialize project
- npm init -y

2) Install tools
- TypeScript (recommended):
  npm i -D typescript @types/node @types/react @types/react-dom
- Lint/Format:
  npm i -D eslint eslint-config-prettier eslint-plugin-react eslint-plugin-react-hooks @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier
- Optional CSS lint:
  npm i -D stylelint stylelint-config-standard

3) Add configs
- .eslintrc.json
- .prettierrc
- tsconfig.json (if TS)

Example .eslintrc.json:
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "settings": { "react": { "version": "detect" } },
  "env": { "browser": true, "es2022": true, "node": true },
  "rules": {
    "eqeqeq": ["error", "always"],
    "curly": "error",
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "import/order": ["warn", { "alphabetize": { "order": "asc" }, "newlines-between": "always" }],
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }]
  }
}

Example .prettierrc:
{
  "singleQuote": true,
  "semi": true,
  "printWidth": 100,
  "trailingComma": "all"
}

4) package.json scripts
- "lint": "eslint 'src/**/*.{ts,tsx,js,jsx}'",
- "lint:fix": "eslint 'src/**/*.{ts,tsx,js,jsx}' --fix",
- "format": "prettier --write .",
- "typecheck": "tsc --noEmit",
- "audit": "npm audit --audit-level=moderate"

5) Run
- npm ci (once lockfile exists)
- npm run lint
- npm run typecheck
- npm audit
