"""
日志配置
"""
import logging
import os
from logging.handlers import RotatingFileHandler

LOG_DIR = "./logs"
os.makedirs(LOG_DIR, exist_ok=True)


def setup_logging():
    """配置日志"""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    
    # 控制台输出
    console = logging.StreamHandler()
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s [%(name)s] %(message)s",
        datefmt="%H:%M:%S"
    ))
    logger.addHandler(console)
    
    # 文件输出（轮转，10MB×5个）
    file_handler = RotatingFileHandler(
        os.path.join(LOG_DIR, "kb.log"),
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        "%(asctime)s %(levelname)s [%(name)s] %(message)s"
    ))
    logger.addHandler(file_handler)
    
    return logger
