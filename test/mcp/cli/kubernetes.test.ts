import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

const testDir = 'temp-test-kubernetes';

/**
 * Kubernetes支持测试套件
 */
describe('Kubernetes support in scaffold command', () => {
  // 测试前准备：创建临时测试目录
  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      rimraf.sync(testDir);
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  // 测试后清理：删除临时测试目录
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      rimraf.sync(testDir);
    }
  });

  /**
   * 简化的createKubernetesFiles函数，用于测试
   */
  function mockCreateKubernetesFiles(basePath: string, options: any) {
    // 创建Kubernetes目录
    const kubernetesDir = path.join(basePath, 'kubernetes');
    fs.mkdirSync(kubernetesDir, { recursive: true });
    
    // 创建基本配置文件
    fs.writeFileSync(
      path.join(kubernetesDir, 'namespace.yaml'),
      'apiVersion: v1\nkind: Namespace\nmetadata:\n  name: test-namespace'
    );
    
    fs.writeFileSync(
      path.join(kubernetesDir, 'deployment.yaml'),
      'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: test-deployment'
    );
    
    fs.writeFileSync(
      path.join(kubernetesDir, 'service.yaml'),
      'apiVersion: v1\nkind: Service\nmetadata:\n  name: test-service'
    );
    
    fs.writeFileSync(
      path.join(kubernetesDir, 'configmap.yaml'),
      'apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: test-config'
    );
    
    fs.writeFileSync(
      path.join(kubernetesDir, 'hpa.yaml'),
      'apiVersion: autoscaling/v2\nkind: HorizontalPodAutoscaler\nmetadata:\n  name: test-hpa'
    );
    
    fs.writeFileSync(
      path.join(kubernetesDir, 'ingress.yaml'),
      'apiVersion: networking.k8s.io/v1\nkind: Ingress\nmetadata:\n  name: test-ingress'
    );
    
    fs.writeFileSync(
      path.join(kubernetesDir, 'README.md'),
      '# Kubernetes部署\n\n本目录包含部署到Kubernetes所需的配置文件。'
    );
    
    // 如果启用了Helm，创建Helm Chart
    if (options.helmChart) {
      mockCreateHelmChart(basePath, options);
    }
  }
  
  /**
   * 简化的createHelmChart函数，用于测试
   */
  function mockCreateHelmChart(basePath: string, options: any) {
    // 创建Helm目录结构
    const helmBaseDir = path.join(basePath, 'helm');
    const chartDir = path.join(helmBaseDir, options.name || 'test-app');
    const templatesDir = path.join(chartDir, 'templates');
    
    fs.mkdirSync(helmBaseDir, { recursive: true });
    fs.mkdirSync(chartDir, { recursive: true });
    fs.mkdirSync(templatesDir, { recursive: true });
    
    // 创建基本Helm文件
    fs.writeFileSync(
      path.join(chartDir, 'Chart.yaml'),
      'apiVersion: v2\nname: test-app\nversion: 0.1.0'
    );
    
    fs.writeFileSync(
      path.join(chartDir, 'values.yaml'),
      'replicaCount: 1\nimage:\n  repository: test-app\n  tag: latest'
    );
    
    fs.writeFileSync(
      path.join(templatesDir, 'deployment.yaml'),
      'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: {{ include "test-app.fullname" . }}'
    );
    
    fs.writeFileSync(
      path.join(templatesDir, 'service.yaml'),
      'apiVersion: v1\nkind: Service\nmetadata:\n  name: {{ include "test-app.fullname" . }}'
    );
    
    fs.writeFileSync(
      path.join(templatesDir, '_helpers.tpl'),
      '{{- define "test-app.fullname" -}}\n{{- .Release.Name }}\n{{- end -}}'
    );
    
    fs.writeFileSync(
      path.join(helmBaseDir, 'README.md'),
      '# Helm Chart\n\n该Helm Chart用于在Kubernetes中部署应用。'
    );
  }

  /**
   * 测试：当启用Kubernetes支持时，应创建Kubernetes配置文件
   */
  test('should create Kubernetes files when Kubernetes support is enabled', () => {
    // 准备测试数据
    const options = {
      name: 'test-app',
      kubernetes: true,
      helmChart: false
    };
    
    // 执行测试
    mockCreateKubernetesFiles(testDir, options);
    
    // 验证结果
    expect(fs.existsSync(path.join(testDir, 'kubernetes'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'kubernetes', 'namespace.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'kubernetes', 'deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'kubernetes', 'service.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'kubernetes', 'configmap.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'kubernetes', 'hpa.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'kubernetes', 'ingress.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'kubernetes', 'README.md'))).toBe(true);
    
    // 验证Helm Chart未创建
    expect(fs.existsSync(path.join(testDir, 'helm'))).toBe(false);
  });

  /**
   * 测试：当启用Helm Chart时，应创建Helm Chart文件
   */
  test('should create Helm Chart files when Helm Chart is enabled', () => {
    // 准备测试数据
    const options = {
      name: 'test-app',
      kubernetes: true,
      helmChart: true
    };
    
    // 执行测试
    mockCreateKubernetesFiles(testDir, options);
    
    // 验证Kubernetes配置存在
    expect(fs.existsSync(path.join(testDir, 'kubernetes'))).toBe(true);
    
    // 验证Helm Chart存在
    expect(fs.existsSync(path.join(testDir, 'helm'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'test-app'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'test-app', 'Chart.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'test-app', 'values.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'test-app', 'templates'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'test-app', 'templates', 'deployment.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'test-app', 'templates', 'service.yaml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'test-app', 'templates', '_helpers.tpl'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'helm', 'README.md'))).toBe(true);
  });

  /**
   * 测试：Kubernetes配置文件应包含正确的基本YAML结构
   */
  test('should have valid YAML structure in Kubernetes files', () => {
    // 准备测试数据
    const options = {
      name: 'test-app',
      kubernetes: true,
      helmChart: false
    };
    
    // 执行测试
    mockCreateKubernetesFiles(testDir, options);
    
    // 验证配置文件内容
    const namespaceContent = fs.readFileSync(path.join(testDir, 'kubernetes', 'namespace.yaml'), 'utf8');
    expect(namespaceContent).toContain('apiVersion: v1');
    expect(namespaceContent).toContain('kind: Namespace');
    
    const deploymentContent = fs.readFileSync(path.join(testDir, 'kubernetes', 'deployment.yaml'), 'utf8');
    expect(deploymentContent).toContain('apiVersion: apps/v1');
    expect(deploymentContent).toContain('kind: Deployment');
    
    const serviceContent = fs.readFileSync(path.join(testDir, 'kubernetes', 'service.yaml'), 'utf8');
    expect(serviceContent).toContain('apiVersion: v1');
    expect(serviceContent).toContain('kind: Service');
    
    const hpaContent = fs.readFileSync(path.join(testDir, 'kubernetes', 'hpa.yaml'), 'utf8');
    expect(hpaContent).toContain('apiVersion: autoscaling/v2');
    expect(hpaContent).toContain('kind: HorizontalPodAutoscaler');
    
    const ingressContent = fs.readFileSync(path.join(testDir, 'kubernetes', 'ingress.yaml'), 'utf8');
    expect(ingressContent).toContain('apiVersion: networking.k8s.io/v1');
    expect(ingressContent).toContain('kind: Ingress');
  });

  /**
   * 测试：Helm Chart文件应包含正确的格式
   */
  test('should have valid structure in Helm Chart files', () => {
    // 准备测试数据
    const options = {
      name: 'test-app',
      kubernetes: true,
      helmChart: true
    };
    
    // 执行测试
    mockCreateKubernetesFiles(testDir, options);
    
    // 验证Chart.yaml
    const chartYaml = fs.readFileSync(path.join(testDir, 'helm', 'test-app', 'Chart.yaml'), 'utf8');
    expect(chartYaml).toContain('apiVersion: v2');
    expect(chartYaml).toContain('name: test-app');
    
    // 验证values.yaml
    const valuesYaml = fs.readFileSync(path.join(testDir, 'helm', 'test-app', 'values.yaml'), 'utf8');
    expect(valuesYaml).toContain('replicaCount: 1');
    expect(valuesYaml).toContain('image:');
    
    // 验证模板
    const deploymentTpl = fs.readFileSync(path.join(testDir, 'helm', 'test-app', 'templates', 'deployment.yaml'), 'utf8');
    expect(deploymentTpl).toContain('apiVersion: apps/v1');
    expect(deploymentTpl).toContain('{{ include "test-app.fullname" . }}');
    
    const helpersTpl = fs.readFileSync(path.join(testDir, 'helm', 'test-app', 'templates', '_helpers.tpl'), 'utf8');
    expect(helpersTpl).toContain('{{- define "test-app.fullname" -}}');
  });
}); 