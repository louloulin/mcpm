import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { rimrafSync } from 'rimraf';
import { updateCommand } from '../../../lib/cli/commands/update';
import { Command } from 'commander';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn().mockImplementation((command: string) => {
    if (command.includes('deploy:aws') || 
        command.includes('deploy:gcp') || 
        command.includes('deploy:azure') || 
        command.includes('deploy:alibaba')) {
      return 'Deployment successful';
    }
    
    if (command.includes('update:aws')) {
      return 'AWS update script executed';
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

describe('Update Command', () => {
  const testDir = join(__dirname, '..', '..', 'temp-test-update');
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
  
  it('should detect and update AWS deployment', async () => {
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
          version: '1.0.1',
          force: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    updateCommand(mockProgram, true);
    
    // Verify that the expected messages are in the output
    expect(consoleOutput.some(line => line.includes('Updating MCP Server'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Current project version: 1.0.0'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Executing AWS update'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Successfully updated to version 1.0.1'))).toBeTruthy();
    
    // Verify that the execSync method was called with the right command
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('deploy:aws'),
      expect.any(Object)
    );
  });
  
  it('should create a backup before updating', async () => {
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
          environment: 'production',
          version: '1.1.0',
          backup: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    updateCommand(mockProgram, true);
    
    // Verify that backup was created
    expect(consoleOutput.some(line => line.includes('Creating backup before update'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Creating GCP backup:'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Backup created:'))).toBeTruthy();
    
    // Verify backup information was saved
    const backupInfoPath = join(testDir, '.mcpm-backups.json');
    expect(existsSync(backupInfoPath)).toBeTruthy();
  });
  
  it('should handle custom update scripts', async () => {
    // Create a package.json with custom update script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:aws': 'echo "AWS deploy"',
        'update:aws': 'echo "Custom AWS update"'
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
          version: '1.0.1'
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    updateCommand(mockProgram, true);
    
    // Verify that the custom script was executed
    expect(consoleOutput.some(line => line.includes('Executing update script for aws'))).toBeTruthy();
    
    // Verify that the execSync method was called with the right command
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('update:aws'),
      expect.any(Object)
    );
  });
  
  it('should handle check-only mode', async () => {
    // Create a package.json
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:azure': 'echo "Azure deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Mock process.exit
    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined): never => {
      throw new Error(`Process.exit called with code: ${code}`);
    });
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with mocked options
        try {
          fn({
            path: testDir,
            cloud: 'azure',
            checkOnly: true,
            json: true
          });
        } catch (error) {
          // Expected error from process.exit
        }
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    updateCommand(mockProgram, true);
    
    // Verify check-only mode output
    expect(consoleOutput.some(line => line.includes('Checking for updates'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Update available:'))).toBeTruthy();
    
    // Verify that process.exit was called
    expect(mockExit).toHaveBeenCalledWith(0);
    
    // Restore the original process.exit
    mockExit.mockRestore();
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
    updateCommand(mockProgram, true);
    
    // Verify error message was logged
    expect(consoleOutput.some(line => line.includes('Project directory not found'))).toBeTruthy();
  });
}); 