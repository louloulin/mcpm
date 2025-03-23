import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { rimrafSync } from 'rimraf';
import { logsCommand } from '../../../lib/cli/commands/logs';
import { Command } from 'commander';

// Mock execSync
jest.mock('child_process', () => ({
  execSync: jest.fn().mockImplementation((command: string) => {
    // Return different mock data based on the command
    if (command.includes('aws logs get-log-events')) {
      return JSON.stringify({
        events: [
          {
            timestamp: 1609459200000, // 2021-01-01
            message: '[INFO] Server started'
          },
          {
            timestamp: 1609459260000, // 2021-01-01 + 1 minute
            message: '[INFO] Connected to database'
          },
          {
            timestamp: 1609459320000, // 2021-01-01 + 2 minutes
            message: '[ERROR] Failed to process request: timeout'
          }
        ]
      });
    } else if (command.includes('aws ecs list-tasks')) {
      return JSON.stringify({
        taskArns: [
          'arn:aws:ecs:us-west-2:123456789012:task/test-cluster/1234567890abcdef0'
        ]
      });
    } else if (command.includes('aws ecs describe-tasks')) {
      return JSON.stringify({
        tasks: [
          {
            containers: [
              {
                name: 'mcp-container',
                logDriver: 'awslogs',
                logConfiguration: {
                  options: {
                    'awslogs-group': '/aws/ecs/test-service',
                    'awslogs-stream-prefix': 'ecs'
                  }
                }
              }
            ]
          }
        ]
      });
    } else if (command.includes('gcloud logging read')) {
      return `[
        {
          "timestamp": "2021-01-01T00:00:00.000Z",
          "severity": "INFO",
          "textPayload": "Server started"
        },
        {
          "timestamp": "2021-01-01T00:01:00.000Z",
          "severity": "INFO",
          "textPayload": "Connected to database"
        },
        {
          "timestamp": "2021-01-01T00:02:00.000Z",
          "severity": "ERROR",
          "textPayload": "Failed to process request: timeout"
        }
      ]`;
    } else if (command.includes('az webapp log download')) {
      return JSON.stringify({
        url: 'https://example.com/logs/download'
      });
    } else if (command.includes('az group list')) {
      return JSON.stringify([
        'test-resource-group'
      ]);
    } else if (command.includes('cat') || command.includes('tail')) {
      return `2021-01-01T00:00:00.000Z [INFO] Server started
2021-01-01T00:01:00.000Z [INFO] Connected to database
2021-01-01T00:02:00.000Z [ERROR] Failed to process request: timeout`;
    } else if (command.includes('npm run logs:aws')) {
      return 'Custom AWS logs script output';
    }
    
    return '';
  })
}));

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockResolvedValue({
    cloudProvider: 'aws',
    environment: 'development'
  })
}));

