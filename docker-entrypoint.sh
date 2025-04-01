#!/bin/sh
set -e

echo "尝试连接到数据库..."
for i in $(seq 1 30); do
  nc -z postgres 5432 && break
  echo "等待数据库可用... (尝试 $i/30)"
  sleep 2
done

if [ $i -eq 30 ]; then
  echo "无法连接到数据库，请检查数据库配置"
  exit 1
fi

echo "数据库连接成功，启动应用..."
exec "$@" 