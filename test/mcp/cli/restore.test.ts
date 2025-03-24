import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { rimrafSync } from 'rimraf';
import { restoreCommand } from '../../../lib/cli/commands/restore';
import { Command } from 'commander';

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn().mockImplementation((command: string) => {
    if (command.includes('restore:aws') || 
        command.includes('restore:gcp') || 
        command.includes('restore:azure') || 
        command.includes('restore:alibaba')) {
      return 'Restore script executed';
    }
    
    return '';
  })
}));

// Mock inquirer
jest.mock('inquirer', () => ({
  prompt: jest.fn().mockImplementation((questions) => {
    // Default answers based on question type
    const defaultAnswers: Record<string, any> = {
      cloudProvider: 'aws',
      environment: 'development',
      backupName: 'backup_development_2023_01_01T00_00_00_000Z',
      confirm: true
    };
    
    // Extract the question name to determine which answer to return
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

describe('Restore Command', () => {
  const testDir = join(__dirname, '..', '..', 'temp-test-restore');
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
  
  it('should restore from an AWS backup', async () => {
    // Create a package.json with AWS deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:aws': 'echo "AWS deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create a mock backup information file
    const backupInfo = [
      {
        name: 'backup_development_2023_01_01T00_00_00_000Z',
        description: 'Test backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'development',
        cloudProvider: 'aws',
        fullBackup: false,
        includeDatabase: true,
        includeFiles: true,
        retentionDays: 30,
        details: {
          provider: 'aws',
          resources: {
            database: true,
            files: true,
            compute: false
          },
          location: 'aws/development/backup_development_2023_01_01T00_00_00_000Z'
        }
      }
    ];
    
    writeFileSync(join(testDir, '.mcpm-backups.json'), JSON.stringify(backupInfo));
    
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
          backup: 'backup_development_2023_01_01T00_00_00_000Z',
          confirm: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    restoreCommand(mockProgram, true);
    
    // Verify restore operation
    expect(consoleOutput.some(line => line.includes('Restoring MCP Server from Backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Selected backup: backup_development_2023_01_01T00_00_00_000Z'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Executing AWS restore'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Restoring RDS from snapshot'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Restoring S3 bucket data'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Successfully restored from backup'))).toBeTruthy();
  });
  
  it('should use the latest backup when --latest flag is used', async () => {
    // Create a package.json with GCP deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:gcp': 'echo "GCP deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create a mock backup information file with multiple backups
    const backupInfo = [
      {
        name: 'backup_development_2023_02_01T00_00_00_000Z',
        description: 'Newer backup',
        timestamp: '2023-02-01T00:00:00.000Z',
        environment: 'development',
        cloudProvider: 'gcp',
        fullBackup: false,
        includeDatabase: true,
        includeFiles: true,
        retentionDays: 30,
        details: {
          provider: 'gcp',
          resources: {
            database: true,
            files: true,
            compute: false
          }
        }
      },
      {
        name: 'backup_development_2023_01_01T00_00_00_000Z',
        description: 'Older backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'development',
        cloudProvider: 'gcp',
        fullBackup: false,
        includeDatabase: true,
        includeFiles: true,
        retentionDays: 30,
        details: {
          provider: 'gcp',
          resources: {
            database: true,
            files: true,
            compute: false
          }
        }
      }
    ];
    
    writeFileSync(join(testDir, '.mcpm-backups.json'), JSON.stringify(backupInfo));
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with latest flag
        fn({
          path: testDir,
          cloud: 'gcp',
          environment: 'development',
          latest: true,
          confirm: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    restoreCommand(mockProgram, true);
    
    // Verify it used the newest backup
    expect(consoleOutput.some(line => line.includes('Using latest backup:'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('backup_development_2023_02_01T00_00_00_000Z'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Executing GCP restore'))).toBeTruthy();
  });
  
  it('should use custom restore script if available', async () => {
    // Create a package.json with custom restore script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:azure': 'echo "Azure deploy"',
        'restore:azure': 'echo "Custom Azure restore"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create a mock backup information file
    const backupInfo = [
      {
        name: 'backup_production_2023_01_01T00_00_00_000Z',
        description: 'Production backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'production',
        cloudProvider: 'azure',
        fullBackup: true,
        includeDatabase: true,
        includeFiles: true,
        retentionDays: 30,
        details: {
          provider: 'azure',
          resources: {
            database: true,
            files: true,
            compute: true
          }
        }
      }
    ];
    
    writeFileSync(join(testDir, '.mcpm-backups.json'), JSON.stringify(backupInfo));
    
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
          environment: 'production',
          backup: 'backup_production_2023_01_01T00_00_00_000Z',
          confirm: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    restoreCommand(mockProgram, true);
    
    // Verify custom restore script execution
    expect(consoleOutput.some(line => line.includes('Executing restore script for azure'))).toBeTruthy();
    
    // Verify that the execSync method was called with the right command
    const { execSync } = require('child_process');
    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('restore:azure'),
      expect.any(Object)
    );
  });
  
  it('should handle selective restore with database-only option', async () => {
    // Create a package.json with Alibaba deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:alibaba': 'echo "Alibaba deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create a mock backup information file
    const backupInfo = [
      {
        name: 'backup_staging_2023_01_01T00_00_00_000Z',
        description: 'Staging backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'staging',
        cloudProvider: 'alibaba',
        fullBackup: false,
        includeDatabase: true,
        includeFiles: true,
        retentionDays: 30,
        details: {
          provider: 'alibaba',
          resources: {
            database: true,
            files: true,
            compute: false
          }
        }
      }
    ];
    
    writeFileSync(join(testDir, '.mcpm-backups.json'), JSON.stringify(backupInfo));
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with database-only option
        fn({
          path: testDir,
          cloud: 'alibaba',
          environment: 'staging',
          backup: 'backup_staging_2023_01_01T00_00_00_000Z',
          databaseOnly: true,
          confirm: true
        });
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    restoreCommand(mockProgram, true);
    
    // Verify selective restore
    expect(consoleOutput.some(line => line.includes('Executing Alibaba Cloud restore'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Restoring ApsaraDB from backup'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('Restoring OSS data'))).toBeFalsy();
    expect(consoleOutput.some(line => line.includes('Database: Yes'))).toBeTruthy();
    expect(consoleOutput.some(line => line.includes('File Storage: No'))).toBeTruthy();
  });
  
  it('should handle error when specified backup does not exist', async () => {
    // Create a package.json with AWS deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:aws': 'echo "AWS deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create a mock backup information file
    const backupInfo = [
      {
        name: 'backup_development_2023_01_01T00_00_00_000Z',
        description: 'Test backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'development',
        cloudProvider: 'aws',
        fullBackup: false,
        includeDatabase: true,
        includeFiles: true,
        retentionDays: 30,
        details: {}
      }
    ];
    
    writeFileSync(join(testDir, '.mcpm-backups.json'), JSON.stringify(backupInfo));
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action with non-existent backup name
        try {
          fn({
            path: testDir,
            cloud: 'aws',
            environment: 'development',
            backup: 'non_existent_backup',
            confirm: true
          });
        } catch (error: any) {
          // This is expected in testing mode
          expect(error.message).toContain('Backup "non_existent_backup" not found');
        }
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    restoreCommand(mockProgram, true);
    
    // Verify error message
    expect(consoleOutput.some(line => line.includes('Backup "non_existent_backup" not found'))).toBeTruthy();
  });
  
  it('should handle error when no backups exist for specified environment', async () => {
    // Create a package.json with AWS deployment script
    const packageJson = {
      name: 'test-server',
      version: '1.0.0',
      scripts: {
        'deploy:aws': 'echo "AWS deploy"'
      }
    };
    
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));
    
    // Create a mock backup information file with only production backups
    const backupInfo = [
      {
        name: 'backup_production_2023_01_01T00_00_00_000Z',
        description: 'Production backup',
        timestamp: '2023-01-01T00:00:00.000Z',
        environment: 'production',
        cloudProvider: 'aws',
        fullBackup: false,
        includeDatabase: true,
        includeFiles: true,
        retentionDays: 30,
        details: {}
      }
    ];
    
    writeFileSync(join(testDir, '.mcpm-backups.json'), JSON.stringify(backupInfo));
    
    // Create a mock Commander program
    const mockProgram = {
      command: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        // Call the action for development environment which has no backups
        try {
          fn({
            path: testDir,
            cloud: 'aws',
            environment: 'development',
            confirm: true
          });
        } catch (error: any) {
          // This is expected in testing mode
          expect(error.message).toContain('No backups found for aws in development environment');
        }
        return mockProgram;
      })
    } as unknown as Command;
    
    // Initialize the command with testing flag
    restoreCommand(mockProgram, true);
    
    // Verify error message
    expect(consoleOutput.some(line => line.includes('No backups found for aws in development environment'))).toBeTruthy();
  });
}); 