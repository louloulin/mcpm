# 多阶段构建 Dockerfile for mcpm
# Stage 1: 构建依赖阶段
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 如果有构建步骤，取消下面注释
# RUN npm run build

# Stage 2: 生产阶段
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 添加非 root 用户来增强安全性
RUN addgroup -S mcpm && \
    adduser -S -G mcpm mcpm && \
    chown -R mcpm:mcpm /app

# 从构建阶段复制依赖和构建产物
COPY --from=builder --chown=mcpm:mcpm /app/node_modules ./node_modules
COPY --from=builder --chown=mcpm:mcpm /app/package*.json ./
COPY --from=builder --chown=mcpm:mcpm /app/src ./src
COPY --from=builder --chown=mcpm:mcpm /app/config ./config
# 添加其他必要文件
COPY --from=builder --chown=mcpm:mcpm /app/.env.example ./.env.example
COPY --from=builder --chown=mcpm:mcpm /app/LICENSE ./LICENSE
COPY --from=builder --chown=mcpm:mcpm /app/README.md ./README.md

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production \
    PORT=3000

# 切换到非 root 用户
USER mcpm

# 容器健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:3000/api/v1/health || exit 1

# 启动应用
CMD ["node", "src/index.js"] 