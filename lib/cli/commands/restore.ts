import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { validateCloudEnvironment } from './env-validator';

/**
 * Restore command for the MCP CLI
 * Restores MCP servers from backups
 */
export function restoreCommand(program: Command, isTesting = false): void {
  program
    .command('restore')
    .description('Restore a MCP server from a backup')
    .option('-p, --path <path>', 'Path to the project directory', '.')
    .option('-c, --cloud <provider>', 'Specify cloud provider (aws, gcp, azure, alibaba)')
    .option('-e, --environment <environment>', 'Specify environment (development, staging, production)')
    .option('-b, --backup <backupName>', 'Name of the backup to restore from')
    .option('-l, --latest', 'Use the latest backup')
    .option('--database-only', 'Restore only the database')
    .option('--files-only', 'Restore only the file storage')
    .option('--confirm', 'Skip confirmation prompt')
    .option('--json', 'Output JSON format')
    .action(async (options) => {
      console.log(chalk.bold('\n🔄 Restoring MCP Server from Backup\n'));
      
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
        
        if (isTesting) {
          throw new Error('Not a valid project directory. package.json not found.');
        } else {
          process.exit(1);
        }
      }
      
      // Check for backup information file
      const backupInfoPath = path.join(projectPath, '.mcpm-backups.json');
      if (!fs.existsSync(backupInfoPath)) {
        console.error(chalk.red('❌ No backups found for this project.'));
        console.log(chalk.yellow('Create a backup first using the backup command:'));
        console.log(chalk.yellow('  $ mcpm backup'));
        
        if (options.json) {
          console.log(JSON.stringify({
            success: false,
            error: 'No backups found'
          }));
        }
        
        if (isTesting) {
          throw new Error('No backups found for this project.');
        } else {
          process.exit(1);
        }
      }
      
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const backupInfo = JSON.parse(fs.readFileSync(backupInfoPath, 'utf8'));
        
        if (!Array.isArray(backupInfo) || backupInfo.length === 0) {
          console.error(chalk.red('❌ No valid backups found in the backup information file.'));
          
          if (options.json) {
            console.log(JSON.stringify({
              success: false,
              error: 'No valid backups found'
            }));
          }
          
          if (isTesting) {
            throw new Error('No valid backups found in the backup information file.');
          } else {
            process.exit(1);
          }
        }
        
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
            
            if (isTesting) {
              throw new Error('No cloud provider deployment scripts found in package.json.');
            } else {
              process.exit(1);
            }
          } else if (availableProviders.length === 1) {
            cloudProvider = availableProviders[0];
            console.log(chalk.blue(`Using detected cloud provider: ${cloudProvider}`));
          } else {
            // Ask user to select a cloud provider
            const answer = await inquirer.prompt([
              {
                type: 'list',
                name: 'cloudProvider',
                message: 'Select cloud provider to restore to:',
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
              message: 'Select deployment environment to restore to:',
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
        
        // Filter backups by cloud provider and environment
        let availableBackups = backupInfo.filter(backup => 
          backup.cloudProvider === cloudProvider && 
          backup.environment === environment
        );
        
        if (availableBackups.length === 0) {
          console.error(chalk.red(`❌ No backups found for ${cloudProvider} in ${environment} environment.`));
          
          if (options.json) {
            console.log(JSON.stringify({
              success: false,
              error: `No backups found for ${cloudProvider} in ${environment} environment`
            }));
          }
          
          if (isTesting) {
            throw new Error(`No backups found for ${cloudProvider} in ${environment} environment.`);
          } else {
            process.exit(1);
          }
        }
        
        // Sort backups by timestamp (newest first)
        availableBackups.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        // Select backup to restore from
        let selectedBackup;
        
        if (options.backup) {
          // Find backup by name
          selectedBackup = availableBackups.find(backup => backup.name === options.backup);
          
          if (!selectedBackup) {
            console.error(chalk.red(`❌ Backup "${options.backup}" not found.`));
            
            if (options.json) {
              console.log(JSON.stringify({
                success: false,
                error: `Backup "${options.backup}" not found`
              }));
            }
            
            if (isTesting) {
              throw new Error(`Backup "${options.backup}" not found.`);
            } else {
              process.exit(1);
            }
          }
        } else if (options.latest) {
          // Use the latest backup
          selectedBackup = availableBackups[0];
          console.log(chalk.blue(`Using latest backup: ${selectedBackup.name}`));
        } else {
          // Let the user choose a backup
          const backupChoices = availableBackups.map(backup => ({
            name: `${backup.name} (${new Date(backup.timestamp).toLocaleString()}) - ${backup.description}`,
            value: backup.name
          }));
          
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'backupName',
              message: 'Select a backup to restore from:',
              choices: backupChoices
            }
          ]);
          
          selectedBackup = availableBackups.find(backup => backup.name === answer.backupName);
        }
        
        console.log(chalk.blue(`Selected backup: ${selectedBackup.name}`));
        console.log(chalk.dim(`Description: ${selectedBackup.description}`));
        console.log(chalk.dim(`Created: ${new Date(selectedBackup.timestamp).toLocaleString()}`));
        
        // Get restore options
        const restoreOptions = {
          includeDatabase: options.databaseOnly || (!options.filesOnly && selectedBackup.includeDatabase),
          includeFiles: options.filesOnly || (!options.databaseOnly && selectedBackup.includeFiles),
          backupName: selectedBackup.name,
          description: selectedBackup.description,
          timestamp: selectedBackup.timestamp
        };
        
        // Show restore summary
        console.log(chalk.blue('\nRestore Summary:'));
        console.log(chalk.dim(`Environment: ${environment}`));
        console.log(chalk.dim(`Cloud Provider: ${cloudProvider}`));
        console.log(chalk.dim(`Database: ${restoreOptions.includeDatabase ? 'Yes' : 'No'}`));
        console.log(chalk.dim(`File Storage: ${restoreOptions.includeFiles ? 'Yes' : 'No'}`));
        
        // Confirm restore
        if (!options.confirm) {
          const answer = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: chalk.yellow('⚠️ This will overwrite existing data. Are you sure you want to proceed?'),
              default: false
            }
          ]);
          
          if (!answer.confirm) {
            console.log(chalk.yellow('Restore canceled by user.'));
            
            if (!isTesting) {
              process.exit(0);
            }
            return;
          }
        }
        
        // Perform restore
        const restoreResult = await restoreFromBackup(
          projectPath,
          cloudProvider,
          environment,
          selectedBackup,
          restoreOptions
        );
        
        console.log(chalk.green(`✅ Successfully restored from backup: ${selectedBackup.name}`));
        
        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            backupName: selectedBackup.name,
            timestamp: new Date().toISOString(),
            details: restoreResult
          }));
        }
        
        if (!isTesting) {
          process.exit(0);
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error restoring from backup:'), error);
        
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
 * Restore MCP server from a backup
 */
async function restoreFromBackup(
  projectPath: string,
  cloudProvider: string,
  environment: string,
  backup: any,
  options: {
    includeDatabase: boolean;
    includeFiles: boolean;
    backupName: string;
    description: string;
    timestamp: string;
  }
): Promise<any> {
  console.log(chalk.blue(`Restoring ${cloudProvider} backup for ${environment} environment...`));
  
  try {
    // Check for cloud-specific restore script
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if there's a restore script for this provider
    const restoreScript = `restore:${cloudProvider}`;
    if (packageJson.scripts && packageJson.scripts[restoreScript]) {
      console.log(chalk.blue(`Executing restore script for ${cloudProvider}...`));
      
      // Prepare environment variables for the script
      const env = {
        ...process.env,
        BACKUP_NAME: options.backupName,
        BACKUP_DESCRIPTION: options.description,
        DEPLOY_ENV: environment,
        INCLUDE_DATABASE: options.includeDatabase ? 'true' : 'false',
        INCLUDE_FILES: options.includeFiles ? 'true' : 'false'
      };
      
      // Execute the restore script
      const scriptCmd = `npm run ${restoreScript}`;
      console.log(chalk.dim(`Running: ${scriptCmd}`));
      
      execSync(scriptCmd, { 
        cwd: projectPath,
        stdio: 'inherit',
        env
      });
      
      return { scriptExecuted: restoreScript };
    }
    
    // If no restore script exists, use built-in restore logic
    let restoreResult;
    switch (cloudProvider) {
      case 'aws':
        restoreResult = await restoreAWS(projectPath, environment, backup, options);
        break;
        
      case 'gcp':
        restoreResult = await restoreGCP(projectPath, environment, backup, options);
        break;
        
      case 'azure':
        restoreResult = await restoreAzure(projectPath, environment, backup, options);
        break;
        
      case 'alibaba':
        restoreResult = await restoreAlibaba(projectPath, environment, backup, options);
        break;
        
      default:
        throw new Error(`Unsupported cloud provider: ${cloudProvider}`);
    }
    
    return restoreResult;
  } catch (error: any) {
    throw new Error(`Restore failed: ${error.message}`);
  }
}

/**
 * Restore from AWS backup
 */
async function restoreAWS(
  projectPath: string,
  environment: string,
  backup: any,
  options: {
    includeDatabase: boolean;
    includeFiles: boolean;
    backupName: string;
    description: string;
    timestamp: string;
  }
): Promise<any> {
  console.log(chalk.blue('Executing AWS restore...'));
  
  // Simulate AWS restore command
  // This would be replaced with actual AWS CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Restoring RDS from snapshot...'));
      // Simulate RDS restore
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Restoring S3 bucket data...'));
      // Simulate S3 restore
    }
    
    // Create a record of what was restored
    return {
      provider: 'aws',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles
      },
      timestamp: new Date().toISOString(),
      backupRestored: options.backupName
    };
  } catch (error: any) {
    throw new Error(`AWS restore failed: ${error.message}`);
  }
}

