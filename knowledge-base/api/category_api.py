"""
分类标签API
"""
from fastapi import APIRouter, HTTPException
from models.schemas import Category
from utils import database as db

router = APIRouter()


@router.get("/categories", summary="分类列表")
async def list_categories():
    return db.list_categories()


@router.post("/categories", summary="创建分类")
async def create_category(cat: Category):
    cat_id = db.create_category(cat.name, cat.parent_id)
    return {"id": cat_id, "name": cat.name}


@router.delete("/categories/{cat_id}", summary="删除分类")
async def delete_category(cat_id: int):
    db.delete_category(cat_id)
    return {"success": True}


@router.get("/tags", summary="标签列表")
async def list_tags():
    return db.list_tags()
