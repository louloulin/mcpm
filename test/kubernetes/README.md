# Kubernetes部署

本目录包含将test部署到Kubernetes集群所需的配置文件。

## 配置文件

- `namespace.yaml`: 创建专用命名空间
- `deployment.yaml`: 定义应用部署配置
- `service.yaml`: 创建服务暴露应用
- `configmap.yaml`: 环境变量配置
- `hpa.yaml`: 水平自动扩展配置
- `ingress.yaml`: 入口配置(需要配置域名)

## 部署步骤

1. 确保已安装kubectl并配置访问Kubernetes集群
2. 构建Docker镜像: `npm run docker:build`
3. 应用Kubernetes配置: `npm run k8s:apply`

或者通过kubectl手动应用:

```bash
# 应用所有配置
kubectl apply -f kubernetes/

# 或单独应用各配置
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/hpa.yaml
kubectl apply -f kubernetes/ingress.yaml
```

## 查看应用状态

```bash
# 查看部署状态
kubectl get deployments -n test-namespace

# 查看Pod状态
kubectl get pods -n test-namespace

# 查看服务
kubectl get services -n test-namespace

# 查看自动扩展配置
kubectl get hpa -n test-namespace
```

## 测试应用

```bash
# 端口转发测试
kubectl port-forward svc/test-service 8080:80 -n test-namespace

# 然后在浏览器访问: http://localhost:8080
```

## 删除部署

```bash
# 使用npm脚本
npm run k8s:delete

# 或手动删除
kubectl delete -f kubernetes/
```

## 注意事项

- 部署前请修改`ingress.yaml`中的host值为您自己的域名
- 根据环境需要调整`deployment.yaml`中的资源限制和请求
- 如需持久化数据，请添加PersistentVolume和PersistentVolumeClaim配置

- 该项目也提供了Helm Chart，可使用`npm run helm:install`快速部署
