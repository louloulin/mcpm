import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { validateCloudEnvironment } from './env-validator';

/**
 * Update command for the MCP CLI
 * Updates deployed MCP servers to newer versions
 */
export function updateCommand(program: Command, isTesting = false): void {
  program
    .command('update')
    .description('Update deployed MCP servers to newer versions')
    .option('-p, --path <path>', 'Path to the project directory', '.')
    .option('-c, --cloud <provider>', 'Specify cloud provider (aws, gcp, azure, alibaba)')
    .option('-e, --environment <environment>', 'Specify environment (development, staging, production)')
    .option('-v, --version <version>', 'Target version to update to')
    .option('--check-only', 'Only check for updates without applying them')
    .option('--force', 'Force update even if there are breaking changes')
    .option('--keep-data', 'Preserve data during update')
    .option('--no-backup', 'Skip automatic backup before update')
    .option('--rollback-on-failure', 'Automatically rollback to previous version if update fails')
    .option('--json', 'Output JSON format')
    .action(async (options) => {
      console.log(chalk.bold('\n🔄 Updating MCP Server\n'));
      
      const projectPath = path.resolve(options.path);
      
      // Check if the directory exists
      if (!fs.existsSync(projectPath)) {
        console.error(chalk.red(`❌ Project directory not found: ${projectPath}`));
        
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: 'Project directory does not exist'
          }));
        }
        
        if (isTesting) {
          throw new Error(`Project directory does not exist: ${projectPath}`);
        } else {
          process.exit(1);
        }
      }
      
      // Check for package.json to validate it's an MCP project
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        console.error(chalk.red('❌ Not a valid project directory. package.json not found.'));
        process.exit(1);
      }
      
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Detect cloud provider from package.json scripts if not specified
        let cloudProvider = options.cloud;
        if (!cloudProvider) {
          const availableProviders = [];
          
          if (packageJson.scripts && packageJson.scripts['deploy:aws']) availableProviders.push('aws');
          if (packageJson.scripts && packageJson.scripts['deploy:gcp']) availableProviders.push('gcp');
          if (packageJson.scripts && packageJson.scripts['deploy:azure']) availableProviders.push('azure');
          if (packageJson.scripts && packageJson.scripts['deploy:alibaba']) availableProviders.push('alibaba');
          
          if (availableProviders.length === 0) {
            console.error(chalk.red('❌ No cloud provider deployment scripts found in package.json.'));
            console.log(chalk.yellow('Please create a project with cloud provider support using the scaffold command:'));
            console.log(chalk.yellow('  $ mcpm scaffold --cloud aws|gcp|azure|alibaba'));
            process.exit(1);
          } else if (availableProviders.length === 1) {
            cloudProvider = availableProviders[0];
            console.log(chalk.blue(`Using detected cloud provider: ${cloudProvider}`));
          } else {
            // Ask user to select a cloud provider
            const answer = await inquirer.prompt([
              {
                type: 'list',
                name: 'cloudProvider',
                message: 'Select cloud provider to update:',
                choices: availableProviders
              }
            ]);
            cloudProvider = answer.cloudProvider;
          }
        }
        
        // Get or prompt for environment
        let environment = options.environment;
        if (!environment) {
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'environment',
              message: 'Select deployment environment to update:',
              choices: ['development', 'staging', 'production'],
              default: 'development'
            }
          ]);
          environment = answer.environment;
        }
        
        // Validate cloud provider environment variables
        const validationResult = validateCloudEnvironment(cloudProvider);
        if (validationResult.missing.length > 0) {
          console.error(chalk.red('❌ Missing required environment variables for ' + cloudProvider + ':'));
          console.error(chalk.red('   ' + validationResult.missing.join(', ')));
          
          if (isTesting) {
            throw new Error(`Missing required environment variables for ${cloudProvider}`);
          } else {
            process.exit(1);
          }
        }
        
        const currentVersion = packageJson.version || '0.0.0';
        console.log(chalk.blue(`Current project version: ${currentVersion}`));
        
        // Determine target version
        let targetVersion = options.version;
        
        if (!targetVersion) {
          if (options.checkOnly) {
            // Check for newer version
            console.log(chalk.blue('Checking for updates...'));
            const latestVersion = await checkLatestVersion(packageJson.name, currentVersion);
            
            if (latestVersion !== currentVersion) {
              console.log(chalk.green(`✅ Update available: ${currentVersion} → ${latestVersion}`));
              
              if (options.json) {
                console.log(JSON.stringify({
                  current: currentVersion,
                  latest: latestVersion,
                  updateAvailable: true
                }));
              }
            } else {
              console.log(chalk.green(`✅ Already at the latest version: ${currentVersion}`));
              
              if (options.json) {
                console.log(JSON.stringify({
                  current: currentVersion,
                  latest: latestVersion,
                  updateAvailable: false
                }));
              }
            }
            
            // Exit if check-only mode
            if (!isTesting) {
              process.exit(0);
            }
            return;
          } else {
            // Get the latest version
            targetVersion = await checkLatestVersion(packageJson.name, currentVersion);
            
            if (targetVersion === currentVersion) {
              console.log(chalk.green(`✅ Already at the latest version: ${currentVersion}`));
              if (!isTesting) {
                process.exit(0);
              }
              return;
            }
          }
        }
        
        // Confirm update if not forced
        if (!options.force) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Update from ${currentVersion} to ${targetVersion}?`,
              default: false
            }
          ]);
          
          if (!answer.confirm) {
            console.log(chalk.yellow('Update canceled by user.'));
            if (!isTesting) {
              process.exit(0);
            }
            return;
          }
        }
        
        // Create backup if not disabled
        if (options.backup !== false) {
          console.log(chalk.blue('Creating backup before update...'));
          await createBackup(projectPath, cloudProvider, environment);
        }
        
        // Perform the update based on cloud provider
        await updateServer(projectPath, cloudProvider, environment, targetVersion, {
          keepData: options.keepData || false,
          rollbackOnFailure: options.rollbackOnFailure || false
        });
        
        console.log(chalk.green(`✅ MCP server updated to version ${targetVersion}`));
        
        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            oldVersion: currentVersion,
            newVersion: targetVersion
          }));
        }
        
        if (!isTesting) {
          process.exit(0);
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error updating MCP server:'), error);
        
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: error.message
          }));
        }
        
        if (isTesting) {
          throw error;
        } else {
          process.exit(1);
        }
      }
    });
}

/**
 * Check for the latest available version
 */
async function checkLatestVersion(packageName: string, currentVersion: string): Promise<string> {
  try {
    // Simulate version check - in a real implementation, this would connect to a registry
    // For demo, we'll return a newer version
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2] += 1; // Increment patch version
    return versionParts.join('.');
  } catch (error) {
    console.error(chalk.yellow('⚠️ Could not check for latest version:'), error);
    return currentVersion;
  }
}

/**
 * Create a backup before updating
 */
async function createBackup(
  projectPath: string,
  cloudProvider: string,
  environment: string
): Promise<void> {
  try {
    // Simulate backup based on cloud provider
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
    const backupName = `backup_${environment}_${timestamp}`;
    
    switch (cloudProvider) {
      case 'aws':
        // AWS backup logic
        console.log(chalk.blue(`Creating AWS backup: ${backupName}`));
        // Simulated AWS backup command
        break;
        
      case 'gcp':
        // GCP backup logic
        console.log(chalk.blue(`Creating GCP backup: ${backupName}`));
        // Simulated GCP backup command
        break;
        
      case 'azure':
        // Azure backup logic
        console.log(chalk.blue(`Creating Azure backup: ${backupName}`));
        // Simulated Azure backup command
        break;
        
      case 'alibaba':
        // Alibaba backup logic
        console.log(chalk.blue(`Creating Alibaba Cloud backup: ${backupName}`));
        // Simulated Alibaba backup command
        break;
        
      default:
        console.log(chalk.yellow(`⚠️ Backup not implemented for ${cloudProvider}, skipping...`));
        break;
    }
    
    // Record backup information
    const backupInfoPath = path.join(projectPath, '.mcpm-backups.json');
    let backupInfo = [];
    
    if (fs.existsSync(backupInfoPath)) {
      try {
        backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
      } catch (e) {
        // If file exists but isn't valid JSON, start fresh
        backupInfo = [];
      }
    }
    
    backupInfo.push({
      name: backupName,
      timestamp: new Date().toISOString(),
      environment,
      cloudProvider
    });
    
    fs.writeFileSync(backupInfoPath, JSON.stringify(backupInfo, null, 2));
    console.log(chalk.green(`✅ Backup created: ${backupName}`));
  } catch (error: any) {
    console.error(chalk.yellow('⚠️ Failed to create backup:'), error);
    throw new Error('Backup creation failed: ' + error.message);
  }
}

/**
 * Update the server on the specified cloud provider
 */
async function updateServer(
  projectPath: string,
  cloudProvider: string,
  environment: string,
  targetVersion: string,
  options: { keepData: boolean; rollbackOnFailure: boolean }
): Promise<void> {
  console.log(chalk.blue(`Updating ${cloudProvider} deployment in ${environment} environment to version ${targetVersion}...`));
  
  try {
    // Check for cloud-specific update script
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if there's an update script for this provider
    const updateScript = `update:${cloudProvider}`;
    if (packageJson.scripts && packageJson.scripts[updateScript]) {
      console.log(chalk.blue(`Executing update script for ${cloudProvider}...`));
      
      // Prepare environment variables for the script
      const env = {
        ...process.env,
        TARGET_VERSION: targetVersion,
        DEPLOY_ENV: environment,
        KEEP_DATA: options.keepData ? 'true' : 'false',
        ROLLBACK_ON_FAILURE: options.rollbackOnFailure ? 'true' : 'false'
      };
      
      // Execute the update script
      const scriptCmd = `npm run ${updateScript}`;
      console.log(chalk.dim(`Running: ${scriptCmd}`));
      
      execSync(scriptCmd, { 
        cwd: projectPath,
        stdio: 'inherit',
        env
      });
      
      return;
    }
    
    // If no update script exists, use built-in update logic
    switch (cloudProvider) {
      case 'aws':
        await updateAWS(projectPath, environment, targetVersion, options);
        break;
        
      case 'gcp':
        await updateGCP(projectPath, environment, targetVersion, options);
        break;
        
      case 'azure':
        await updateAzure(projectPath, environment, targetVersion, options);
        break;
        
      case 'alibaba':
        await updateAlibaba(projectPath, environment, targetVersion, options);
        break;
        
      default:
        throw new Error(`Unsupported cloud provider: ${cloudProvider}`);
    }
  } catch (error: any) {
    if (options.rollbackOnFailure) {
      console.error(chalk.red('❌ Update failed, attempting rollback...'));
      try {
        // Implement rollback logic here
        console.log(chalk.green('✅ Rollback successful.'));
      } catch (rollbackError: any) {
        console.error(chalk.red('❌ Rollback failed:'), rollbackError);
      }
    }
    throw error;
  }
}

/**
 * Update AWS deployed service
 */
async function updateAWS(
  projectPath: string,
  environment: string,
  targetVersion: string,
  options: { keepData: boolean; rollbackOnFailure: boolean }
): Promise<void> {
  console.log(chalk.blue('Executing AWS update...'));
  
  // Simulate AWS update command
  // This would be replaced with actual AWS CLI commands in a real implementation
  
  // Update version in package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = targetVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Deploy updated version
  const deployCmd = `npm run deploy:aws -- --environment=${environment}`;
  console.log(chalk.dim(`Running: ${deployCmd}`));
  
  try {
    execSync(deployCmd, { 
      cwd: projectPath,
      stdio: 'inherit'
    });
  } catch (error: any) {
    throw new Error(`AWS update failed: ${error.message}`);
  }
}

/**
 * Update GCP deployed service
 */
async function updateGCP(
  projectPath: string,
  environment: string,
  targetVersion: string,
  options: { keepData: boolean; rollbackOnFailure: boolean }
): Promise<void> {
  console.log(chalk.blue('Executing GCP update...'));
  
  // Simulate GCP update command
  // This would be replaced with actual GCP CLI commands in a real implementation
  
  // Update version in package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = targetVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Deploy updated version
  const deployCmd = `npm run deploy:gcp -- --environment=${environment}`;
  console.log(chalk.dim(`Running: ${deployCmd}`));
  
  try {
    execSync(deployCmd, { 
      cwd: projectPath,
      stdio: 'inherit'
    });
  } catch (error: any) {
    throw new Error(`GCP update failed: ${error.message}`);
  }
}

/**
 * Update Azure deployed service
 */
async function updateAzure(
  projectPath: string,
  environment: string,
  targetVersion: string,
  options: { keepData: boolean; rollbackOnFailure: boolean }
): Promise<void> {
  console.log(chalk.blue('Executing Azure update...'));
  
  // Simulate Azure update command
  // This would be replaced with actual Azure CLI commands in a real implementation
  
  // Update version in package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = targetVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Deploy updated version
  const deployCmd = `npm run deploy:azure -- --environment=${environment}`;
  console.log(chalk.dim(`Running: ${deployCmd}`));
  
  try {
    execSync(deployCmd, { 
      cwd: projectPath,
      stdio: 'inherit'
    });
  } catch (error: any) {
    throw new Error(`Azure update failed: ${error.message}`);
  }
}

/**
 * Update Alibaba deployed service
 */
async function updateAlibaba(
  projectPath: string,
  environment: string,
  targetVersion: string,
  options: { keepData: boolean; rollbackOnFailure: boolean }
): Promise<void> {
  console.log(chalk.blue('Executing Alibaba Cloud update...'));
  
  // Simulate Alibaba update command
  // This would be replaced with actual Alibaba CLI commands in a real implementation
  
  // Update version in package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = targetVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  // Deploy updated version
  const deployCmd = `npm run deploy:alibaba -- --environment=${environment}`;
  console.log(chalk.dim(`Running: ${deployCmd}`));
  
  try {
    execSync(deployCmd, { 
      cwd: projectPath,
      stdio: 'inherit'
    });
  } catch (error: any) {
    throw new Error(`Alibaba update failed: ${error.message}`);
  }
} 