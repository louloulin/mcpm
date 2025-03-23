import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

interface ServerResources {
  cpu?: string;
  memory?: string;
  storage?: string;
  sku?: string;
}

interface ServerStatus {
  name: string;
  version: string;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  uptime?: string;
  lastDeployed?: Date;
  url?: string;
  cloudProvider?: string;
  environment?: string;
  resources?: ServerResources;
}

/**
 * Status command for the MCP CLI
 * Checks the status of deployed MCP servers
 */
export function statusCommand(program: Command): void {
  program
    .command('status')
    .description('Check the status of deployed MCP servers')
    .option('-p, --path <path>', 'Path to the project directory', '.')
    .option('-c, --cloud <provider>', 'Specify cloud provider (aws, gcp, azure, alibaba)')
    .option('-e, --environment <environment>', 'Specify environment (development, staging, production)')
    .option('-u, --url <url>', 'Server URL to check directly')
    .option('--json', 'Output status as JSON')
    .action(async (options) => {
      console.log(chalk.bold('\n🔍 Checking MCP Server Status\n'));
      
      // If a URL is provided, check it directly
      if (options.url) {
        await checkServerByUrl(options.url, options.json);
        return;
      }
      
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
                message: 'Select cloud provider to check:',
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
              message: 'Select deployment environment:',
              choices: ['development', 'staging', 'production'],
              default: 'development'
            }
          ]);
          environment = answer.environment;
        }
        
        // Check if there's a status check script for this provider
        const statusScript = `status:${cloudProvider}`;
        if (packageJson.scripts && packageJson.scripts[statusScript]) {
          console.log(chalk.blue(`Executing status check script for ${cloudProvider}...`));
          
          try {
            // Execute the status check script
            const output = execSync(`DEPLOY_ENV=${environment} npm run ${statusScript}`, { 
              cwd: projectPath,
              encoding: 'utf8'
            });
            
            // Parse the output if it's valid JSON
            try {
              const status = JSON.parse(output);
              displayStatus(status, options.json);
            } catch (jsonError) {
              // If output is not valid JSON, just display it as is
              console.log(output);
            }
          } catch (error) {
            console.error(chalk.red('❌ Status check failed:'), error);
            process.exit(1);
          }
        } else {
          // No status script found, try to determine status based on cloud provider
          const status = await determineServerStatus(projectPath, cloudProvider, environment);
          displayStatus(status, options.json);
        }
        
      } catch (error) {
        console.error(chalk.red('❌ Error reading package.json:'), error);
        process.exit(1);
      }
    });
}

/**
 * Check a server's status by URL
 * @param url The server URL to check
 * @param asJson Whether to output as JSON
 */
async function checkServerByUrl(url: string, asJson: boolean): Promise<void> {
  try {
    console.log(chalk.blue(`Checking server at: ${url}`));
    
    // Try to access the health endpoint
    const healthUrl = url.endsWith('/') ? `${url}health` : `${url}/health`;
    const response = await axios.get(healthUrl, { timeout: 5000 });
    
    const status: ServerStatus = {
      name: 'Remote MCP Server',
      version: response.data.version || 'unknown',
      status: response.data.status || (response.status === 200 ? 'online' : 'degraded'),
      url: url
    };
    
    // Add any additional information from the response
    if (response.data.uptime) status.uptime = response.data.uptime;
    if (response.data.lastDeployed) status.lastDeployed = new Date(response.data.lastDeployed);
    if (response.data.environment) status.environment = response.data.environment;
    if (response.data.resources) status.resources = response.data.resources;
    
    displayStatus(status, asJson);
  } catch (error) {
    const status: ServerStatus = {
      name: 'Remote MCP Server',
      version: 'unknown',
      status: 'offline',
      url: url
    };
    
    displayStatus(status, asJson);
  }
}

/**
 * Determine server status based on cloud provider and environment
 * @param projectPath Path to the project directory
 * @param cloudProvider Cloud provider (aws, gcp, azure, alibaba)
 * @param environment Deployment environment
 * @returns Server status information
 */
async function determineServerStatus(
  projectPath: string, 
  cloudProvider: string, 
  environment: string
): Promise<ServerStatus> {
  console.log(chalk.blue(`Checking status for ${cloudProvider} deployment in ${environment} environment...`));
  
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const status: ServerStatus = {
    name: packageJson.name || 'MCP Server',
    version: packageJson.version || 'unknown',
    status: 'unknown',
    cloudProvider,
    environment
  };
  
  try {
    // Different status check logic based on cloud provider
    switch (cloudProvider) {
      case 'aws':
        return await checkAWSStatus(projectPath, environment, status);
      case 'gcp':
        return await checkGCPStatus(projectPath, environment, status);
      case 'azure':
        return await checkAzureStatus(projectPath, environment, status);
      case 'alibaba':
        return await checkAlibabaStatus(projectPath, environment, status);
      default:
        return status;
    }
  } catch (error: unknown) {
    console.error(chalk.yellow(`Warning: Could not determine detailed status: ${error instanceof Error ? error.message : String(error)}`));
    return status;
  }
}

/**
 * Check status of AWS deployed server
 */
