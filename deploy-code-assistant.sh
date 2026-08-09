#!/bin/bash
# 部署代码助手服务

set -e

echo "=== 部署代码助手 ==="

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 1. 检查配置文件
if [ ! -f /home/ubuntu/workplace/mistake-book/agent-service/.env ]; then
    echo -e "${YELLOW}⚠️  请先配置 API Key${NC}"
    echo "cp /home/ubuntu/workplace/mistake-book/agent-service/.env.example /home/ubuntu/workplace/mistake-book/agent-service/.env"
    echo "然后编辑 .env 文件填入你的 API Key"
    exit 1
fi

# 2. 创建日志目录
mkdir -p /home/ubuntu/workplace/mistake-book/agent-service/logs

# 3. 启动Python服务（后台运行）
echo -e "${GREEN}🚀 启动 AgentScope 服务...${NC}"
cd /home/ubuntu/workplace/mistake-book/agent-service
source venv/bin/activate

# 检查是否已有进程在运行
if pgrep -f "python main.py" > /dev/null; then
    echo "停止现有进程..."
    pkill -f "python main.py"
    sleep 2
fi

# 后台启动
nohup python main.py > logs/app.log 2>&1 &
PYTHON_PID=$!
echo "Python服务PID: $PYTHON_PID"

# 等待服务启动
sleep 3
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ Python服务启动成功${NC}"
else
    echo -e "${RED}❌ Python服务启动失败，请检查日志${NC}"
    tail -20 logs/app.log
    exit 1
fi

# 4. 构建前端
echo -e "${GREEN}📦 构建前端...${NC}"
cd /home/ubuntu/workplace/mistake-book/code-assistant
npm run build

# 5. 部署前端
echo -e "${GREEN}📁 部署前端文件...${NC}"
sudo mkdir -p /var/www/code-assistant
sudo cp -r dist/* /var/www/code-assistant/
sudo chown -R www-data:www-data /var/www/code-assistant

# 6. 重启Nginx
echo -e "${GREEN}🔄 重启Nginx...${NC}"
sudo systemctl reload nginx

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo -e "访问地址: ${GREEN}https://code.ty66666.cloud${NC}"
echo ""
echo "查看日志: tail -f /home/ubuntu/workplace/mistake-book/agent-service/logs/app.log"
