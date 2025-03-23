import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

interface LogOptions {
  tail?: boolean;
  limit?: number;
  since?: string;
  grep?: string;
  format?: 'text' | 'json';
}

/**
 * Logs command for the MCP CLI
 * Fetches and displays logs from deployed MCP servers
 */
export function logsCommand(program: Command): void {
  program
    .command('logs')
    .description('Fetch logs from deployed MCP servers')
    .option('-p, --path <path>', 'Path to the project directory', '.')
    .option('-c, --cloud <provider>', 'Specify cloud provider (aws, gcp, azure, alibaba)')
    .option('-e, --environment <environment>', 'Specify environment (development, staging, production)')
    .option('-t, --tail', 'Follow logs in real-time')
    .option('-n, --limit <number>', 'Number of log lines to fetch', '100')
    .option('-s, --since <time>', 'Show logs since timestamp (e.g., 30m, 1h, 2d)')
    .option('-g, --grep <pattern>', 'Filter logs by pattern')
    .option('--json', 'Output logs as JSON')
    .action(async (options) => {
      console.log(chalk.bold('\n📋 Fetching MCP Server Logs\n'));
      
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
                message: 'Select cloud provider to fetch logs from:',
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
        
        // Create log options object
        const logOptions: LogOptions = {
          tail: options.tail || false,
          limit: parseInt(options.limit, 10) || 100,
          since: options.since,
          grep: options.grep,
          format: options.json ? 'json' : 'text'
        };
        
        // Check if there's a logs script for this provider
        const logsScript = `logs:${cloudProvider}`;
        if (packageJson.scripts && packageJson.scripts[logsScript]) {
          console.log(chalk.blue(`Executing logs fetch script for ${cloudProvider}...`));
          
          try {
            // Prepare environment variables for the script
            const env = {
              ...process.env,
              DEPLOY_ENV: environment,
              LOG_TAIL: logOptions.tail ? 'true' : 'false',
              LOG_LIMIT: String(logOptions.limit),
              LOG_SINCE: logOptions.since || '',
              LOG_GREP: logOptions.grep || '',
              LOG_FORMAT: logOptions.format
            };
            
            // Execute the logs script
            const scriptCmd = `npm run ${logsScript}`;
            console.log(chalk.dim(`Running: ${scriptCmd}`));
            
            if (logOptions.tail) {
              // For tail mode, we need to keep the process running and stream output
              try {
                execSync(scriptCmd, { 
                  cwd: projectPath,
                  stdio: 'inherit',
                  env
                });
              } catch (error) {
                // The user probably aborted the tail with Ctrl+C, which is expected
                process.exit(0);
              }
            } else {
              // For regular mode, just execute and print output
              const output = execSync(scriptCmd, { 
                cwd: projectPath,
                encoding: 'utf8',
                env
              });
              
              console.log(output);
            }
          } catch (error) {
            console.error(chalk.red('❌ Logs fetch failed:'), error);
            process.exit(1);
          }
        } else {
          // No logs script found, try to fetch logs based on cloud provider
          await fetchLogs(projectPath, cloudProvider, environment, logOptions);
        }
        
      } catch (error) {
        console.error(chalk.red('❌ Error reading package.json:'), error);
        process.exit(1);
      }
    });
}

/**
 * Fetch logs from the deployed server based on cloud provider
 * @param projectPath Path to the project directory
 * @param cloudProvider Cloud provider (aws, gcp, azure, alibaba)
 * @param environment Deployment environment
 * @param options Log fetching options
 */
async function fetchLogs(
  projectPath: string, 
  cloudProvider: string, 
  environment: string,
  options: LogOptions
): Promise<void> {
  console.log(chalk.blue(`Fetching logs for ${cloudProvider} deployment in ${environment} environment...`));
  
  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const serviceName = packageJson.name || 'mcp-server';
  
  // Different log fetching logic based on cloud provider
  switch (cloudProvider) {
    case 'aws':
      await fetchAWSLogs(projectPath, serviceName, environment, options);
      break;
    case 'gcp':
      await fetchGCPLogs(projectPath, serviceName, environment, options);
      break;
    case 'azure':
      await fetchAzureLogs(projectPath, serviceName, environment, options);
      break;
    case 'alibaba':
      await fetchAlibabaLogs(projectPath, serviceName, environment, options);
      break;
    default:
      console.error(chalk.red(`❌ Unsupported cloud provider: ${cloudProvider}`));
      process.exit(1);
  }
}

/**
 * Fetch logs from AWS deployed service
 */