async function checkAWSStatus(
  projectPath: string, 
  environment: string, 
  baseStatus: ServerStatus
): Promise<ServerStatus> {
  try {
    // Try to read AWS config
    const awsConfigPath = path.join(projectPath, 'aws');
    if (!fs.existsSync(awsConfigPath)) {
      return { ...baseStatus };
    }
    
    // Execute AWS CLI to check CloudFormation stack status
    const stackName = `${baseStatus.name}-${environment}`;
    const output = execSync(`aws cloudformation describe-stacks --stack-name ${stackName}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    try {
      const awsData = JSON.parse(output);
      if (awsData.Stacks && awsData.Stacks[0]) {
        const stack = awsData.Stacks[0];
        
        // Determine status based on stack status
        if (stack.StackStatus.includes('COMPLETE') && !stack.StackStatus.includes('DELETE')) {
          baseStatus.status = 'online';
        } else if (stack.StackStatus.includes('PROGRESS')) {
          baseStatus.status = 'degraded';
        } else {
          baseStatus.status = 'offline';
        }
        
        // Extract API Gateway URL from outputs if available
        if (stack.Outputs) {
          const apiUrlOutput = stack.Outputs.find((o: any) => o.OutputKey.includes('ApiUrl') || o.OutputKey.includes('Endpoint'));
          if (apiUrlOutput) {
            baseStatus.url = apiUrlOutput.OutputValue;
          }
        }
        
        baseStatus.lastDeployed = new Date(stack.LastUpdatedTime || stack.CreationTime);
      }
    } catch (error: unknown) {
      // In case of parsing error, return base status
      console.error(chalk.yellow(`Warning: Error parsing AWS response: ${error instanceof Error ? error.message : String(error)}`));
    }
    
    return baseStatus;
  } catch (error: unknown) {
    // In case AWS CLI fails, return unknown status
    console.error(chalk.yellow(`Warning: AWS CLI error: ${error instanceof Error ? error.message : String(error)}`));
    return baseStatus;
  }
}

/**
 * Check status of GCP deployed server
 */
async function checkGCPStatus(
  projectPath: string, 
  environment: string, 
  baseStatus: ServerStatus
): Promise<ServerStatus> {
  try {
    // Try to read GCP config
    const gcpConfigPath = path.join(projectPath, 'gcp');
    if (!fs.existsSync(gcpConfigPath)) {
      return { ...baseStatus };
    }
    
    // Execute Google Cloud CLI to check Cloud Run service status
    const serviceName = `${baseStatus.name}-${environment}`;
    const output = execSync(`gcloud run services describe ${serviceName} --format=json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    try {
      const gcpData = JSON.parse(output);
      
      if (gcpData.status) {
        if (gcpData.status.conditions.some((c: any) => c.type === 'Ready' && c.status === 'True')) {
          baseStatus.status = 'online';
        } else if (gcpData.status.conditions.some((c: any) => c.type === 'Ready' && c.status === 'Unknown')) {
          baseStatus.status = 'degraded';
        } else {
          baseStatus.status = 'offline';
        }
      }
      
      if (gcpData.status && gcpData.status.url) {
        baseStatus.url = gcpData.status.url;
      }
      
      if (gcpData.status && gcpData.status.latestCreatedRevisionName) {
        // Extract revision timestamp
        const revisionTimestamp = gcpData.status.latestCreatedRevisionName.split('-').pop();
        if (revisionTimestamp) {
          baseStatus.lastDeployed = new Date(parseInt(revisionTimestamp, 10));
        }
      }
      
      // Extract resource information if available
      if (gcpData.spec && gcpData.spec.template && gcpData.spec.template.containers) {
        const container = gcpData.spec.template.containers[0];
        if (container.resources) {
          baseStatus.resources = {
            cpu: container.resources.limits?.cpu,
            memory: container.resources.limits?.memory
          };
        }
      }
    } catch (error: unknown) {
      console.error(chalk.yellow(`Warning: Error parsing GCP response: ${error instanceof Error ? error.message : String(error)}`));
    }
    
    return baseStatus;
  } catch (error: unknown) {
    console.error(chalk.yellow(`Warning: GCP CLI error: ${error instanceof Error ? error.message : String(error)}`));
    return baseStatus;
  }
}

/**
 * Check status of Azure deployed server
 */
async function checkAzureStatus(
  projectPath: string, 
  environment: string, 
  baseStatus: ServerStatus
): Promise<ServerStatus> {
  try {
    // Try to read Azure config
    const azureConfigPath = path.join(projectPath, 'azure');
    if (!fs.existsSync(azureConfigPath)) {
      return { ...baseStatus };
    }
    
    // Execute Azure CLI to check App Service status
    const appName = `${baseStatus.name}-${environment}`;
    const output = execSync(`az webapp show --name ${appName} --query "{name: name, state: state, lastModifiedTime: lastModifiedTimeUtc, defaultHostName: defaultHostName, resourceGroup: resourceGroup}" --output json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    try {
      const azureData = JSON.parse(output);
      
      if (azureData.state === 'Running') {
        baseStatus.status = 'online';
      } else if (azureData.state === 'Starting' || azureData.state === 'Stopped') {
        baseStatus.status = 'degraded';
      } else {
        baseStatus.status = 'offline';
      }
      
      if (azureData.defaultHostName) {
        baseStatus.url = `https://${azureData.defaultHostName}`;
      }
      
      if (azureData.lastModifiedTime) {
        baseStatus.lastDeployed = new Date(azureData.lastModifiedTime);
      }
      
      // Get resource information
      try {
        const resourceOutput = execSync(`az webapp show --name ${appName} --resource-group ${azureData.resourceGroup} --query "{sku: sku.name, ftpState: ftpState, httpsOnly: httpsOnly}" --output json`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        });
        
        const resourceData = JSON.parse(resourceOutput);
        baseStatus.resources = {
          ...baseStatus.resources,
          sku: resourceData.sku
        };
      } catch (resourceError) {
        // Ignore resource fetching errors
      }
    } catch (error: unknown) {
      console.error(chalk.yellow(`Warning: Error parsing Azure response: ${error instanceof Error ? error.message : String(error)}`));
    }
    
    return baseStatus;
  } catch (error: unknown) {
    console.error(chalk.yellow(`Warning: Azure CLI error: ${error instanceof Error ? error.message : String(error)}`));
    return baseStatus;
  }
}

