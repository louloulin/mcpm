/**
 * Environment variable validation for cloud provider deployments
 * Validates that all required environment variables are set for a given cloud provider
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  missing: string[];
}

/**
 * Validates AWS environment variables
 * 
 * Required variables:
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION
 */
export function validateAWSEnvironment(): ValidationResult {
  const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validates GCP environment variables
 * 
 * Required variables:
 * - GOOGLE_PROJECT_ID
 * - GOOGLE_APPLICATION_CREDENTIALS
 */
export function validateGCPEnvironment(): ValidationResult {
  const requiredVars = ['GOOGLE_PROJECT_ID', 'GOOGLE_APPLICATION_CREDENTIALS'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validates Azure environment variables
 * 
 * Required variables:
 * - AZURE_SUBSCRIPTION_ID
 * - AZURE_TENANT_ID
 * - AZURE_CLIENT_ID
 * - AZURE_CLIENT_SECRET
 */
export function validateAzureEnvironment(): ValidationResult {
  const requiredVars = [
    'AZURE_SUBSCRIPTION_ID',
    'AZURE_TENANT_ID',
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET'
  ];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validates Alibaba Cloud environment variables
 * 
 * Required variables:
 * - ALIBABA_ACCESS_KEY_ID
 * - ALIBABA_ACCESS_KEY_SECRET
 * - ALIBABA_REGION
 */
export function validateAlibabaEnvironment(): ValidationResult {
  const requiredVars = [
    'ALIBABA_ACCESS_KEY_ID',
    'ALIBABA_ACCESS_KEY_SECRET',
    'ALIBABA_REGION'
  ];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Validates environment variables for the specified cloud provider
 * 
 * @param cloudProvider The cloud provider to validate
 * @returns Validation result
 */
export function validateCloudEnvironment(cloudProvider: string): ValidationResult {
  switch (cloudProvider.toLowerCase()) {
    case 'aws':
      return validateAWSEnvironment();
    case 'gcp':
      return validateGCPEnvironment();
    case 'azure':
      return validateAzureEnvironment();
    case 'alibaba':
      return validateAlibabaEnvironment();
    default:
      return {
        valid: true,
        missing: []
      };
  }
}

/**
 * Gets setup instructions for missing environment variables
 * 
 * @param cloudProvider The cloud provider
 * @param missingVars Array of missing environment variable names
 * @returns Instructions string
 */
export function getSetupInstructions(cloudProvider: string, missingVars: string[]): string {
  if (missingVars.length === 0) {
    return '';
  }
  
  let instructions = `Missing environment variables for ${cloudProvider.toUpperCase()} deployment:\n`;
  
  // Add each missing variable to the instructions
  missingVars.forEach(variable => {
    instructions += `  - ${variable}\n`;
  });
  
  // Add provider-specific setup instructions
  switch (cloudProvider.toLowerCase()) {
    case 'aws':
      instructions += `\nTo set up AWS credentials:\n`;
      instructions += `1. Create an IAM user with appropriate permissions\n`;
      instructions += `2. Set the environment variables:\n`;
      instructions += `   export AWS_ACCESS_KEY_ID=your_access_key\n`;
      instructions += `   export AWS_SECRET_ACCESS_KEY=your_secret_key\n`;
      instructions += `   export AWS_REGION=your_preferred_region\n`;
      break;
    case 'gcp':
      instructions += `\nTo set up GCP credentials:\n`;
      instructions += `1. Create a service account and download the JSON key file\n`;
      instructions += `2. Set the environment variables:\n`;
      instructions += `   export GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json\n`;
      instructions += `   export GOOGLE_PROJECT_ID=your_project_id\n`;
      break;
    case 'azure':
      instructions += `\nTo set up Azure credentials:\n`;
      instructions += `1. Create a service principal with appropriate permissions\n`;
      instructions += `2. Set the environment variables:\n`;
      instructions += `   export AZURE_SUBSCRIPTION_ID=your_subscription_id\n`;
      instructions += `   export AZURE_TENANT_ID=your_tenant_id\n`;
      instructions += `   export AZURE_CLIENT_ID=your_client_id\n`;
      instructions += `   export AZURE_CLIENT_SECRET=your_client_secret\n`;
      break;
    case 'alibaba':
      instructions += `\nTo set up Alibaba Cloud credentials:\n`;
      instructions += `1. Create an AccessKey in the Alibaba Cloud console\n`;
      instructions += `2. Set the environment variables:\n`;
      instructions += `   export ALIBABA_ACCESS_KEY_ID=your_access_key_id\n`;
      instructions += `   export ALIBABA_ACCESS_KEY_SECRET=your_access_key_secret\n`;
      instructions += `   export ALIBABA_REGION=your_region\n`;
      break;
    default:
      instructions += `\nUnknown cloud provider: ${cloudProvider}\n`;
  }
  
  return instructions;
} 