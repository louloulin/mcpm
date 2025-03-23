#!/usr/bin/env node

// This script is used to run the CLI during development
// It handles ESM/CommonJS compatibility issues

const { spawn } = require('child_process');
const path = require('path');

// Build the path to the CLI entry point
const cliPath = path.join(__dirname, '..', 'lib', 'cli', 'index.ts');

// Get any additional arguments passed to this script
const args = process.argv.slice(2);

// Use tsx to run the CLI with ESM support
const child = spawn('npx', ['tsx', cliPath, ...args], {
  stdio: 'inherit'
});

// Handle process exit
child.on('exit', (code) => {
  process.exit(code || 0);
});

// Handle process errors
child.on('error', (err) => {
  console.error('Failed to run CLI:', err);
  process.exit(1);
}); 