/**
 * Check status of Alibaba deployed server
 */
async function checkAlibabaStatus(
  projectPath: string, 
  environment: string, 
  baseStatus: ServerStatus
): Promise<ServerStatus> {
  try {
    // Try to read Alibaba config
    const alibabaConfigPath = path.join(projectPath, 'alibaba');
    if (!fs.existsSync(alibabaConfigPath)) {
      return { ...baseStatus };
    }
    
    // For Alibaba Cloud, we can't easily check with CLI
    // Fallback to checking environment file for endpoints
    const envFilePath = path.join(projectPath, `.env.${environment}`);
    if (fs.existsSync(envFilePath)) {
      const envContent = fs.readFileSync(envFilePath, 'utf8');
      const apiUrlMatch = envContent.match(/API_URL=(.+)/);
      if (apiUrlMatch && apiUrlMatch[1]) {
        baseStatus.url = apiUrlMatch[1];
        
        // Try to ping the URL to check if it's online
        try {
          await axios.get(baseStatus.url, { timeout: 5000 });
          baseStatus.status = 'online';
        } catch (pingError) {
          baseStatus.status = 'offline';
        }
      }
    }
    
    // Look for deployment timestamps
    const deployLogPath = path.join(projectPath, 'alibaba', 'deploy.log');
    if (fs.existsSync(deployLogPath)) {
      const logContent = fs.readFileSync(deployLogPath, 'utf8');
      const dateMatch = logContent.match(/Deployment completed at: (.+)/);
      if (dateMatch && dateMatch[1]) {
        baseStatus.lastDeployed = new Date(dateMatch[1]);
      }
    }
    
    return baseStatus;
  } catch (error: unknown) {
    console.error(chalk.yellow(`Warning: Alibaba Cloud status check error: ${error instanceof Error ? error.message : String(error)}`));
    return baseStatus;
  }
}

/**
 * Display server status information
 * @param status Server status object
 * @param asJson Whether to output as JSON
 */
function displayStatus(status: ServerStatus, asJson: boolean): void {
  if (asJson) {
    console.log(JSON.stringify(status, null, 2));
    return;
  }
  
  // Display formatted status
  console.log(chalk.bold('\n�� MCP Server Status\n'));
  console.log(chalk.bold('Name:      '), status.name);
  console.log(chalk.bold('Version:   '), status.version);
  
  // Display status with color
  let statusColor;
  switch (status.status) {
    case 'online':
      statusColor = chalk.green;
      break;
    case 'degraded':
      statusColor = chalk.yellow;
      break;
    case 'offline':
      statusColor = chalk.red;
      break;
    default:
      statusColor = chalk.grey;
  }
  
  console.log(chalk.bold('Status:    '), statusColor(status.status.toUpperCase()));
  
  // Display additional information if available
  if (status.url) {
    console.log(chalk.bold('URL:       '), status.url);
  }
  
  if (status.cloudProvider) {
    console.log(chalk.bold('Cloud:     '), status.cloudProvider);
  }
  
  if (status.environment) {
    console.log(chalk.bold('Environment:'), status.environment);
  }
  
  if (status.uptime) {
    console.log(chalk.bold('Uptime:    '), status.uptime);
  }
  
  if (status.lastDeployed) {
    console.log(chalk.bold('Deployed:  '), status.lastDeployed.toLocaleString());
  }
  
  if (status.resources) {
    console.log(chalk.bold('\nResources:'));
    
    if (status.resources.cpu) {
      console.log(chalk.bold('  CPU:     '), status.resources.cpu);
    }
    
    if (status.resources.memory) {
      console.log(chalk.bold('  Memory:  '), status.resources.memory);
    }
    
    if (status.resources.storage) {
      console.log(chalk.bold('  Storage: '), status.resources.storage);
    }
  }
  
  console.log('\n');
} 