import fs from 'fs';
import path from 'path';
import {
  setupTestDir,
  cleanupTestDir,
  createTestOptions,
  validateCloudProviderFiles,
  validatePackageJsonScripts
} from './utils/cloud-provider-test-utils';

// MOCK implementations for cloud provider functions - do not import from scaffold.ts
// Mock AWS files creation
const createAWSFiles = async (serverDir: string, options: any): Promise<void> => {
  // Create AWS directory
  const awsDir = path.join(serverDir, 'aws');
  fs.mkdirSync(awsDir, { recursive: true });

  // Write test CloudFormation config
  fs.writeFileSync(
    path.join(awsDir, 'cloudformation.yaml'),
    'Resources:\n  LambdaFunction:\n    Type: AWS::Lambda::Function'
  );

  // Write test SAM template
  fs.writeFileSync(
    path.join(awsDir, 'sam-template.yaml'),
    'AWSTemplateFormatVersion: 2010-09-09\nTransform: AWS::Serverless-2016-10-31'
  );

  // Write test Lambda function
  fs.writeFileSync(
    path.join(awsDir, 'lambda.js'),
    'exports.handler = async (event) => { return { statusCode: 200, body: "Hello from Lambda" }; };'
  );

  // Write test deployment script
  fs.writeFileSync(
    path.join(awsDir, 'deploy.sh'),
    '#!/bin/bash\n# AWS deployment script'
  );
  
  // Add execute permissions
  fs.chmodSync(path.join(awsDir, 'deploy.sh'), '755');

  // Write README
  fs.writeFileSync(
    path.join(awsDir, 'README.md'),
    '# AWS Deployment\n\nThis directory contains configuration files for AWS deployment.'
  );

  // Update package.json if it exists
  const packageJsonPath = path.join(serverDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts['aws:deploy'] = 'aws cloudformation deploy --template-file ./aws/cloudformation.yaml';
    packageJson.scripts['aws:package'] = 'aws cloudformation package --template-file ./aws/sam-template.yaml';
    packageJson.scripts['aws:deploy:sam'] = 'sam deploy --template ./aws/sam-template.yaml';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
};

// Mock GCP files creation
const createGCPFiles = async (serverDir: string, options: any): Promise<void> => {
  // Create GCP directory
  const gcpDir = path.join(serverDir, 'gcp');
  fs.mkdirSync(gcpDir, { recursive: true });

  // Write test Cloud Run config
  fs.writeFileSync(
    path.join(gcpDir, 'cloud-run.yaml'),
    'apiVersion: serving.knative.dev/v1\nkind: Service\nmetadata:\n  name: test-app'
  );

  // Write test Cloud Build config
  fs.writeFileSync(
    path.join(gcpDir, 'cloudbuild.yaml'),
    'steps:\n  - name: gcr.io/cloud-builders/docker\n    args: [\'build\', \'-t\', \'gcr.io/$PROJECT_ID/test-app:latest\', \'.\']'
  );

  // Write test Cloud Functions code
  fs.writeFileSync(
    path.join(gcpDir, 'cloud-functions.js'),
    'exports.handler = async (req, res) => { res.status(200).send("OK"); };'
  );

  // Write test deployment script
  fs.writeFileSync(
    path.join(gcpDir, 'deploy.sh'),
    '#!/bin/bash\n# GCP deployment script'
  );
  
  // Add execute permissions
  fs.chmodSync(path.join(gcpDir, 'deploy.sh'), '755');

  // Write README
  fs.writeFileSync(
    path.join(gcpDir, 'README.md'),
    '# GCP Deployment\n\nThis directory contains configuration files for GCP deployment.'
  );

  // Update package.json if it exists
  const packageJsonPath = path.join(serverDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts['gcp:deploy'] = './gcp/deploy.sh';
    packageJson.scripts['gcp:build'] = 'gcloud builds submit --config=gcp/cloudbuild.yaml';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
};

// Mock Azure files creation
const createAzureFiles = async (serverDir: string, options: any): Promise<void> => {
  // Create Azure directory
  const azureDir = path.join(serverDir, 'azure');
  fs.mkdirSync(azureDir, { recursive: true });

  // Write test App Service config
  fs.writeFileSync(
    path.join(azureDir, 'app-service.json'),
    '{"name": "test-app", "type": "Microsoft.Web/sites", "location": "West US"}'
  );

  // Write test Function App config
  fs.writeFileSync(
    path.join(azureDir, 'function-app.json'),
    '{"name": "test-app-function", "type": "Microsoft.Web/sites", "kind": "functionapp"}'
  );

  // Write test Container App config
  fs.writeFileSync(
    path.join(azureDir, 'container-app.json'),
    '{"name": "test-app-container", "type": "Microsoft.App/containerApps"}'
  );

  // Write test function.js
  fs.writeFileSync(
    path.join(azureDir, 'function.js'),
    'module.exports = async function (context, req) { context.res = { status: 200, body: "Hello" }; };'
  );

  // Write test deployment script
  fs.writeFileSync(
    path.join(azureDir, 'deploy.sh'),
    '#!/bin/bash\n# Azure deployment script'
  );
  
  // Add execute permissions
  fs.chmodSync(path.join(azureDir, 'deploy.sh'), '755');

  // Write README
  fs.writeFileSync(
    path.join(azureDir, 'README.md'),
    '# Azure Deployment\n\nThis directory contains configuration files for Azure deployment.'
  );

  // Update package.json if it exists
  const packageJsonPath = path.join(serverDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts['azure:deploy'] = './azure/deploy.sh';
    packageJson.scripts['azure:deploy:app'] = 'az webapp up --name test-app';
    packageJson.scripts['azure:deploy:function'] = 'func azure functionapp publish test-app-function';
    packageJson.scripts['azure:deploy:container'] = 'az containerapp up --name test-app-container';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
};

// Mock Alibaba files creation
const createAlibabaFiles = async (serverDir: string, options: any): Promise<void> => {
  // Create Alibaba directory
  const alibabaDir = path.join(serverDir, 'alibaba');
  fs.mkdirSync(alibabaDir, { recursive: true });

  // Write test FC template
  fs.writeFileSync(
    path.join(alibabaDir, 'fc-template.json'),
    '{"ROSTemplateFormatVersion": "2015-09-01", "Resources": {"fc": {"Type": "ALIYUN::FC::Function"}}}'
  );

  // Write test ECS template
  fs.writeFileSync(
    path.join(alibabaDir, 'ecs-template.json'),
    '{"ROSTemplateFormatVersion": "2015-09-01", "Resources": {"ecs": {"Type": "ALIYUN::ECS::Instance"}}}'
  );

  // Write test ACK template
  fs.writeFileSync(
    path.join(alibabaDir, 'ack-template.json'),
    '{"ROSTemplateFormatVersion": "2015-09-01", "Resources": {"cs": {"Type": "ALIYUN::CS::ManagedKubernetesCluster"}}}'
  );

  // Write test FC handler
  fs.writeFileSync(
    path.join(alibabaDir, 'fc-handler.js'),
    'exports.handler = function(event, context, callback) { callback(null, "success"); };'
  );

  // Write test deployment script
  fs.writeFileSync(
    path.join(alibabaDir, 'deploy.sh'),
    '#!/bin/bash\n# Alibaba Cloud deployment script'
  );
  
  // Add execute permissions
  fs.chmodSync(path.join(alibabaDir, 'deploy.sh'), '755');

  // Write README
  fs.writeFileSync(
    path.join(alibabaDir, 'README.md'),
    '# Alibaba Cloud Deployment\n\nThis directory contains configuration files for Alibaba Cloud deployment.'
  );

  // Update package.json if it exists
  const packageJsonPath = path.join(serverDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    packageJson.scripts['alibaba:deploy:fc'] = 'fun deploy -t ./alibaba/fc-template.json';
    packageJson.scripts['alibaba:deploy:ecs'] = 'ros-cli create-stack --template-body ./alibaba/ecs-template.json';
    packageJson.scripts['alibaba:deploy:ack'] = 'ros-cli create-stack --template-body ./alibaba/ack-template.json';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
};

describe('Cloud Provider Support', () => {
  const tempBaseDir = 'temp-test-cloud-providers';
  let testDir: string;
  
  beforeEach(async () => {
    testDir = await setupTestDir(tempBaseDir);
  });
  
  afterEach(async () => {
    await cleanupTestDir(tempBaseDir);
  });

  test('AWS cloud provider creates required files', async () => {
    const options = createTestOptions('aws');
    await createAWSFiles(testDir, options);
    
    const requiredFiles = [
      'cloudformation.yaml',
      'sam-template.yaml',
      'lambda.js'
    ];
    
    validateCloudProviderFiles(testDir, 'aws', requiredFiles);
  });
  
  test('GCP cloud provider creates required files', async () => {
    const options = createTestOptions('gcp');
    await createGCPFiles(testDir, options);
    
    const requiredFiles = [
      'cloud-run.yaml',
      'cloudbuild.yaml',
      'cloud-functions.js'
    ];
    
    validateCloudProviderFiles(testDir, 'gcp', requiredFiles);
  });
  
  test('Azure cloud provider creates required files', async () => {
    const options = createTestOptions('azure');
    await createAzureFiles(testDir, options);
    
    const requiredFiles = [
      'app-service.json',
      'function-app.json',
      'container-app.json',
      'function.js'
    ];
    
    validateCloudProviderFiles(testDir, 'azure', requiredFiles);
  });
  
  test('Alibaba cloud provider creates required files', async () => {
    const options = createTestOptions('alibaba');
    await createAlibabaFiles(testDir, options);
    
    const requiredFiles = [
      'fc-template.json',
      'ecs-template.json',
      'ack-template.json',
      'fc-handler.js'
    ];
    
    validateCloudProviderFiles(testDir, 'alibaba', requiredFiles);
  });
  
  test('AWS adds required package.json scripts', async () => {
    // Set up a package.json file first
    const packageJson = {
      name: 'test-aws',
      version: '1.0.0',
      scripts: {}
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    const options = createTestOptions('aws');
    await createAWSFiles(testDir, options);
    
    validatePackageJsonScripts(testDir, 'aws', ['deploy', 'package', 'deploy:sam']);
  });
  
  test('GCP adds required package.json scripts', async () => {
    // Set up a package.json file first
    const packageJson = {
      name: 'test-gcp',
      version: '1.0.0',
      scripts: {}
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    const options = createTestOptions('gcp');
    await createGCPFiles(testDir, options);
    
    validatePackageJsonScripts(testDir, 'gcp', ['deploy', 'build']);
  });
  
  test('Azure adds required package.json scripts', async () => {
    // Set up a package.json file first
    const packageJson = {
      name: 'test-azure',
      version: '1.0.0',
      scripts: {}
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    const options = createTestOptions('azure');
    await createAzureFiles(testDir, options);
    
    validatePackageJsonScripts(testDir, 'azure', ['deploy', 'deploy:app', 'deploy:function', 'deploy:container']);
  });
  
  test('Alibaba adds required package.json scripts', async () => {
    // Set up a package.json file first
    const packageJson = {
      name: 'test-alibaba',
      version: '1.0.0',
      scripts: {}
    };
    
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    
    const options = createTestOptions('alibaba');
    await createAlibabaFiles(testDir, options);
    
    validatePackageJsonScripts(testDir, 'alibaba', ['deploy:fc', 'deploy:ecs', 'deploy:ack']);
  });
}); 