import { 
  validateAWSEnvironment, 
  validateGCPEnvironment, 
  validateAzureEnvironment, 
  validateAlibabaEnvironment,
  validateCloudEnvironment,
  getSetupInstructions
} from '../../../lib/cli/commands/env-validator';

// Store original env
const originalEnv = { ...process.env };

describe('Environment Variable Validators', () => {
  // Reset env after each test
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('validateAWSEnvironment', () => {
    test('returns valid=true when all required AWS variables are set', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.AWS_REGION = 'us-east-1';

      const result = validateAWSEnvironment();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('returns valid=false when some AWS variables are missing', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      // Missing AWS_SECRET_ACCESS_KEY and AWS_REGION

      const result = validateAWSEnvironment();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('AWS_SECRET_ACCESS_KEY');
      expect(result.missing).toContain('AWS_REGION');
    });
  });

  describe('validateGCPEnvironment', () => {
    test('returns valid=true when all required GCP variables are set', () => {
      process.env.GOOGLE_PROJECT_ID = 'test-project';
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';

      const result = validateGCPEnvironment();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('returns valid=false when some GCP variables are missing', () => {
      // Missing all GCP variables
      const result = validateGCPEnvironment();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('GOOGLE_PROJECT_ID');
      expect(result.missing).toContain('GOOGLE_APPLICATION_CREDENTIALS');
    });
  });

  describe('validateAzureEnvironment', () => {
    test('returns valid=true when all required Azure variables are set', () => {
      process.env.AZURE_TENANT_ID = 'test-tenant';
      process.env.AZURE_SUBSCRIPTION_ID = 'test-subscription';
      process.env.AZURE_CLIENT_ID = 'test-client';
      process.env.AZURE_CLIENT_SECRET = 'test-secret';

      const result = validateAzureEnvironment();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('returns valid=false when some Azure variables are missing', () => {
      process.env.AZURE_TENANT_ID = 'test-tenant';
      // Missing other Azure variables

      const result = validateAzureEnvironment();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('AZURE_SUBSCRIPTION_ID');
      expect(result.missing).toContain('AZURE_CLIENT_ID');
      expect(result.missing).toContain('AZURE_CLIENT_SECRET');
    });
  });

  describe('validateAlibabaEnvironment', () => {
    test('returns valid=true when all required Alibaba variables are set', () => {
      process.env.ALIBABA_ACCESS_KEY_ID = 'test-key';
      process.env.ALIBABA_ACCESS_KEY_SECRET = 'test-secret';
      process.env.ALIBABA_REGION = 'cn-hangzhou';

      const result = validateAlibabaEnvironment();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('returns valid=false when some Alibaba variables are missing', () => {
      process.env.ALIBABA_ACCESS_KEY_ID = 'test-key';
      // Missing other Alibaba variables

      const result = validateAlibabaEnvironment();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('ALIBABA_ACCESS_KEY_SECRET');
      expect(result.missing).toContain('ALIBABA_REGION');
    });
  });

  describe('validateCloudEnvironment', () => {
    test('calls the correct validator based on cloud provider', () => {
      process.env.AWS_ACCESS_KEY_ID = 'test-key';
      process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
      process.env.AWS_REGION = 'us-east-1';

      const awsResult = validateCloudEnvironment('aws');
      expect(awsResult.valid).toBe(true);

      const gcpResult = validateCloudEnvironment('gcp');
      expect(gcpResult.valid).toBe(false);

      // Test unknown provider returns valid=true
      const unknownResult = validateCloudEnvironment('unknown');
      expect(unknownResult.valid).toBe(true);
    });
  });

  describe('getSetupInstructions', () => {
    test('returns empty string when no missing variables', () => {
      const result = getSetupInstructions('aws', []);
      expect(result).toBe('');
    });

    test('returns instructions for AWS missing variables', () => {
      const missingVars = ['AWS_ACCESS_KEY_ID', 'AWS_REGION'];
      const result = getSetupInstructions('aws', missingVars);
      
      expect(result).toContain('Missing environment variables for AWS deployment');
      expect(result).toContain('AWS_ACCESS_KEY_ID');
      expect(result).toContain('AWS_REGION');
    });

    test('returns instructions for unknown provider', () => {
      const missingVars = ['UNKNOWN_VAR'];
      const result = getSetupInstructions('unknown', missingVars);
      
      expect(result).toContain('Missing environment variables for UNKNOWN deployment');
      expect(result).toContain('UNKNOWN_VAR');
    });
  });
}); 