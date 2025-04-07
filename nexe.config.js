module.exports = {
  input: '.next/standalone/server.js',
  output: 'dist/mcpm-app',
  resources: [
    '.next/standalone/**/*',
    '.next/static/**/*',
    'public/**/*'
  ],
  build: true,
  flags: [
    '--no-warnings',
    '--max-old-space-size=4096'
  ],
  targets: [
    'linux-x64',
    'macos-x64',
    'win-x64'
  ],
  rc: {
    NODE_ENV: 'production',
    PORT: '5100'
  }
}; 