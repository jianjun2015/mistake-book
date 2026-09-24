# 本地知识库系统 - 技术设计文档

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                        前端 (React + AntD)                    │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ 文档管理  │ │ 知识检索  │ │ 智能问答  │ │ 系统设置  │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API网关 (Nginx + FastAPI)                  │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ 文档API  │ │ 检索API  │ │ 问答API  │ │ 用户API  │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心服务层 (Python)                      │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ 文档处理  │ │ 向量服务  │ │ RAG引擎  │ │ OCR服务  │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据存储层                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│   │ MySQL    │ │ ChromaDB │ │ MongoDB  │ │ MinIO    │       │
│   │ (元数据) │ │ (向量)   │ │ (日志)   │ │ (文件)   │       │
│   └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技术栈选型

| 组件 | 技术 | 版本 | 说明 |
|------|------|------|------|
| **后端框架** | FastAPI | 0.104+ | 高性能异步框架 |
| **向量数据库** | ChromaDB | 0.4+ | 轻量级，适合本地部署 |
| **Embedding** | BGE-M3 / text2vec | - | 中文语义理解 |
| **文档解析** | Unstructured | 0.10+ | 多格式文档解析 |
| **OCR** | PaddleOCR | 2.7+ | 中文OCR识别 |
| **语音识别** | Whisper | - | 语音转文字 |
| **LLM** | MiMo v2.6 Pro | - | 智能问答 |
| **关系数据库** | MySQL 8.0 | - | 元数据存储 |
| **文档数据库** | MongoDB | - | 日志、缓存 |
| **对象存储** | MinIO / 本地FS | - | 文件存储 |
| **前端** | React 18 + AntD 5 | - | UI框架 |

---

## 2. 核心模块设计

### 2.1 文档处理流水线

```
输入文档 → 格式检测 → 内容提取 → 文本清洗 → 分块处理 → 向量化 → 存储
            │           │          │          │          │        │
            ▼           ▼          ▼          ▼          ▼        ▼
        [格式解析器] [OCR/ASR] [规范化] [Chunking] [Embedding] [ChromaDB]
```

#### 2.1.1 文档解析器设计

```python
class DocumentParser:
    """文档解析器基类"""
    
    def parse(self, file_path: str) -> ParsedDocument:
        """解析文档，返回结构化内容"""
        pass

class TextParser(DocumentParser):
    """文本文件解析器 (.txt, .md)"""
    
class PDFParser(DocumentParser):
    """PDF解析器"""
    
class DocxParser(DocumentParser):
    """Word文档解析器"""
    
class ImageParser(DocumentParser):
    """图片解析器 (OCR)"""
    
class AudioParser(DocumentParser):
    """音频解析器 (语音转文字)"""
    
class VideoParser(DocumentParser):
    """视频解析器 (字幕提取)"""
    
class WebParser(DocumentParser):
    """网页解析器"""
    
class CodeParser(DocumentParser):
    """代码文件解析器"""
```

#### 2.1.2 数据结构

```python
@dataclass
class ParsedDocument:
    """解析后的文档结构"""
    id: str
    filename: str
    file_type: str
    content: str                    # 提取的文本内容
    metadata: dict                  # 元数据
    chunks: List[DocumentChunk]     # 文本分块
    created_at: datetime
    
@dataclass
class DocumentChunk:
    """文档分块"""
    id: str
    document_id: str
    content: str                    # 分块内容
    chunk_index: int                # 分块序号
    embedding: List[float]          # 向量表示
    metadata: dict                  # 分块元数据
    page_number: Optional[int]      # 页码（PDF）
    start_char: int                 # 起始字符位置
    end_char: int                   # 结束字符位置
```

### 2.2 向量检索服务