/**
 * Restore from GCP backup
 */
async function restoreGCP(
  projectPath: string,
  environment: string,
  backup: any,
  options: {
    includeDatabase: boolean;
    includeFiles: boolean;
    backupName: string;
    description: string;
    timestamp: string;
  }
): Promise<any> {
  console.log(chalk.blue('Executing GCP restore...'));
  
  // Simulate GCP restore command
  // This would be replaced with actual GCP CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Restoring Cloud SQL from backup...'));
      // Simulate Cloud SQL restore
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Restoring Cloud Storage data...'));
      // Simulate Cloud Storage restore
    }
    
    // Create a record of what was restored
    return {
      provider: 'gcp',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles
      },
      timestamp: new Date().toISOString(),
      backupRestored: options.backupName
    };
  } catch (error: any) {
    throw new Error(`GCP restore failed: ${error.message}`);
  }
}

/**
 * Restore from Azure backup
 */
async function restoreAzure(
  projectPath: string,
  environment: string,
  backup: any,
  options: {
    includeDatabase: boolean;
    includeFiles: boolean;
    backupName: string;
    description: string;
    timestamp: string;
  }
): Promise<any> {
  console.log(chalk.blue('Executing Azure restore...'));
  
  // Simulate Azure restore command
  // This would be replaced with actual Azure CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Restoring Azure SQL from backup...'));
      // Simulate Azure SQL restore
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Restoring Blob Storage data...'));
      // Simulate Blob Storage restore
    }
    
    // Create a record of what was restored
    return {
      provider: 'azure',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles
      },
      timestamp: new Date().toISOString(),
      backupRestored: options.backupName
    };
  } catch (error: any) {
    throw new Error(`Azure restore failed: ${error.message}`);
  }
}

/**
 * Restore from Alibaba backup
 */
async function restoreAlibaba(
  projectPath: string,
  environment: string,
  backup: any,
  options: {
    includeDatabase: boolean;
    includeFiles: boolean;
    backupName: string;
    description: string;
    timestamp: string;
  }
): Promise<any> {
  console.log(chalk.blue('Executing Alibaba Cloud restore...'));
  
  // Simulate Alibaba restore command
  // This would be replaced with actual Alibaba CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Restoring ApsaraDB from backup...'));
      // Simulate ApsaraDB restore
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Restoring OSS data...'));
      // Simulate OSS restore
    }
    
    // Create a record of what was restored
    return {
      provider: 'alibaba',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles
      },
      timestamp: new Date().toISOString(),
      backupRestored: options.backupName
    };
  } catch (error: any) {
    throw new Error(`Alibaba restore failed: ${error.message}`);
  }
} 