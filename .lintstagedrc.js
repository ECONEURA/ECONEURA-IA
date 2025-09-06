module.exports = {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
    'prettier --write',
    'git add'
  ],
  
  // JSON files
  '**/*.json': [
    'prettier --write',
    'git add'
  ],
  
  // Markdown files
  '**/*.md': [
    'prettier --write',
    'git add'
  ],
  
  // YAML files
  '**/*.{yml,yaml}': [
    'prettier --write',
    'git add'
  ],
  
  // CSS and SCSS files
  '**/*.{css,scss,sass}': [
    'prettier --write',
    'git add'
  ],
  
  // Package.json files
  '**/package.json': [
    'prettier --write',
    'git add'
  ]
};
