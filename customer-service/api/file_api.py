"""
文件/语音上传下载API
"""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

UPLOAD_DIR = "/home/ubuntu/workplace/mistake-book/customer-service/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 允许的文件类型
ALLOWED_TYPES = {
    "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    "audio": [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm"],
    "video": [".mp4", ".avi", ".mov"],
    "doc": [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md"],
}

def get_file_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    for ftype, exts in ALLOWED_TYPES.items():
        if ext in exts:
            return ftype
    return "file"

@router.post("/upload", summary="上传文件/语音")
async def upload_file(file: UploadFile = File(...)):
    ext = os.path.splitext(file.filename)[1].lower()
    
    # 检查文件类型
    all_exts = [e for exts in ALLOWED_TYPES.values() for e in exts]
    if ext not in all_exts:
        raise HTTPException(400, f"不支持的文件类型: {ext}")
    
    # 生成唯一文件名
    file_id = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}"
    save_name = f"{file_id}{ext}"
    save_path = os.path.join(UPLOAD_DIR, save_name)
    
    # 保存文件
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:  # 50MB限制
        raise HTTPException(400, "文件大小不能超过50MB")
    
    with open(save_path, "wb") as f:
        f.write(content)
    
    file_type = get_file_type(file.filename)
    
    return {
        "file_id": file_id,
        "filename": file.filename,
        "file_type": file_type,
        "file_url": f"/api/cs/files/{save_name}",
        "size": len(content),
        "ext": ext
    }

@router.get("/files/{filename}", summary="下载/访问文件")
async def get_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "文件不存在")
    return FileResponse(file_path, filename=filename)
