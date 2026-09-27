"""
文档管理API - 异步处理版本
上传立即返回，后台线程解析和向量化
"""
import os
import uuid
import aiofiles
import threading
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse

from config.settings import settings
from models.schemas import (
    Document, DocumentCreate, DocumentUpdate, DocumentStatus
)
from services.document_processor import DocumentProcessor
from services.vector_store import get_vector_store
from utils import database as db

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

# 启动时初始化
db.init_db()
_processor = DocumentProcessor(settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)


def _process_in_background(doc_id: int, save_path: str, filename: str, category: str, tag_list: list):
    """后台线程：解析文档 + 向量嵌入"""
    try:
        # 更新状态为处理中
        db.update_document(doc_id, {"status": "processing"})

        # 解析文档
        parsed = _processor.process_file(save_path, metadata={"filename": filename})
        chunks = parsed["chunks"]

        # 更新元数据
        db.update_document(doc_id, {"chunk_count": len(chunks)})

        # 添加到向量库
        for c in chunks:
            c["metadata"]["document_id"] = str(doc_id)
            c["metadata"]["filename"] = filename
            if category:
                c["metadata"]["category"] = category
        if chunks:
            get_vector_store().add_chunks(chunks)

        # 更新标签
        for tag in tag_list:
            db.upsert_tag(tag)

        # 标记完成
        db.update_document(doc_id, {"status": "completed"})
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.update_document(doc_id, {"status": "failed"})


@router.post("/", summary="上传文档")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(None),
    category: str = Form(None),
    tags: str = Form(""),
    description: str = Form(None)
):
    """上传文档 - 立即返回，后台异步解析"""
    # 1. 检查文件大小
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(413, f"文件过大，最大支持 {settings.MAX_FILE_SIZE // 1024 // 1024}MB")

    # 2. 保存文件
    ext = os.path.splitext(file.filename)[1].lower()
    saved_filename = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(settings.UPLOAD_DIR, saved_filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async with aiofiles.open(save_path, "wb") as f:
        await f.write(content)

    # 3. 先创建记录（状态=pending）
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    doc_data = {
        "title": title or os.path.splitext(file.filename)[0],
        "filename": file.filename,
        "file_type": ext.lstrip("."),
        "file_size": len(content),
        "file_path": save_path,
        "category": category,
        "tags": tag_list,
        "description": description,
        "chunk_count": 0,
        "status": "pending"
    }
    doc_id = db.create_document(doc_data)

    # 4. 后台线程异步处理解析和向量化
    thread = threading.Thread(
        target=_process_in_background,
        args=(doc_id, save_path, file.filename, category, tag_list),
        daemon=True
    )
    thread.start()

    # 5. 立即返回
    return {
        "id": doc_id,
        "title": doc_data["title"],
        "filename": file.filename,
        "chunk_count": 0,
        "status": "pending",
        "message": "文档已上传，后台正在解析中..."
    }


@router.get("/", summary="文档列表")
async def list_documents(
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100)
):
    return db.list_documents(category, page, size)


@router.get("/{doc_id}", summary="文档详情")
async def get_document(doc_id: int):
    doc = db.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "文档不存在")
    return doc


@router.put("/{doc_id}", summary="更新文档")
async def update_document(doc_id: int, update: DocumentUpdate):
    doc = db.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "文档不存在")
    updates = {k: v for k, v in update.dict().items() if v is not None}
    if updates:
        db.update_document(doc_id, updates)
    return {"success": True}


@router.delete("/{doc_id}", summary="删除文档")
async def delete_document(doc_id: int):
    doc = db.get_document(doc_id)
    if not doc:
        raise HTTPException(404, "文档不存在")
    # 删除向量
    get_vector_store().delete_by_document(str(doc_id))
    # 删除文件
    if doc.get("file_path") and os.path.exists(doc["file_path"]):
        os.remove(doc["file_path"])
    # 删除记录
    db.delete_document(doc_id)
    return {"success": True}


@router.get("/{doc_id}/download", summary="下载文档")
async def download_document(doc_id: int):
    doc = db.get_document(doc_id)
    if not doc or not doc.get("file_path") or not os.path.exists(doc["file_path"]):
        raise HTTPException(404, "文件不存在")
    return FileResponse(
        doc["file_path"],
        filename=doc["filename"],
        media_type="application/octet-stream"
    )


@router.post("/text", summary="直接导入文本")
async def import_text(
    content: str = Form(...),
    title: str = Form(...),
    category: str = Form(None),
    tags: str = Form("")
):
    """直接导入文本内容 - 也是异步"""
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    doc_data = {
        "title": title,
        "filename": f"{title}.txt",
        "file_type": "text",
        "file_size": len(content),
        "file_path": None,
        "category": category,
        "tags": tag_list,
        "description": None,
        "chunk_count": 0,
        "status": "pending"
    }
    doc_id = db.create_document(doc_data)

    # 后台处理
    def _process_text():
        try:
            db.update_document(doc_id, {"status": "processing"})
            parsed = _processor.process_text(content, metadata={"title": title})
            chunks = parsed["chunks"]
            for c in chunks:
                c["metadata"]["document_id"] = str(doc_id)
                c["metadata"]["filename"] = doc_data["filename"]
                if category:
                    c["metadata"]["category"] = category
            if chunks:
                get_vector_store().add_chunks(chunks)
            for tag in tag_list:
                db.upsert_tag(tag)
            db.update_document(doc_id, {"chunk_count": len(chunks), "status": "completed"})
        except Exception as e:
            import traceback
            traceback.print_exc()
            db.update_document(doc_id, {"status": "failed"})

    threading.Thread(target=_process_text, daemon=True).start()

    return {"id": doc_id, "title": title, "chunk_count": 0, "status": "pending", "message": "文本已导入，后台正在处理..."}


@router.get("/stats/overview", summary="统计概览")
async def stats():
    logger.info("获取统计概览")
    return {
        "total_documents": db.list_documents(size=1)["total"],
        "total_chunks": get_vector_store().count(),
    }