```python
class VectorStore:
    """向量存储服务"""
    
    def __init__(self, collection_name: str):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
    
    def add_documents(self, chunks: List[DocumentChunk]):
        """添加文档分块到向量库"""
        self.collection.add(
            ids=[c.id for c in chunks],
            embeddings=[c.embedding for c in chunks],
            documents=[c.content for c in chunks],
            metadatas=[c.metadata for c in chunks]
        )
    
    def search(self, query: str, top_k: int = 5, filters: dict = None) -> List[SearchResult]:
        """语义搜索"""
        query_embedding = embed_model.encode(query)
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filters
        )
        return self._format_results(results)
    
    def hybrid_search(self, query: str, top_k: int = 5) -> List[SearchResult]:
        """混合搜索（语义 + 关键词）"""
        # 1. 语义搜索
        semantic_results = self.search(query, top_k * 2)
        
        # 2. 关键词搜索
        keyword_results = self._keyword_search(query, top_k * 2)
        
        # 3. 结果融合（RRF - Reciprocal Rank Fusion）
        return self._fuse_results(semantic_results, keyword_results, top_k)
```

### 2.3 RAG问答引擎

```python
class RAGEngine:
    """RAG问答引擎"""
    
    def __init__(self):
        self.vector_store = VectorStore("knowledge_base")
        self.llm = MiMoClient()
        
    async def answer(self, question: str, conversation_id: str = None) -> Answer:
        """基于知识库的问答"""
        
        # 1. 查询扩展
        expanded_query = await self._expand_query(question)
        
        # 2. 检索相关文档
        relevant_docs = self.vector_store.hybrid_search(expanded_query, top_k=5)
        
        # 3. 构建提示词
        prompt = self._build_prompt(question, relevant_docs)
        
        # 4. 调用LLM生成答案
        answer = await self.llm.generate(prompt)
        
        # 5. 标注引用来源
        citations = self._extract_citations(answer, relevant_docs)
        
        return Answer(
            question=question,
            answer=answer,
            citations=citations,
            sources=relevant_docs
        )
    
    def _build_prompt(self, question: str, docs: List[SearchResult]) -> str:
        """构建RAG提示词"""
        context = "\n\n".join([f"[{i+1}] {doc.content}" for i, doc in enumerate(docs)])
        
        return f"""基于以下参考内容回答问题。如果无法回答，请说明。

参考内容：
{context}

问题：{question}

要求：
1. 答案必须基于参考内容
2. 引用来源使用 [1] [2] 格式
3. 如果参考内容不包含答案，明确说明

答案："""
```

### 2.4 图片处理服务（OCR）

```python
class OCRService:
    """OCR图片文字识别服务"""
    
    def __init__(self):
        self.ocr = PaddleOCR(use_angle_cls=True, lang='ch')
        
    def process_image(self, image_path: str) -> OCRResult:
        """处理图片，提取文字"""
        result = self.ocr.ocr(image_path, cls=True)
        
        texts = []
        for line in result:
            for word in line:
                texts.append({
                    "text": word[1][0],
                    "confidence": word[1][1],
                    "bbox": word[0]
                })
        
        return OCRResult(
            texts=texts,
            full_text="\n".join([t["text"] for t in texts]),
            image_path=image_path
        )
    
    def describe_image(self, image_path: str) -> str:
        """生成图片描述（使用多模态模型）"""
        # 使用MiMo-VL或其他多模态模型
        pass
```

---

## 3. 数据库设计

### 3.1 MySQL - 元数据表

```sql
-- 文档表
CREATE TABLE kb_documents (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    category VARCHAR(100),
    tags JSON,
    description TEXT,
    chunk_count INT DEFAULT 0,
    status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_user (user_id)
);

-- 文档分块表
CREATE TABLE kb_chunks (
    id VARCHAR(64) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    page_number INT,
    start_char INT,
    end_char INT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_document (document_id),
    FOREIGN KEY (document_id) REFERENCES kb_documents(id) ON DELETE CASCADE
);

-- 分类表
CREATE TABLE kb_categories (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    parent_id BIGINT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES kb_categories(id)
);

-- 标签表
CREATE TABLE kb_tags (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    usage_count INT DEFAULT 0
);

-- 文档标签关联表
CREATE TABLE kb_document_tags (
    document_id BIGINT,
    tag_id BIGINT,
    PRIMARY KEY (document_id, tag_id),
    FOREIGN KEY (document_id) REFERENCES kb_documents(id),
    FOREIGN KEY (tag_id) REFERENCES kb_tags(id)
);
```

