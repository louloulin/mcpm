# Kubernetes和Helm Chart支持

MCP服务器脚手架工具提供了完整的Kubernetes配置生成和Helm Chart支持，使您可以轻松地将MCP服务器部署到Kubernetes集群中。

## Kubernetes支持

当启用Kubernetes支持时，脚手架会生成以下资源配置文件:

### 文件结构

```
kubernetes/
├── namespace.yaml       # 命名空间定义
├── deployment.yaml      # 部署配置
├── service.yaml         # 服务配置
├── configmap.yaml       # 配置映射
├── hpa.yaml             # 水平自动扩展配置
├── ingress.yaml         # 入口配置
└── README.md            # 部署文档
```

### 资源说明

#### Namespace

为应用创建一个专用的命名空间，隔离资源并简化管理:

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: your-app-namespace
  labels:
    app: your-app
    environment: development
```

#### Deployment

定义应用部署配置，包括副本数、容器镜像、资源限制和健康检查:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: your-app
  namespace: your-app-namespace
spec:
  replicas: 1
  selector:
    matchLabels:
      app: your-app
  template:
    metadata:
      labels:
        app: your-app
    spec:
      containers:
      - name: your-app
        image: your-app:latest
        ports:
        - containerPort: 3000
        resources:
          limits:
            cpu: "500m"
            memory: "512Mi"
          requests:
            cpu: "100m"
            memory: "128Mi"
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
```

#### Service

创建服务以暴露应用:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: your-app-service
  namespace: your-app-namespace
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
  selector:
    app: your-app
```

#### ConfigMap

将环境变量配置为ConfigMap:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: your-app-config
  namespace: your-app-namespace
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
```

#### HPA (水平自动扩展)

根据CPU使用率自动扩展应用实例:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: your-app-hpa
  namespace: your-app-namespace
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: your-app
  minReplicas: 1
  maxReplicas: 5
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80
```

#### Ingress

配置入口规则，通过域名访问应用:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: your-app-ingress
  namespace: your-app-namespace
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: your-app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: your-app-service
            port:
              number: 80
```

### 部署步骤

1. 构建Docker镜像:

```bash
npm run docker:build
```

2. 如果使用远程集群，将镜像推送到容器仓库:

```bash
docker tag your-app:latest your-registry/your-app:latest
docker push your-registry/your-app:latest
```

3. 更新镜像地址:
   如果使用远程镜像，编辑`kubernetes/deployment.yaml`文件，更新image字段为您的仓库地址。

4. 应用Kubernetes配置:

```bash
npm run k8s:apply
```

5. 验证部署状态:

```bash
kubectl get pods -n your-app-namespace
kubectl get services -n your-app-namespace
```

## Helm Chart支持

Helm Chart提供了更灵活的Kubernetes应用部署和管理方式。

### Chart结构

```
helm/
├── your-app/
│   ├── Chart.yaml         # Chart元数据
│   ├── values.yaml        # 默认配置值
│   └── templates/         # Kubernetes模板
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── configmap.yaml
│       ├── hpa.yaml
│       └── _helpers.tpl   # 辅助模板函数
└── README.md              # Helm使用文档
```

### values.yaml

`values.yaml`文件包含所有可配置的参数:

```yaml
# 默认配置值
replicaCount: 1

image:
  repository: your-app
  tag: latest
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80
  targetPort: 3000

ingress:
  enabled: true
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
  hosts:
    - host: your-app.example.com
      paths:
        - path: /
          pathType: Prefix
  tls: []

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: true
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80

env:
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: info
```

### 使用Helm Chart

1. 安装Chart:

```bash
npm run helm:install
```

或手动安装:

```bash
helm install your-app ./helm/your-app
```

2. 使用自定义配置值:

```bash
helm install your-app ./helm/your-app --values custom-values.yaml
```

3. 升级Chart:

```bash
npm run helm:upgrade
```

或手动升级:

```bash
helm upgrade your-app ./helm/your-app
```

4. 卸载Chart:

```bash
npm run helm:uninstall
```

或手动卸载:

```bash
helm uninstall your-app
```

### 自定义配置示例

以下是一些常见的自定义配置示例:

#### 生产环境配置

```yaml
# production-values.yaml
replicaCount: 3

image:
  repository: my-registry/your-app
  tag: v1.0.0
  pullPolicy: Always

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi

service:
  type: LoadBalancer

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: api.yourcompany.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
      hosts:
        - api.yourcompany.com

env:
  NODE_ENV: production
  LOG_LEVEL: info
  API_KEY: "${API_KEY}"
```

#### 开发环境配置

```yaml
# dev-values.yaml
replicaCount: 1

resources:
  limits:
    cpu: 300m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

autoscaling:
  enabled: false

env:
  NODE_ENV: development
  LOG_LEVEL: debug
```

## 最佳实践

### 资源配置优化

- 根据应用实际负载设置适当的资源请求和限制
- 针对生产环境增加副本数量以确保高可用性
- 为不同环境(开发、测试、生产)创建不同的values文件

### 安全最佳实践

- 使用Kubernetes Secrets存储敏感信息，避免直接在配置中硬编码
- 为生产环境配置TLS证书
- 实施网络策略限制Pod通信

### 监控和日志

- 配置适当的存活探针和就绪探针
- 集成Prometheus监控
- 配置日志收集(如ELK、Loki)

### 持久化数据

如需持久化数据，添加以下资源:

```yaml
# PersistentVolumeClaim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: your-app-data
  namespace: your-app-namespace
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

然后在部署中挂载:

```yaml
volumeMounts:
- name: data-volume
  mountPath: /app/data
volumes:
- name: data-volume
  persistentVolumeClaim:
    claimName: your-app-data
```

## 故障排除

### 常见问题

1. **镜像拉取失败**
   - 检查镜像名称和标签是否正确
   - 确认私有仓库的访问凭证配置

2. **Pod启动失败**
   - 检查资源限制是否合理
   - 验证存活探针和就绪探针配置

3. **服务无法访问**
   - 确认服务选择器与Pod标签匹配
   - 检查服务和入口配置

### 诊断命令

```bash
# 查看Pod状态和详情
kubectl describe pod <pod-name> -n your-app-namespace

# 查看Pod日志
kubectl logs <pod-name> -n your-app-namespace

# 检查服务端点
kubectl get endpoints -n your-app-namespace

# 检查Ingress状态
kubectl describe ingress <ingress-name> -n your-app-namespace

# 检查Helm发布状态
helm status your-app
```

## 示例：多环境部署

以下是使用Helm实现多环境部署的示例:

```bash
# 开发环境
helm install your-app-dev ./helm/your-app --values dev-values.yaml --namespace dev

# 测试环境
helm install your-app-test ./helm/your-app --values test-values.yaml --namespace test

# 生产环境
helm install your-app-prod ./helm/your-app --values prod-values.yaml --namespace prod
```

## 参考资源

- [Kubernetes官方文档](https://kubernetes.io/docs/)
- [Helm官方文档](https://helm.sh/docs/)
- [Kubernetes最佳实践](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Helm Chart最佳实践](https://helm.sh/docs/chart_best_practices/) 