async function fetchAWSLogs(
  projectPath: string,
  serviceName: string,
  environment: string,
  options: LogOptions
): Promise<void> {
  try {
    // Check for AWS config
    const awsConfigPath = path.join(projectPath, 'aws');
    if (!fs.existsSync(awsConfigPath)) {
      console.error(chalk.red('❌ AWS configuration not found.'));
      process.exit(1);
    }
    
    const resourceConfig = determineAWSResource(projectPath, serviceName, environment);
    
    if (resourceConfig.type === 'lambda') {
      const logGroupName = `/aws/lambda/${resourceConfig.name}`;
      fetchCloudWatchLogs(logGroupName, options);
    } else if (resourceConfig.type === 'ecs') {
      console.log(chalk.blue(`Fetching logs for ECS service ${resourceConfig.name}...`));
      fetchECSLogs(resourceConfig.cluster || '', resourceConfig.name, options);
    } else {
      console.error(chalk.red(`❌ Unsupported AWS resource type: ${resourceConfig.type}`));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error fetching AWS logs:'), error);
    process.exit(1);
  }
}

/**
 * Determine AWS resource type and name
 */
function determineAWSResource(
  projectPath: string,
  serviceName: string,
  environment: string
): { type: 'lambda' | 'ecs' | 'ec2', name: string, cluster?: string } {
  try {
    // First, try to get the CloudFormation stack and check its resources
    const stackName = `${serviceName}-${environment}`;
    const output = execSync(`aws cloudformation describe-stack-resources --stack-name ${stackName}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    const resources = JSON.parse(output).StackResources;
    
    // Check for Lambda function
    const lambdaResource = resources.find((r: any) => r.ResourceType === 'AWS::Lambda::Function');
    if (lambdaResource) {
      return { 
        type: 'lambda', 
        name: lambdaResource.PhysicalResourceId 
      };
    }
    
    // Check for ECS service
    const ecsServiceResource = resources.find((r: any) => r.ResourceType === 'AWS::ECS::Service');
    if (ecsServiceResource) {
      const clusterResource = resources.find((r: any) => r.ResourceType === 'AWS::ECS::Cluster');
      return { 
        type: 'ecs', 
        name: ecsServiceResource.PhysicalResourceId,
        cluster: clusterResource ? clusterResource.PhysicalResourceId : 'default'
      };
    }
    
    // Default to Lambda with the service name if resource not found
    return { 
      type: 'lambda', 
      name: `${serviceName}-${environment}` 
    };
  } catch (error) {
    // If CloudFormation lookup fails, make a best guess based on config structure
    const lambdaConfigPath = path.join(projectPath, 'aws', 'lambda.js');
    if (fs.existsSync(lambdaConfigPath)) {
      return {
        type: 'lambda',
        name: `${serviceName}-${environment}`
      };
    }
    
    // Default to Lambda with service name
    return {
      type: 'lambda',
      name: `${serviceName}-${environment}`
    };
  }
}

/**
 * Fetch logs from CloudWatch Logs
 */
function fetchCloudWatchLogs(logGroupName: string, options: LogOptions): void {
  try {
    let cmd = `aws logs get-log-events --log-group-name ${logGroupName}`;
    
    if (options.limit) {
      cmd += ` --limit ${options.limit}`;
    }
    
    // If tail option is set, use the tail command instead
    if (options.tail) {
      cmd = `aws logs tail ${logGroupName} --follow`;
      
      if (options.grep) {
        cmd += ` | grep "${options.grep}"`;
      }
      
      console.log(chalk.dim(`Running: ${cmd}`));
      
      try {
        execSync(cmd, {
          stdio: 'inherit'
        });
      } catch (error) {
        // User probably aborted with Ctrl+C
        process.exit(0);
      }
    } else {
      let output = execSync(cmd, {
        encoding: 'utf8'
      });
      
      if (options.format === 'json') {
        console.log(output);
      } else {
        const events = JSON.parse(output).events;
        events.forEach((event: any) => {
          const timestamp = new Date(event.timestamp).toISOString();
          console.log(`${chalk.dim(timestamp)} ${event.message}`);
        });
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error fetching CloudWatch logs:'), error);
    process.exit(1);
  }
}

/**
 * Fetch logs from ECS service
 */
function fetchECSLogs(cluster: string, serviceName: string, options: LogOptions): void {
  try {
    // First, get the running tasks for this service
    const tasksCmd = `aws ecs list-tasks --cluster ${cluster} --service-name ${serviceName}`;
    const tasksOutput = execSync(tasksCmd, { encoding: 'utf8' });
    const tasks = JSON.parse(tasksOutput).taskArns;
    
    if (!tasks || tasks.length === 0) {
      console.error(chalk.yellow('⚠️ No running tasks found for this service.'));
      return;
    }
    
    // Get the task details
    const taskId = tasks[0].split('/').pop();
    const taskCmd = `aws ecs describe-tasks --cluster ${cluster} --tasks ${taskId}`;
    const taskOutput = execSync(taskCmd, { encoding: 'utf8' });
    const task = JSON.parse(taskOutput).tasks[0];
    
    // Get the container details and log configuration
    const container = task.containers[0];
    
    // Check if the container is using awslogs
    if (container.logDriver === 'awslogs') {
      const logGroupName = container.logConfiguration.options['awslogs-group'];
      const logStreamPrefix = container.logConfiguration.options['awslogs-stream-prefix'];
      const logStreamName = `${logStreamPrefix}/${container.name}/${taskId}`;
      
      console.log(chalk.blue(`Fetching logs from log stream: ${logStreamName}`));
      
      let cmd = `aws logs get-log-events --log-group-name ${logGroupName} --log-stream-name ${logStreamName}`;
      
      if (options.limit) {
        cmd += ` --limit ${options.limit}`;
      }
      
      if (options.tail) {
        cmd = `aws logs tail ${logGroupName} --log-stream-names ${logStreamName} --follow`;
        
        if (options.grep) {
          cmd += ` | grep "${options.grep}"`;
        }
        
        console.log(chalk.dim(`Running: ${cmd}`));
        
        try {
          execSync(cmd, {
            stdio: 'inherit'
          });
        } catch (error) {
          // User probably aborted with Ctrl+C
          process.exit(0);
        }
      } else {
        let output = execSync(cmd, {
          encoding: 'utf8'
        });
        
        if (options.format === 'json') {
          console.log(output);
        } else {
          const events = JSON.parse(output).events;
          events.forEach((event: any) => {
            const timestamp = new Date(event.timestamp).toISOString();
            console.log(`${chalk.dim(timestamp)} ${event.message}`);
          });
        }
      }
    } else {
      console.error(chalk.yellow(`⚠️ Container is using a different log driver: ${container.logDriver}`));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error fetching ECS logs:'), error);
    process.exit(1);
  }
}

/**
 * Fetch logs from GCP deployed service
 */
async function fetchGCPLogs(
  projectPath: string,
  serviceName: string,
  environment: string,
  options: LogOptions
): Promise<void> {
  try {
    // Check for GCP config
    const gcpConfigPath = path.join(projectPath, 'gcp');
    if (!fs.existsSync(gcpConfigPath)) {
      console.error(chalk.red('❌ GCP configuration not found.'));
      process.exit(1);
    }
    
    // Determine if this is a Cloud Run or Cloud Function deployment
    const isCloudFunction = fs.existsSync(path.join(projectPath, 'gcp', 'cloud-functions.js'));
    const resourceName = `${serviceName}-${environment}`;
    
    let cmd: string;
    if (isCloudFunction) {
      cmd = `gcloud functions logs read ${resourceName}`;
    } else {
      // Default to Cloud Run
      cmd = `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=${resourceName}"`;
    }
    
    // Add filtering options
    if (options.limit) {
      cmd += ` --limit=${options.limit}`;
    }
    
    if (options.since) {
      // Convert human-friendly time to timestamp
      cmd += ` --freshness="${options.since}"`;
    }
    
    if (options.grep) {
      cmd += ` --filter="${options.grep}"`;
    }
    
    if (options.format === 'json') {
      cmd += ' --format=json';
    }
    
    if (options.tail) {
      // There's no direct tail for GCP logs, but we can simulate it with a watch command
      console.log(chalk.yellow('Note: GCP logs are refreshed every 5 seconds...'));
      cmd = `watch -n 5 '${cmd}'`;
    }
    
    console.log(chalk.dim(`Running: ${cmd}`));
    
    try {
      execSync(cmd, {
        stdio: 'inherit'
      });
    } catch (error) {
      if (options.tail) {
        // User probably aborted with Ctrl+C, which is fine for tail mode
        process.exit(0);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error fetching GCP logs:'), error);
    process.exit(1);
  }
}

/**
 * Fetch logs from Azure deployed service
 */
async function fetchAzureLogs(
  projectPath: string,
  serviceName: string,
  environment: string,
  options: LogOptions
): Promise<void> {
  try {
    // Check for Azure config
    const azureConfigPath = path.join(projectPath, 'azure');
    if (!fs.existsSync(azureConfigPath)) {
      console.error(chalk.red('❌ Azure configuration not found.'));
      process.exit(1);
    }
    
    // Determine if this is an App Service or Function App
    const isFunctionApp = fs.existsSync(path.join(projectPath, 'azure', 'function-app.json'));
    const resourceName = `${serviceName}-${environment}`;
    
    // Determine the resource group
    let resourceGroup;
    try {
      const groupsCmd = `az group list --query "[?contains(name, '${serviceName}')].name" -o json`;
      const groups = JSON.parse(execSync(groupsCmd, { encoding: 'utf8' }));
      resourceGroup = groups[0] || `${serviceName}-group`;
    } catch (error) {
      resourceGroup = `${serviceName}-group`;
      console.log(chalk.yellow(`⚠️ Could not determine resource group. Using ${resourceGroup}`));
    }
    
    let cmd: string;
    if (isFunctionApp) {
      if (options.tail) {
        cmd = `az webapp log tail --name ${resourceName} --resource-group ${resourceGroup}`;
      } else {
        cmd = `az webapp log download --name ${resourceName} --resource-group ${resourceGroup} -o json`;
      }
    } else {
      // Default to App Service
      if (options.tail) {
        cmd = `az webapp log tail --name ${resourceName} --resource-group ${resourceGroup}`;
      } else {
        cmd = `az webapp log download --name ${resourceName} --resource-group ${resourceGroup} -o json`;
      }
    }
    
    // Add filtering options
    if (options.limit && !options.tail) {
      // Azure CLI doesn't support limiting the number of logs directly
      // We'll have to filter after fetching
      cmd += ` | head -n ${options.limit}`;
    }
    
    if (options.grep && !options.tail) {
      cmd += ` | grep "${options.grep}"`;
    }
    
    console.log(chalk.dim(`Running: ${cmd}`));
    
    try {
      execSync(cmd, {
        stdio: 'inherit'
      });
    } catch (error) {
      if (options.tail) {
        // User probably aborted with Ctrl+C, which is fine for tail mode
        process.exit(0);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ Error fetching Azure logs:'), error);
    process.exit(1);
  }
}

/**
 * Fetch logs from Alibaba deployed service
 */
async function fetchAlibabaLogs(
  projectPath: string,
  serviceName: string,
  environment: string,
  options: LogOptions
): Promise<void> {
  try {
    // Check for Alibaba config
    const alibabaConfigPath = path.join(projectPath, 'alibaba');
    if (!fs.existsSync(alibabaConfigPath)) {
      console.error(chalk.red('❌ Alibaba configuration not found.'));
      process.exit(1);
    }
    
    const resourceName = `${serviceName}-${environment}`;
    
    console.log(chalk.yellow('⚠️ Alibaba Cloud log fetching requires specialized configuration.'));
    console.log(chalk.yellow('⚠️ Checking for logs in local deployment logs...'));
    
    // For Alibaba, we'll look for local log files as the CLI tooling is more limited
    const logPaths = [
      path.join(projectPath, 'alibaba', 'logs', `${environment}.log`),
      path.join(projectPath, 'logs', `${environment}.log`),
      path.join(projectPath, 'logs', 'deploy.log')
    ];
    
    let logFound = false;
    for (const logPath of logPaths) {
      if (fs.existsSync(logPath)) {
        logFound = true;
        console.log(chalk.blue(`Found log file: ${logPath}`));
        
        let cmd = `cat ${logPath}`;
        
        if (options.limit) {
          cmd = `tail -n ${options.limit} ${logPath}`;
        }
        
        if (options.grep) {
          cmd += ` | grep "${options.grep}"`;
        }
        
        if (options.tail) {
          cmd = `tail -f ${logPath}`;
          
          if (options.grep) {
            cmd += ` | grep "${options.grep}"`;
          }
        }
        
        console.log(chalk.dim(`Running: ${cmd}`));
        
        try {
          execSync(cmd, {
            stdio: 'inherit'
          });
        } catch (error) {
          if (options.tail) {
            // User probably aborted with Ctrl+C, which is fine for tail mode
            process.exit(0);
          } else {
            throw error;
          }
        }
        
        break;
      }
    }
    
    if (!logFound) {
      console.error(chalk.yellow('⚠️ No log files found for this Alibaba deployment.'));
      console.log(chalk.blue('Consider checking the Alibaba Cloud Console for logs.'));
    }
  } catch (error) {
    console.error(chalk.red('❌ Error fetching Alibaba logs:'), error);
    process.exit(1);
  }
} 