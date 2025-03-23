import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

/**
 * Common options interface for cloud provider tests
 */
export interface CloudProviderTestOptions {
  name: string;
  description: string;
  author: string;
  version: string;
  transport: 'stdio' | 'http' | 'both';
  typescript: boolean;
  installDeps: boolean;
  destination: string;
  docker: boolean;
  cicd: boolean;
  cicdPlatform: 'github' | 'gitlab' | 'circleci' | 'jenkins' | 'azure' | 'travis' | 'both' | 'all' | 'none';
  kubernetes: boolean;
  helmChart: boolean;
  cloudProvider: 'aws' | 'gcp' | 'azure' | 'alibaba' | 'none';
  port?: number;
}

/**
 * Set up test directory for cloud provider tests
 */
export async function setupTestDir(dirName: string): Promise<string> {
  const tempDir = path.join(__dirname, '..', dirName);
  
  if (fs.existsSync(tempDir)) {
    await rimraf(tempDir);
  }
  
  fs.mkdirSync(tempDir, { recursive: true });
  
  return tempDir;
}

/**
 * Clean up test directory after tests
 */
export async function cleanupTestDir(dirName: string): Promise<void> {
  const tempDir = path.join(__dirname, '..', dirName);
  
  if (fs.existsSync(tempDir)) {
    await rimraf(tempDir);
  }
}

/**
 * Create standard test options for a specific cloud provider
 */
export function createTestOptions(cloudProvider: string): CloudProviderTestOptions {
  return {
    name: `test-${cloudProvider}`,
    description: `Test ${cloudProvider} cloud provider`,
    author: 'Test Author',
    version: '1.0.0',
    transport: 'http',
    typescript: true,
    installDeps: false,
    destination: `test-${cloudProvider}`,
    docker: true,
    cicd: false,
    cicdPlatform: 'none',
    kubernetes: false,
    helmChart: false,
    cloudProvider: cloudProvider as any,
    port: 3000
  };
}

/**
 * Validate common cloud provider file structure
 * @param baseDir Base directory
 * @param cloudProviderDir Cloud provider directory name (aws, gcp, azure, alibaba)
 * @param requiredFiles List of required files to check for
 */
export function validateCloudProviderFiles(
  baseDir: string, 
  cloudProviderDir: string, 
  requiredFiles: string[]
): void {
  // Check if cloud provider directory exists
  const providerDir = path.join(baseDir, cloudProviderDir);
  expect(fs.existsSync(providerDir)).toBe(true);
  
  // Check each required file
  for (const file of requiredFiles) {
    expect(fs.existsSync(path.join(providerDir, file))).toBe(true);
  }
  
  // Always check for README.md and deploy.sh with execute permissions
  expect(fs.existsSync(path.join(providerDir, 'README.md'))).toBe(true);
  
  const deployScriptPath = path.join(providerDir, 'deploy.sh');
  expect(fs.existsSync(deployScriptPath)).toBe(true);
  
  // Check execute permissions
  const stats = fs.statSync(deployScriptPath);
  const ownerExec = (stats.mode & 0o100) !== 0;
  expect(ownerExec).toBe(true);
}

/**
 * Validate package.json has required scripts for a cloud provider
 */
export function validatePackageJsonScripts(
  baseDir: string,
  cloudProvider: string,
  scriptPrefixes: string[]
): void {
  const packageJsonPath = path.join(baseDir, 'package.json');
  expect(fs.existsSync(packageJsonPath)).toBe(true);
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  for (const prefix of scriptPrefixes) {
    const scriptName = `${cloudProvider}:${prefix}`;
    expect(packageJson.scripts).toHaveProperty(scriptName);
  }
} 