import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Layering (see BRIEF.md §5): domain -> data -> features -> ui.
// The rules below keep the lower layers free of framework and backend imports.
const restrict = (patterns) => ['error', { patterns }];

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'node_modules', 'playwright-report', 'test-results', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: { globals: globals.browser },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['src/domain/**', 'src/config/**'],
    rules: {
      'no-restricted-imports': restrict([
        { group: ['react', 'react-*', '@supabase/*', 'leaflet'], message: 'domain/ and config/ must stay pure.' },
        { group: ['**/data/**', '**/features/**', '**/ui/**'], message: 'domain/ and config/ cannot depend on upper layers.' },
      ]),
    },
  },
  {
    files: ['src/data/**'],
    rules: {
      'no-restricted-imports': restrict([
        { group: ['react', 'react-*'], message: 'data/ must not depend on React.' },
        { group: ['**/features/**', '**/ui/**'], message: 'data/ cannot depend on upper layers.' },
      ]),
    },
  },
  {
    files: ['src/ui/**'],
    rules: {
      'no-restricted-imports': restrict([
        { group: ['@supabase/*', '**/data/**', '**/features/**'], message: 'ui/ is presentational: no data or feature imports.' },
      ]),
    },
  },
  {
    files: ['scripts/**', '*.config.{js,ts}', 'e2e/**'],
    languageOptions: { globals: globals.node },
  },
);
