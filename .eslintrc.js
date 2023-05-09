module.exports = {
  parser: '@typescript-eslint/parser',
  root: true,
  ignorePatterns: ['node_modules'],
  parserOptions: {
    createDefaultProgram: true,
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true,
  },
  overrides: [
    {
      files: ['*.ts', '*.js'],
      parserOptions: {
        project: require.resolve('./tsconfig.json'),
        createDefaultProgram: true,
      },
      extends: ['plugin:@angular-eslint/recommended', 'plugin:@angular-eslint/template/process-inline-templates'],
    },
    {
      files: ['*.html'],
      extends: ['plugin:@angular-eslint/template/recommended'],
    },
    {
      files: ['*.md'],
      extends: ['plugin:markdown/recommended'],
    },
  ],
};
