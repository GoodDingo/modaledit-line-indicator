const { defineConfig } = require('@vscode/test-cli');

module.exports = defineConfig({
  files: 'out/test/**/*.test.js',
  version: '1.85.0', // Test against minimum supported version
  mocha: {
    ui: 'tdd',
    timeout: 20000,
    color: true
  }
});
