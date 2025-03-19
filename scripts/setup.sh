#!/bin/bash

# 颜色设置
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # 恢复默认颜色

echo -e "${CYAN}=== MCPSVR 项目启动脚本 ===${NC}"

# 检查.env文件是否存在，不存在则从示例创建
if [ ! -f .env ]; then
  echo -e "${YELLOW}未检测到.env文件，正在从.env.example创建...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✅ .env文件已创建${NC}"
fi

# 安装依赖
echo -e "${YELLOW}正在安装依赖...${NC}"
pnpm install
echo -e "${GREEN}✅ 依赖安装完成${NC}"

# 启动数据库容器
echo -e "${YELLOW}正在启动数据库容器...${NC}"
docker-compose up -d
echo -e "${GREEN}✅ 数据库容器启动完成${NC}"
echo -e "${CYAN}PostgreSQL: localhost:5432${NC}"
echo -e "${CYAN}pgAdmin: http://localhost:5050${NC}"
echo -e "${CYAN}pgAdmin登录: admin@example.com / admin${NC}"

# 等待数据库就绪
echo -e "${YELLOW}等待数据库就绪...${NC}"
sleep 5

# 执行数据库迁移
echo -e "${YELLOW}正在执行数据库迁移...${NC}"
pnpm db:migrate
echo -e "${GREEN}✅ 数据库迁移完成${NC}"

# 填充初始数据
echo -e "${YELLOW}正在填充初始数据...${NC}"
pnpm db:seed
echo -e "${GREEN}✅ 初始数据填充完成${NC}"

# 启动开发服务器
echo -e "${YELLOW}正在启动开发服务器...${NC}"
echo -e "${GREEN}✅ 设置完成！${NC}"
echo -e "${CYAN}现在可以运行以下命令启动项目:${NC}"
echo -e "${CYAN}  pnpm dev        # 启动Next.js开发服务器${NC}"
echo -e "${CYAN}  pnpm db:studio  # 启动Drizzle Studio数据库管理界面${NC}"
echo -e ""
echo -e "${CYAN}系统管理员账号: admin / admin123${NC}"

echo -e "${GREEN}是否现在启动开发服务器? (y/n)${NC}"
read -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  pnpm dev
fi 