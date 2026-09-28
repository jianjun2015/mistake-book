"""
智能客服配置
"""
import os

# 数据库
MYSQL_HOST = "localhost"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASSWORD = "Admin@2026!Mysql"
MYSQL_DB = "customer_service"

# LLM
LLM_BASE_URL = "https://token-plan-cn.xiaomimimo.com/v1"
LLM_API_KEY = "tp-cukxwfbhit4d1867hfur617dk7z9nryofe8f1srskdbkio24"
LLM_MODEL = "mimo-v2.6-pro"

# 知识库
KB_API_URL = "http://localhost:8001/api/kb"

# 服务
HOST = "0.0.0.0"
PORT = 8002

# 业务规则
SESSION_TIMEOUT_MINUTES = 30
MAX_SESSIONS_PER_AGENT = 10
AI_MAX_RETRIES = 2
FILE_MAX_SIZE = 10 * 1024 * 1024  # 10MB