describe('Logs Command', () => {
  const testDir = join(__dirname, '..', '..', 'temp-test-logs');
  let originalConsoleLog: any;
  let originalConsoleError: any;
  let consoleOutput: string[] = [];
  
  beforeAll(() => {
    // Mock console.log and console.error to capture output
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    
    console.log = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
    
    console.error = jest.fn((...args) => {
      consoleOutput.push(args.join(' '));
    });
  });
  
  afterAll(() => {
    // Restore console.log and console.error
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Clean up test directory
    if (existsSync(testDir)) {
      rimrafSync(testDir);
    }
  });
  
  beforeEach(() => {
    // Create test directory
    if (existsSync(testDir)) {
      rimrafSync(testDir);
    }
    mkdirSync(testDir, { recursive: true });
    
    // Reset captured console output
    consoleOutput = [];
    
    // Reset all mocks
    jest.clearAllMocks();
  });
  
  it('should fetch AWS Lambda logs', async () => {
    // Create a package.json with AWS deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:aws': 'echo "AWS deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create AWS directory
    mkdirSync(join(testDir, 'aws'), { recursive: true });
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        fn({
          path: testDir,
          cloud: 'aws',
          environment: 'development',
          limit: '10',
          json: false
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Call the logs command
    logsCommand(mockProgram);
    
    // Verify that the expected log messages are in the output
    expect(consoleOutput.some(line => line.includes('Server started'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Connected to database'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Failed to process request'))).toBeTruthy();
  });
  
  it('should fetch GCP logs', async () => {
    // Create a package.json with GCP deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:gcp': 'echo "GCP deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create GCP directory
    mkdirSync(join(testDir, 'gcp'), { recursive: true });
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        fn({
          path: testDir,
          cloud: 'gcp',
          environment: 'development',
          since: '1h',
          grep: 'ERROR',
          json: false
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Call the logs command
    logsCommand(mockProgram);
    
    // Verify that the command was executed with the right parameters
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalled();
    const calls = execSync.mock.calls;
    const gcloudCall = calls.find((call: any) => 
      typeof call[0] === 'string' && call[0].includes('gcloud logging read')
    );
    
    expect(gcloudCall).toBeTruthy();
    expect(gcloudCall[0]).toContain('--freshness="1h"');
    expect(gcloudCall[0]).toContain('--filter="ERROR"');
  });
  
  it('should fetch Azure logs', async () => {
    // Create a package.json with Azure deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:azure': 'echo "Azure deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create Azure directory
    mkdirSync(join(testDir, 'azure'), { recursive: true });
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        fn({
          path: testDir,
          cloud: 'azure',
          environment: 'development',
          limit: '10',
          json: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Call the logs command
    logsCommand(mockProgram);
    
    // Verify that the command was executed with the right parameters
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalled();
    const calls = execSync.mock.calls;
    const azureCall = calls.find((call: any) => 
      typeof call[0] === 'string' && call[0].includes('az webapp log download')
    );
    
    expect(azureCall).toBeTruthy();
    expect(azureCall[0]).toContain('-o json');
  });
  
  it('should fetch Alibaba logs from local files', async () => {
    // Create a package.json with Alibaba deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:alibaba': 'echo "Alibaba deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create Alibaba directory and log file
    const alibabaDir = join(testDir, 'alibaba');
    const logsDir = join(alibabaDir, 'logs');
    mkdirSync(alibabaDir, { recursive: true });
    mkdirSync(logsDir, { recursive: true });
    
    const logContent = `2021-01-01T00:00:00.000Z [INFO] Server started
2021-01-01T00:01:00.000Z [INFO] Connected to database
2021-01-01T00:02:00.000Z [ERROR] Failed to process request: timeout`;
    
    writeFileSync(join(logsDir, 'development.log'), logContent);
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        fn({
          path: testDir,
          cloud: 'alibaba',
          environment: 'development',
          grep: 'ERROR',
          json: false
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Call the logs command
    logsCommand(mockProgram);
    
    // Verify that the command was executed with the right parameters
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalled();
    const calls = execSync.mock.calls;
    const grepCall = calls.find((call: any) => 
      typeof call[0] === 'string' && call[0].includes('grep "ERROR"')
    );
    
    expect(grepCall).toBeTruthy();
  });
  
  it('should use custom logs script if available', async () => {
    // Create a package.json with custom logs script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:aws': 'echo "AWS deploy"',
        'logs:aws': 'echo "Custom AWS logs script"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create AWS directory
    mkdirSync(join(testDir, 'aws'), { recursive: true });
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        fn({
          path: testDir,
          cloud: 'aws',
          environment: 'development',
          limit: '10',
          json: false
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Call the logs command
    logsCommand(mockProgram);
    
    // Verify that the custom script was executed
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalled();
    const calls = execSync.mock.calls;
    const customScriptCall = calls.find((call: any) => 
      typeof call[0] === 'string' && call[0].includes('npm run logs:aws')
    );
    
    expect(customScriptCall).toBeTruthy();
    
    // Check for custom script output
    expect(consoleOutput.some(line => line.includes('Custom AWS logs script'))).toBeTruthy();
  });
}); 