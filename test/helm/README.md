# test Helm Chart

这个Helm Chart用于在Kubernetes集群上部署test MCP服务器。

## 前提条件

- Kubernetes 1.19+
- Helm 3.2.0+

## 安装Chart

```bash
# 使用npm脚本
npm run helm:install

# 或使用helm命令
helm install test ./helm/test
```

## 卸载Chart

```bash
# 使用npm脚本
npm run helm:uninstall

# 或使用helm命令
helm uninstall test
```

## 配置参数

| 参数                                  | 描述                                | 默认值                           |
|---------------------------------------|-------------------------------------|----------------------------------|
| `replicaCount`                      | 副本数量                            | `1`                             |
| `image.repository`                  | 镜像仓库                            | `test`               |
| `image.tag`                         | 镜像标签                            | `latest`                        |
| `image.pullPolicy`                  | 镜像拉取策略                        | `IfNotPresent`                  |
| `service.type`                      | Kubernetes服务类型                  | `ClusterIP`                     |
| `service.port`                      | 服务端口                            | `80`                            |
| `service.targetPort`                | 目标端口                            | `3000`                          |
| `ingress.enabled`                   | 是否启用Ingress                     | `true`                          |
| `ingress.hosts`                     | Ingress主机配置                     | `[{host: "test.example.com", paths: [{path: "/", pathType: "Prefix"}]}]` |
| `resources.limits.cpu`              | CPU资源限制                         | `500m`                          |
| `resources.limits.memory`           | 内存资源限制                        | `512Mi`                         |
| `resources.requests.cpu`            | CPU资源请求                         | `100m`                          |
| `resources.requests.memory`         | 内存资源请求                        | `128Mi`                         |
| `autoscaling.enabled`               | 是否启用自动扩展                    | `true`                          |
| `autoscaling.minReplicas`           | 最小副本数                          | `1`                             |
| `autoscaling.maxReplicas`           | 最大副本数                          | `5`                             |
| `autoscaling.targetCPUUtilizationPercentage` | 目标CPU使用率             | `80`                            |
| `env`                               | 环境变量                            | `{NODE_ENV: "production", PORT: "3000", LOG_LEVEL: "info"}` |

## 自定义配置

您可以通过创建自己的values.yaml文件来覆盖默认配置：

```bash
helm install test ./helm/test -f my-values.yaml
```

示例自定义values.yaml:

```yaml
replicaCount: 2

image:
  repository: myregistry/test
  tag: v1.0.0

service:
  type: LoadBalancer

ingress:
  enabled: true
  hosts:
    - host: api.mycompany.com
      paths:
        - path: /mcp
          pathType: Prefix

resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi

env:
  NODE_ENV: production
  PORT: "3000"
  LOG_LEVEL: debug
  API_KEY: "my-api-key"
```
