export default {
  // TypeScript and JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix',
  ],
  
  // JSON files
  '**/*.json': [
    'prettier --write',
  ],
  
  // Markdown files
  '**/*.md': [
    'prettier --write',
  ],
  
  // YAML files
  '**/*.{yml,yaml}': [
    'prettier --write',
  ],
  
  // CSS and SCSS files
  '**/*.{css,scss,sass}': [
    'prettier --write',
  ],
  
  // Package.json files
  '**/package.json': [
    'prettier --write',
  ]
};
