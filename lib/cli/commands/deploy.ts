import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  validateCloudEnvironment,
  getSetupInstructions
} from './env-validator';

/**
 * Deploy command for the MCP CLI
 * Allows deploying the MCP server to different cloud providers
 */
export function deployCommand(program: Command): void {
  program
    .command('deploy')
    .description('Deploy the MCP server to a cloud provider')
    .option('-c, --cloud <provider>', 'Specify cloud provider (aws, gcp, azure, alibaba)')
    .option('-e, --environment <environment>', 'Specify environment (development, staging, production)')
    .option('-p, --path <path>', 'Path to the project directory', '.')
    .action(async (options) => {
      console.log(chalk.bold('\n🚀 Deploying MCP Server\n'));
      
      const projectPath = path.resolve(options.path);
      
      // Check if the directory exists
      if (!fs.existsSync(projectPath)) {
        console.error(chalk.red(`❌ Project directory not found: ${projectPath}`));
        process.exit(1);
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
                message: 'Select cloud provider to deploy to:',
                choices: availableProviders
              }
            ]);
            cloudProvider = answer.cloudProvider;
          }
        }
        
        // Validate environment variables
        const validationResult = validateCloudEnvironment(cloudProvider);
        if (!validationResult.valid) {
          console.error(chalk.red('❌ Missing environment variables for deployment:'));
          console.log(chalk.yellow(getSetupInstructions(cloudProvider, validationResult.missing)));
          process.exit(1);
        }
        
        // Get or prompt for environment
        let environment = options.environment;
        if (!environment) {
          const answer = await inquirer.prompt([
            {
              type: 'list',
              name: 'environment',
              message: 'Select deployment environment:',
              choices: ['development', 'staging', 'production'],
              default: 'development'
            }
          ]);
          environment = answer.environment;
        }
        
        console.log(chalk.green(`Deploying to ${cloudProvider} in ${environment} environment...`));
        
        // Execute the deployment script
        const deployScript = `deploy:${cloudProvider}`;
        if (!packageJson.scripts || !packageJson.scripts[deployScript]) {
          console.error(chalk.red(`❌ Deployment script '${deployScript}' not found in package.json`));
          process.exit(1);
        }
        
        try {
          console.log(chalk.blue('Executing deployment script...'));
          // Pass environment as an environment variable to the script
          execSync(`DEPLOY_ENV=${environment} npm run ${deployScript}`, { 
            cwd: projectPath,
            stdio: 'inherit'
          });
          console.log(chalk.green('✅ Deployment completed successfully!'));
        } catch (error) {
          console.error(chalk.red('❌ Deployment failed:'), error);
          process.exit(1);
        }
        
      } catch (error) {
        console.error(chalk.red('❌ Error reading package.json:'), error);
        process.exit(1);
      }
    });
} 