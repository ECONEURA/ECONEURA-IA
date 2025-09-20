export default {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],

  // JSON files
  '**/*.json': [
    'prettier --write',
    'jsonlint --quiet',
  ],

  // Markdown files
  '**/*.md': [
    'prettier --write',
    'markdownlint --fix',
  ],

  // YAML files
  '**/*.{yml,yaml}': [
    'prettier --write',
    'yamllint --strict',
  ],

  // CSS and SCSS files
  '**/*.{css,scss,sass}': [
    'prettier --write',
    'stylelint --fix',
  ],

  // Package.json files
  '**/package.json': [
    'prettier --write',
    'npmPkgJsonLint .',
  ],

  // Docker files
  '**/Dockerfile*': [
    'hadolint',
  ],

  // Shell scripts
  '**/*.{sh,bash}': [
    'shellcheck',
    'shfmt -w -i 2',
  ],

  // GitHub Actions workflows
  '.github/workflows/*.yml': [
    'actionlint',
  ],
};