### 3.2 ChromaDB - 向量存储

```python
# Collection配置
CollectionConfig(
    name="knowledge_base",
    metadata={
        "hnsw:space": "cosine",      # 余弦相似度
        "hnsw:construction_ef": 200,
        "hnsw:M": 16
    }
)

# 文档向量结构
{
    "id": "chunk_uuid",
    "embedding": [0.1, 0.2, ...],     # 768/1024维向量
    "document": "文本内容",
    "metadata": {
        "document_id": 1,
        "chunk_index": 0,
        "category": "数学",
        "tags": ["三角函数", "高中数学"],
        "file_type": "pdf",
        "page_number": 1
    }
}
```

### 3.3 MongoDB - 日志和会话

```javascript
// 问答会话集合
{
    _id: ObjectId,
    conversation_id: "uuid",
    user_id: 2,
    messages: [
        {
            role: "user",
            content: "什么是三角函数？",
            timestamp: ISODate
        },
        {
            role: "assistant",
            content: "三角函数是...",
            citations: [
                {source_id: "chunk_1", text: "...", score: 0.95}
            ],
            timestamp: ISODate
        }
    ],
    created_at: ISODate
}

// 检索日志集合
{
    _id: ObjectId,
    query: "三角函数",
    query_type: "semantic",     // semantic / keyword / hybrid
    results_count: 5,
    top_score: 0.95,
    user_id: 2,
    latency_ms: 120,
    timestamp: ISODate
}
```

---

## 4. API设计

### 4.1 文档管理API

```
POST   /api/kb/documents          # 上传文档
GET    /api/kb/documents          # 获取文档列表
GET    /api/kb/documents/{id}     # 获取文档详情
DELETE /api/kb/documents/{id}     # 删除文档
PUT    /api/kb/documents/{id}     # 更新文档信息
POST   /api/kb/documents/batch    # 批量上传
GET    /api/kb/documents/{id}/download  # 下载文档
```

### 4.2 知识检索API

```
POST   /api/kb/search             # 知识检索
POST   /api/kb/search/semantic    # 语义搜索
POST   /api/kb/search/keyword     # 关键词搜索
POST   /api/kb/search/hybrid      # 混合搜索
GET    /api/kb/search/suggest     # 搜索建议
```

### 4.3 智能问答API

```
POST   /api/kb/chat               # RAG问答
GET    /api/kb/chat/{session_id}  # 获取对话历史
POST   /api/kb/chat/feedback      # 答案反馈
```

### 4.4 分类和标签API

```
GET    /api/kb/categories         # 获取分类树
POST   /api/kb/categories         # 创建分类
PUT    /api/kb/categories/{id}    # 更新分类
DELETE /api/kb/categories/{id}    # 删除分类
GET    /api/kb/tags               # 获取标签列表
POST   /api/kb/tags               # 创建标签
```

---

## 5. 部署架构

### 5.1 Docker Compose配置

```yaml
version: '3.8'

services:
  # FastAPI后端
  kb-api:
    build: ./api
    ports:
      - "8001:8001"
    environment:
      - DATABASE_URL=mysql://user:pass@mysql:3306/knowledge_base
      - MONGODB_URL=mongodb://mongodb:27017
      - CHROMA_PATH=/data/chroma
      - MIMO_API_KEY=${MIMO_API_KEY}
    volumes:
      - ./data/chroma:/data/chroma
      - ./data/uploads:/data/uploads
    depends_on:
      - mysql
      - mongodb

  # MySQL
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DATABASE: knowledge_base
    volumes:
      - mysql_data:/var/lib/mysql
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql

  # MongoDB
  mongodb:
    image: mongo:6
    volumes:
      - mongo_data:/data/db

  # Redis (缓存)
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  # Nginx
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - kb-api

volumes:
  mysql_data:
  mongo_data:
  redis_data:
```

