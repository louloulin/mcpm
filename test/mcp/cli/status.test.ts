import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { rimrafSync } from 'rimraf';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock execSync
jest.mock('child_process', () => ({
  execSync: jest.fn().mockImplementation((command: string) => {
    // Return different mock data based on the command
    if (command.includes('aws cloudformation')) {
      return JSON.stringify({
        Stacks: [
          {
            StackName: 'test-stack',
            StackStatus: 'CREATE_COMPLETE',
            CreationTime: '2023-01-01T00:00:00.000Z',
            Outputs: [
              {
                OutputKey: 'ApiUrl',
                OutputValue: 'https://test-api.example.com'
              }
            ]
          }
        ]
      });
    } else if (command.includes('gcloud run')) {
      return JSON.stringify({
        status: {
          url: 'https://test-gcp.example.com',
          conditions: [
            { type: 'Ready', status: 'True' }
          ],
          latestCreatedRevisionName: 'test-revision-1234567890'
        },
        spec: {
          template: {
            containers: [
              {
                resources: {
                  limits: {
                    cpu: '1',
                    memory: '512Mi'
                  }
                }
              }
            ]
          }
        }
      });
    } else if (command.includes('az webapp')) {
      return JSON.stringify({
        name: 'test-app',
        state: 'Running',
        lastModifiedTimeUtc: '2023-01-01T00:00:00.000Z',
        defaultHostName: 'test-app.azurewebsites.net',
        resourceGroup: 'test-rg',
        sku: 'P1v2'
      });
    } else if (command.includes('npm run status')) {
      return JSON.stringify({
        name: 'test-server',
        version: '1.0.0',
        status: 'online',
        url: 'https://test-status.example.com',
        uptime: '10d 2h 30m',
        lastDeployed: '2023-01-01T00:00:00.000Z'
      });
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

describe('Status Command', () => {
  const testDir = join(__dirname, '..', '..', 'temp-test-status');
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
    
    // Reset axios mock
    mockedAxios.get.mockReset();
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
  });
  
  it('should check server status by URL', async () => {
    // Mock axios response for health check
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        version: '1.2.3',
        status: 'online',
        uptime: '3d 10h 5m'
      }
    });
    
    // Import the statusCommand function (needs to be imported here to ensure mocks are set up first)
    const { statusCommand } = require('../../../lib/cli/commands/status');
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        fn({
          url: 'https://test.example.com',
          json: false
        });
        return mockProgram;
      })
    };
    
    // Call the status command
    statusCommand(mockProgram);
    
    // Check if axios.get was called with the correct URL
    expect(mockedAxios.get).toHaveBeenCalledWith('https://test.example.com/health', { timeout: 5000 });
    
    // Check the console output for expected status
    expect(consoleOutput.some(line => line.includes('online') || line.includes('ONLINE'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('1.2.3'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('3d 10h 5m'))).toBeTruthy();
  });
  
  it('should detect server is offline when URL check fails', async () => {
    // Mock axios to throw an error
    mockedAxios.get.mockRejectedValueOnce(new Error('Connection refused'));
    
    // Import the statusCommand function
    const { statusCommand } = require('../../../lib/cli/commands/status');
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        fn({
          url: 'https://test.example.com',
          json: false
        });
        return mockProgram;
      })
    };
    
    // Call the status command
    statusCommand(mockProgram);
    
    // Check the console output for offline status
    expect(consoleOutput.some(line => line.includes('offline') || line.includes('OFFLINE'))).toBeTruthy();
  });
  
  it('should check AWS server status', async () => {
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
    
    // Import the statusCommand function
    const { statusCommand } = require('../../../lib/cli/commands/status');
    
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
          json: false
        });
        return mockProgram;
      })
    };
    
    // Call the status command
    statusCommand(mockProgram);
    
    // Check the console output for AWS status
    expect(consoleOutput.some(line => line.includes('online') || line.includes('ONLINE'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('https://test-api.example.com'))).toBeTruthy();
  });
}); 