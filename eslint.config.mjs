import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: false,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^(_|ignore)',
        },
      ],
    },
  },
  {
    // Migrations keep the `({ db, payload, req })` signature Payload's template
    // generates, whichever of the three a given migration needs.
    files: ['src/migrations/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { vars: 'all', args: 'none' }],
    },
  },
  {
    ignores: [
      '.next/',
      '.next-e2e/',
      'coverage/',
      'playwright-report/',
      'lighthouse-report/',
      '.lighthouseci/',
      'test-results/',
      'src/payload-types.ts',
      'src/payload-generated-schema.ts',
      // Third-party skill installed with `npx skills add` (see skills-lock.json):
      // its CommonJS scripts are replaced on update, never edited here.
      '.claude/skills/security-audit/',
    ],
  },
]

export default eslintConfig