### 5.2 资源需求

| 组件 | CPU | 内存 | 磁盘 |
|------|-----|------|------|
| FastAPI | 1核 | 512MB | - |
| MySQL | 1核 | 512MB | 10GB |
| MongoDB | 0.5核 | 256MB | 5GB |
| ChromaDB | - | - | 10GB |
| Redis | 0.5核 | 128MB | - |
| **总计** | **3核** | **~1.5GB** | **25GB** |

---

## 6. 关键技术点

### 6.1 文本分块策略

```python
class TextChunker:
    """智能文本分块"""
    
    def chunk(self, text: str, chunk_size=500, overlap=50) -> List[str]:
        """
        分块策略：
        1. 优先按段落分割
        2. 段落过长时按句子分割
        3. 句子过长时按固定长度分割
        4. 保留overlap确保上下文连贯
        """
        pass
```

### 6.2 Embedding模型选择

| 模型 | 维度 | 中文效果 | 速度 | 推荐场景 |
|------|------|----------|------|----------|
| BGE-M3 | 1024 | ⭐⭐⭐⭐⭐ | 中 | 通用场景 |
| text2vec-base-chinese | 768 | ⭐⭐⭐⭐ | 快 | 轻量场景 |
| m3e-base | 768 | ⭐⭐⭐⭐ | 快 | 中文优化 |
| OpenAI ada-002 | 1536 | ⭐⭐⭐ | 中 | API调用 |

### 6.3 混合搜索（RRF）

```python
def reciprocal_rank_fusion(results_lists: List[List], k=60) -> List:
    """
    RRF融合算法
    score = Σ 1 / (k + rank_i)
    """
    scores = {}
    for results in results_lists:
        for rank, doc in enumerate(results):
            doc_id = doc.id
            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank)
    
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)
```

---

## 7. 扩展性设计

### 7.1 支持的扩展点

1. **新文档格式**：实现新的DocumentParser
2. **新Embedding模型**：配置模型接口
3. **新LLM**：实现LLM接口
4. **新向量数据库**：实现VectorStore接口
5. **自定义分块策略**：实现Chunker接口

### 7.2 插件架构

```python
class PluginManager:
    """插件管理器"""
    
    def register_parser(self, file_type: str, parser: DocumentParser):
        pass
    
    def register_embedding(self, name: str, model: EmbeddingModel):
        pass
    
    def register_llm(self, name: str, llm: LLMModel):
        pass
```

---

## 8. 监控和运维

### 8.1 监控指标
- 文档处理队列长度
- 向量检索延迟
- 问答响应时间
- 存储空间使用
- API调用次数

### 8.2 日志规范
- 结构化日志（JSON格式）
- 日志级别：DEBUG/INFO/WARN/ERROR
- 日志轮转：按天，保留30天

---

## 9. 安全设计

### 9.1 认证授权
- JWT Token认证
- RBAC权限控制
- API Rate Limiting

### 9.2 数据安全
- 文件存储加密
- 敏感信息脱敏
- SQL注入防护
- XSS防护

---

## 10. 开发计划

### Phase 1: 基础功能（2周）
- [ ] 项目框架搭建
- [ ] 文档上传和解析
- [ ] 向量存储和检索
- [ ] 基础UI

### Phase 2: RAG问答（2周）
- [ ] RAG引擎
- [ ] 问答界面
- [ ] 引用来源
- [ ] 对话历史

### Phase 3: 多模态支持（2周）
- [ ] 图片OCR
- [ ] 语音转文字
- [ ] 视频字幕提取

### Phase 4: 高级功能（2周）
- [ ] 知识图谱
- [ ] 智能推荐
- [ ] 系统优化
