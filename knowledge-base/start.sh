#!/bin/bash
# 知识库服务启动脚本
cd /home/ubuntu/workplace/mistake-book/knowledge-base

# 使用HuggingFace国内镜像
export HF_ENDPOINT=https://hf-mirror.com

# 激活虚拟环境
source .venv/bin/activate

# 启动FastAPI服务
exec uvicorn main:app --host 0.0.0.0 --port 8001 --workers 1
