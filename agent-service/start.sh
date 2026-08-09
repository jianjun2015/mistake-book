#!/bin/bash
# 启动代码助手服务

cd /home/ubuntu/workplace/mistake-book/agent-service
source venv/bin/activate

# 如果.env不存在，从示例创建
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件配置 API Key"
    exit 1
fi

# 创建日志目录
mkdir -p logs

echo "🚀 启动代码助手服务..."
python main.py
