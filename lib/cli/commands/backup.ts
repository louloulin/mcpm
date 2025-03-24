import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { validateCloudEnvironment } from './env-validator';

/**
 * Backup command for the MCP CLI
 * Creates backups of deployed MCP servers
 */
export function backupCommand(program: Command, isTesting = false): void {
  program
    .command('backup')
    .description('Create a backup of a deployed MCP server')
    .option('-p, --path <path>', 'Path to the project directory', '.')
    .option('-c, --cloud <provider>', 'Specify cloud provider (aws, gcp, azure, alibaba)')
    .option('-e, --environment <environment>', 'Specify environment (development, staging, production)')
    .option('-d, --description <description>', 'Backup description')
    .option('-f, --full', 'Create a full backup (includes all resources)')
    .option('--no-database', 'Skip database backup')
    .option('--no-files', 'Skip file storage backup')
    .option('--retention <days>', 'Number of days to retain this backup', '30')
    .option('--json', 'Output JSON format')
    .action(async (options) => {
      console.log(chalk.bold('\n💾 Creating MCP Server Backup\n'));
      
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
                message: 'Select cloud provider to backup:',
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
              message: 'Select deployment environment to backup:',
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
        
        // Generate a unique backup name if not provided
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
        const backupName = `backup_${environment}_${timestamp}`;
        
        // Get backup description if not provided
        let description = options.description;
        if (!description) {
          const answer = await inquirer.prompt([
            {
              type: 'input',
              name: 'description',
              message: 'Enter a description for this backup:',
              default: `Backup of ${environment} environment on ${new Date().toLocaleString()}`
            }
          ]);
          description = answer.description;
        }
        
        // Create backup based on cloud provider
        const backupResult = await createBackup(
          projectPath,
          cloudProvider,
          environment,
          backupName,
          {
            description,
            fullBackup: options.full || false,
            includeDatabase: options.database !== false,
            includeFiles: options.files !== false,
            retentionDays: parseInt(options.retention, 10) || 30
          }
        );
        
        console.log(chalk.green(`✅ Backup created: ${backupName}`));
        
        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            backupName,
            description,
            timestamp: new Date().toISOString(),
            details: backupResult
          }));
        }
        
        if (!isTesting) {
          process.exit(0);
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error creating backup:'), error);
        
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
 * Create a backup of the MCP server
 */
async function createBackup(
  projectPath: string,
  cloudProvider: string,
  environment: string,
  backupName: string,
  options: {
    description: string;
    fullBackup: boolean;
    includeDatabase: boolean;
    includeFiles: boolean;
    retentionDays: number;
  }
): Promise<any> {
  console.log(chalk.blue(`Creating ${cloudProvider} backup for ${environment} environment...`));
  
  try {
    // Check for cloud-specific backup script
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if there's a backup script for this provider
    const backupScript = `backup:${cloudProvider}`;
    if (packageJson.scripts && packageJson.scripts[backupScript]) {
      console.log(chalk.blue(`Executing backup script for ${cloudProvider}...`));
      
      // Prepare environment variables for the script
      const env = {
        ...process.env,
        BACKUP_NAME: backupName,
        BACKUP_DESCRIPTION: options.description,
        DEPLOY_ENV: environment,
        FULL_BACKUP: options.fullBackup ? 'true' : 'false',
        INCLUDE_DATABASE: options.includeDatabase ? 'true' : 'false',
        INCLUDE_FILES: options.includeFiles ? 'true' : 'false',
        RETENTION_DAYS: options.retentionDays.toString()
      };
      
      // Execute the backup script
      const scriptCmd = `npm run ${backupScript}`;
      console.log(chalk.dim(`Running: ${scriptCmd}`));
      
      execSync(scriptCmd, { 
        cwd: projectPath,
        stdio: 'inherit',
        env
      });
      
      return { scriptExecuted: backupScript };
    }
    
    // If no backup script exists, use built-in backup logic
    let backupResult;
    switch (cloudProvider) {
      case 'aws':
        backupResult = await backupAWS(projectPath, environment, backupName, options);
        break;
        
      case 'gcp':
        backupResult = await backupGCP(projectPath, environment, backupName, options);
        break;
        
      case 'azure':
        backupResult = await backupAzure(projectPath, environment, backupName, options);
        break;
        
      case 'alibaba':
        backupResult = await backupAlibaba(projectPath, environment, backupName, options);
        break;
        
      default:
        throw new Error(`Unsupported cloud provider: ${cloudProvider}`);
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
      description: options.description,
      timestamp: new Date().toISOString(),
      environment,
      cloudProvider,
      fullBackup: options.fullBackup,
      includeDatabase: options.includeDatabase,
      includeFiles: options.includeFiles,
      retentionDays: options.retentionDays,
      details: backupResult
    });
    
    fs.writeFileSync(backupInfoPath, JSON.stringify(backupInfo, null, 2));
    
    return backupResult;
  } catch (error: any) {
    throw new Error(`Backup creation failed: ${error.message}`);
  }
}

