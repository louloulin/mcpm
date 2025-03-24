import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { rimrafSync } from 'rimraf';
import { backupCommand } from '../../../lib/cli/commands/backup';
import { Command } from 'commander';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn().mockImplementation((command: string) => {
    if (command.includes('backup:aws') || 
        command.includes('backup:gcp') || 
        command.includes('backup:azure') || 
        command.includes('backup:alibaba')) {
      return 'Backup script executed';
    }
    
    return '';
  })
}));

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockImplementation((questions) => {
    const defaultAnswers: Record<string, any> = {
      cloudProvider: 'aws',
      environment: 'development',
      description: 'Test backup description',
      confirm: true
    };
    
    // Extract the first question name
    const firstQuestion = Array.isArray(questions) ? questions[0] : questions;
    const questionName = firstQuestion.name;
    
    return Promise.resolve({ [questionName]: defaultAnswers[questionName] });
  })
}));

// Mock validateCloudEnvironment
jest.mock('../../../lib/cli/commands/env-validator', () => ({
  validateCloudEnvironment: jest.fn().mockImplementation((provider: string) => ({
    valid: true,
    missing: []
  }))
}));

describe('Backup Command', () => {
  const testDir = join(__dirname, '..', '..', 'temp-test-backup');
  let originalConsoleLog: any;
  let originalConsoleError: any;
  let consoleOutput: string[] = [];
  
  beforeAll(() => {
    // Create temporary test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    
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
  
  it('should create a basic backup for AWS deployment', async () => {
    // Create a package.json with AWS deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:aws': 'echo "AWS deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
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
          description: 'Test backup',
          database: true,
          files: true,
          full: false
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    backupCommand(mockProgram, true);
    
    // Verify backup creation
    expect(consoleOutput.some(line => line.includes('Creating MCP Server Backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Executing AWS backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Creating RDS snapshot'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Creating S3 bucket backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Backup created:'))).toBeTruthy();
    
    // Verify backup info was saved
    const backupInfoPath = join(testDir, '.mcpm-backups.json');
    expect(existsSync(backupInfoPath)).toBeTruthy();
  });
  
  it('should handle full backup including compute resources', async () => {
    // Create a package.json with GCP deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:gcp': 'echo "GCP deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
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
          environment: 'production',
          full: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    backupCommand(mockProgram, true);
    
    // Verify full backup
    expect(consoleOutput.some(line => line.includes('Executing GCP backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Creating Cloud SQL backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Creating Cloud Storage backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Creating Compute Engine snapshot'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Backup created:'))).toBeTruthy();
  });
  
  it('should use custom backup script if available', async () => {
    // Create a package.json with custom backup script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:azure': 'echo "Azure deploy"',
        'backup:azure': 'echo "Custom Azure backup"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
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
          environment: 'staging'
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    backupCommand(mockProgram, true);
    
    // Verify custom backup script execution
    expect(consoleOutput.some(line => line.includes('Executing backup script for azure'))).toBeTruthy();
    
    // Verify that the execSync method was called with the right command
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('backup:azure'),
      expect.any(Object)
    );
  });
  
  it('should handle selective backup with no database', async () => {
    // Create a package.json with Alibaba deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:alibaba': 'echo "Alibaba deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
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
          database: false,
          files: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    backupCommand(mockProgram, true);
    
    // Verify selective backup
    expect(consoleOutput.some(line => line.includes('Executing Alibaba Cloud backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Creating ApsaraDB backup'))).toBeFalsy();
    expect(consoleOutput.some(line => line.includes('Creating OSS backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Backup created:'))).toBeTruthy();
  });
  
  it('should handle non-existent project directory', async () => {
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with a non-existent path
        try {
          fn({
            path: join(testDir, 'non-existent')
          });
        } catch (error: any) {
          // This is expected in testing mode
          expect(error.message).toContain('Project directory does not exist');
        }
        return mockProgram;
      })
    } as unknown as Command;
    
    // Clear previous output
    consoleOutput = [];
    
    // Initialize the command with testing flag
    backupCommand(mockProgram, true);
    
    // Verify error message was logged
    expect(consoleOutput.some(line => line.includes('Project directory not found'))).toBeTruthy();
  });
}); 