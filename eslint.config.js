import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const FEATURES = ['today', 'gallery', 'explore'];

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public/mockServiceWorker.js'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Layering: lib/ and components/ never import app/ or features/.
  {
    files: ['src/lib/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}', 'src/utils/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/features/*'],
              message: 'lib/components must not depend on app or features.',
            },
          ],
        },
      ],
    },
  },
  // lib/nasa stays independent of observability (it exposes a timing hook instead).
  {
    files: ['src/lib/nasa/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*', '@/features/*', '@/lib/observability', '@/lib/observability/*'],
              message: 'lib/nasa must not import observability, app or features.',
            },
          ],
        },
      ],
    },
  },
  // Features never import each other.
  ...FEATURES.map((feature) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/app/*'], message: 'Features must not import app/.' },
            {
              group: FEATURES.filter((f) => f !== feature).map((f) => `@/features/${f}/*`),
              message: 'Features must not import other features.',
            },
          ],
        },
      ],
    },
  })),
);
