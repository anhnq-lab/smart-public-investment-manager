import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    // Ignore non-app directories
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'scripts/**',
            'Doccument/**',
            'resources/**',
            'templates/**',
            'supabase/**',
            'ifc-converter-api/**',
            '*.cjs',
            '*.mjs',
        ],
    },

    // Base JS rules
    js.configs.recommended,

    // TypeScript rules (lenient for existing codebase)
    ...tseslint.configs.recommended,

    // React hooks rules
    {
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },

    // Project-specific overrides (lenient to not break existing code)
    {
        rules: {
            // Relaxed for existing codebase — tighten over time
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-empty-object-type': 'off',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'warn',
        },
    },

    // Prettier (must be last to override formatting rules)
    prettier,
);
