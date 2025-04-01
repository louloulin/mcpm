# 多阶段构建 Dockerfile for Next.js mcpm项目
# Stage 1: 依赖安装阶段
FROM node:20-alpine AS deps
WORKDIR /app

# 配置npm使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com/

# 安装pnpm
RUN npm install -g pnpm
# 配置pnpm使用淘宝镜像
RUN pnpm config set registry https://registry.npmmirror.com/

# 安装依赖
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then pnpm i --frozen-lockfile; \
  else echo "锁文件不存在" && exit 1; \
  fi

# Stage 2: 构建阶段
FROM node:20-alpine AS builder
WORKDIR /app

# 配置npm使用淘宝镜像
RUN npm config set registry https://registry.npmmirror.com/
# 安装pnpm
RUN npm install -g pnpm
# 配置pnpm使用淘宝镜像
RUN pnpm config set registry https://registry.npmmirror.com/

# 从依赖阶段复制node_modules
COPY --from=deps /app/node_modules ./node_modules
# 复制所有项目文件
COPY . .

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 执行Next.js构建
RUN pnpm run build

# Stage 3: 运行阶段
FROM node:20-alpine AS runner
WORKDIR /app

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5100

# 复制Next.js构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制其他必要文件
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/package.json ./package.json

# 数据库迁移脚本目录
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/lib/database ./lib/database

# 复制启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs

# 暴露端口
EXPOSE 5100

# 容器健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -q --spider http://localhost:5100/api/health || exit 1

# 使用启动脚本
ENTRYPOINT ["docker-entrypoint.sh"]

# 启动应用
CMD ["node", "server.js"] 