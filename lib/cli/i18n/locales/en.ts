import { Messages } from '../index';

const messages: Messages = {
  common: {
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    success: 'Success',
    confirm: 'Confirm',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    notFound: 'Not found',
    invalidInput: 'Invalid input',
    retry: 'Retry',
    exit: 'Exit',
    help: 'Help',
    version: 'Version'
  },
  cli: {
    welcome: 'Welcome to MCPM CLI',
    goodbye: 'Thank you for using MCPM CLI',
    helpText: 'Run with --help for usage information',
    exampleHeader: 'Examples',
    documentationHeader: 'Documentation'
  },
  commands: {
    scaffold: {
      creating: 'Creating new MCP server project',
      created: 'MCP server project created successfully',
      error: 'Error creating MCP server project',
      templateNotFound: 'Template not found',
      confirmOverwrite: 'Directory already exists. Overwrite?',
      scaffoldOptions: 'Scaffold options'
    },
    deploy: {
      deploying: 'Deploying MCP server',
      deployed: 'MCP server deployed successfully',
      error: 'Error deploying MCP server',
      confirmDeploy: 'Deploy to {0} environment?',
      deployOptions: 'Deploy options',
      preparingDeploy: 'Preparing deployment',
      checkingEnv: 'Checking environment variables',
      uploadingFiles: 'Uploading files',
      configuringServer: 'Configuring server',
      startingServer: 'Starting server'
    },
    status: {
      checking: 'Checking MCP server status',
      online: 'MCP server is online',
      offline: 'MCP server is offline',
      error: 'Error checking server status',
      statusOptions: 'Status options',
      checkingConnection: 'Checking connection',
      resourceStatus: 'Resource status',
      healthStatus: 'Health status'
    },
    logs: {
      fetching: 'Fetching MCP server logs',
      error: 'Error fetching logs',
      noLogs: 'No logs found',
      logsOptions: 'Logs options',
      filtering: 'Filtering logs',
      streamingLogs: 'Streaming logs'
    },
    update: {
      checking: 'Checking for updates',
      updating: 'Updating MCP server',
      updated: 'MCP server updated successfully',
      noUpdates: 'No updates available',
      error: 'Error updating MCP server',
      confirmUpdate: 'Update MCP server to version {0}?',
      updateOptions: 'Update options',
      preparingUpdate: 'Preparing update',
      backingUp: 'Creating backup',
      downloadingUpdate: 'Downloading update',
      applyingUpdate: 'Applying update',
      testingUpdate: 'Testing update',
      rollingBack: 'Rolling back update'
    },
    backup: {
      creating: 'Creating MCP server backup',
      created: 'MCP server backup created successfully',
      error: 'Error creating backup',
      confirmBackup: 'Create backup of {0} environment?',
      backupOptions: 'Backup options',
      preparingBackup: 'Preparing backup',
      savingDatabase: 'Saving database',
      savingFiles: 'Saving files',
      compressing: 'Compressing backup',
      uploading: 'Uploading backup',
      cleaningUp: 'Cleaning up'
    },
    restore: {
      restoring: 'Restoring MCP server from backup',
      restored: 'MCP server restored successfully',
      error: 'Error restoring from backup',
      confirmRestore: 'Restore from backup {0}?',
      restoreOptions: 'Restore options',
      preparingRestore: 'Preparing to restore',
      downloadingBackup: 'Downloading backup',
      extractingBackup: 'Extracting backup',
      restoringDatabase: 'Restoring database',
      restoringFiles: 'Restoring files',
      finishingRestore: 'Finishing restore'
    },
    language: {
      description: 'Change the CLI language settings',
      listOption: 'List available languages',
      setOption: 'Set CLI language (en, zh-CN, zh-TW, ja, ko)',
      currentOption: 'Show current language setting',
      availableLanguages: 'Available languages:',
      current: 'current',
      currentLanguage: 'Current language:',
      languageChanged: 'Language changed to: {0}',
      restartRequired: 'Changes will take effect after restarting the CLI',
      setError: 'Failed to set language: {0}',
      availableOptions: 'Available language options:',
      commandTitle: 'Language command:',
      operationError: 'Language operation failed: {0}'
    }
  },
  errors: {
    missingRequiredOption: 'Missing required option: {0}',
    invalidOption: 'Invalid option: {0}',
    fileNotFound: 'File not found: {0}',
    directoryNotFound: 'Directory not found: {0}',
    permissionDenied: 'Permission denied: {0}',
    networkError: 'Network error: {0}',
    timeoutError: 'Timeout error: {0}',
    unknownError: 'Unknown error occurred',
    environmentVariableMissing: 'Missing environment variable: {0}',
    configError: 'Configuration error: {0}',
    validationError: 'Validation error: {0}',
    cloudProviderError: 'Cloud provider error: {0}'
  },
  clouds: {
    aws: {
      name: 'Amazon Web Services',
      missingCredentials: 'Missing AWS credentials',
      deployingLambda: 'Deploying Lambda function',
      deployingECS: 'Deploying ECS service',
      configuringRDS: 'Configuring RDS database',
      configuringS3: 'Configuring S3 bucket',
      configuringRoute53: 'Configuring Route 53'
    },
    gcp: {
      name: 'Google Cloud Platform',
      missingCredentials: 'Missing GCP credentials',
      deployingCloudRun: 'Deploying Cloud Run service',
      deployingGKE: 'Deploying to GKE',
      configuringCloudSQL: 'Configuring Cloud SQL database',
      configuringCloudStorage: 'Configuring Cloud Storage',
      configuringCloudDNS: 'Configuring Cloud DNS'
    },
    azure: {
      name: 'Microsoft Azure',
      missingCredentials: 'Missing Azure credentials',
      deployingAppService: 'Deploying App Service',
      deployingAKS: 'Deploying to AKS',
      configuringAzureSQL: 'Configuring Azure SQL database',
      configuringBlobStorage: 'Configuring Blob Storage',
      configuringAzureDNS: 'Configuring Azure DNS'
    },
    alibaba: {
      name: 'Alibaba Cloud',
      missingCredentials: 'Missing Alibaba Cloud credentials',
      deployingECS: 'Deploying ECS instance',
      deployingACK: 'Deploying to ACK',
      configuringRDS: 'Configuring ApsaraDB RDS',
      configuringOSS: 'Configuring OSS bucket',
      configuringDNS: 'Configuring Alibaba Cloud DNS'
    }
  }
};

export = messages; 