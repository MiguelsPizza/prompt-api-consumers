// eslint.config.js

import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint
  .config(
    {
      ignores: ['dist', 'components', '**/dev-dist/**'],
    },
    // TypeScript configuration
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        ...tseslint.configs.recommended,
        // ...tseslint.configs.strictTypeChecked,
        // ...tseslint.configs.stylisticTypeChecked,
      ],
      languageOptions: {
        ecmaVersion: 2024,
        globals: {
          ...globals.browser,
        },
        parserOptions: {
          project: true,
        },
      },
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
      },
    }
  )
  .concat(eslintPluginPrettier);