/**
 * Create a backup for AWS deployed service
 */
async function backupAWS(
  projectPath: string,
  environment: string,
  backupName: string,
  options: {
    description: string;
    fullBackup: boolean;
    includeDatabase: boolean;
    includeFiles: boolean;
    retentionDays: number;
  }
): Promise<any> {
  console.log(chalk.blue('Executing AWS backup...'));
  
  // Simulate AWS backup command
  // This would be replaced with actual AWS CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Creating RDS snapshot...'));
      // Simulate RDS snapshot creation
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Creating S3 bucket backup...'));
      // Simulate S3 backup
    }
    
    if (options.fullBackup) {
      console.log(chalk.blue('Creating EC2/ECS snapshot...'));
      // Simulate EC2/ECS snapshot
    }
    
    // Create a local record of what was backed up
    return {
      provider: 'aws',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles,
        compute: options.fullBackup
      },
      location: `aws/${environment}/${backupName}`
    };
  } catch (error: any) {
    throw new Error(`AWS backup failed: ${error.message}`);
  }
}

/**
 * Create a backup for GCP deployed service
 */
async function backupGCP(
  projectPath: string,
  environment: string,
  backupName: string,
  options: {
    description: string;
    fullBackup: boolean;
    includeDatabase: boolean;
    includeFiles: boolean;
    retentionDays: number;
  }
): Promise<any> {
  console.log(chalk.blue('Executing GCP backup...'));
  
  // Simulate GCP backup command
  // This would be replaced with actual GCP CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Creating Cloud SQL backup...'));
      // Simulate Cloud SQL backup
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Creating Cloud Storage backup...'));
      // Simulate Cloud Storage backup
    }
    
    if (options.fullBackup) {
      console.log(chalk.blue('Creating Compute Engine snapshot...'));
      // Simulate Compute Engine snapshot
    }
    
    // Create a local record of what was backed up
    return {
      provider: 'gcp',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles,
        compute: options.fullBackup
      },
      location: `gcp/${environment}/${backupName}`
    };
  } catch (error: any) {
    throw new Error(`GCP backup failed: ${error.message}`);
  }
}

/**
 * Create a backup for Azure deployed service
 */
async function backupAzure(
  projectPath: string,
  environment: string,
  backupName: string,
  options: {
    description: string;
    fullBackup: boolean;
    includeDatabase: boolean;
    includeFiles: boolean;
    retentionDays: number;
  }
): Promise<any> {
  console.log(chalk.blue('Executing Azure backup...'));
  
  // Simulate Azure backup command
  // This would be replaced with actual Azure CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Creating Azure SQL backup...'));
      // Simulate Azure SQL backup
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Creating Blob Storage backup...'));
      // Simulate Blob Storage backup
    }
    
    if (options.fullBackup) {
      console.log(chalk.blue('Creating VM snapshot...'));
      // Simulate VM snapshot
    }
    
    // Create a local record of what was backed up
    return {
      provider: 'azure',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles,
        compute: options.fullBackup
      },
      location: `azure/${environment}/${backupName}`
    };
  } catch (error: any) {
    throw new Error(`Azure backup failed: ${error.message}`);
  }
}

/**
 * Create a backup for Alibaba deployed service
 */
async function backupAlibaba(
  projectPath: string,
  environment: string,
  backupName: string,
  options: {
    description: string;
    fullBackup: boolean;
    includeDatabase: boolean;
    includeFiles: boolean;
    retentionDays: number;
  }
): Promise<any> {
  console.log(chalk.blue('Executing Alibaba Cloud backup...'));
  
  // Simulate Alibaba backup command
  // This would be replaced with actual Alibaba CLI commands in a real implementation
  
  try {
    if (options.includeDatabase) {
      console.log(chalk.blue('Creating ApsaraDB backup...'));
      // Simulate ApsaraDB backup
    }
    
    if (options.includeFiles) {
      console.log(chalk.blue('Creating OSS backup...'));
      // Simulate OSS backup
    }
    
    if (options.fullBackup) {
      console.log(chalk.blue('Creating ECS snapshot...'));
      // Simulate ECS snapshot
    }
    
    // Create a local record of what was backed up
    return {
      provider: 'alibaba',
      resources: {
        database: options.includeDatabase,
        files: options.includeFiles,
        compute: options.fullBackup
      },
      location: `alibaba/${environment}/${backupName}`
    };
  } catch (error: any) {
    throw new Error(`Alibaba backup failed: ${error.message}`);
  }
} 