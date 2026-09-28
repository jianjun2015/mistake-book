#!/bin/bash
# 知识库性能监控脚本
echo "=== 知识库服务资源 ==="
ps aux | grep "uvicorn main:app" | grep -v grep | awk '{printf "PID:%s CPU:%.1f%% MEM:%.1f%% RSS:%.0fMB\n", $2, $3, $4, $6/1024}'

echo ""
echo "=== API延迟测试 ==="
for endpoint in "/health" "/api/kb/documents/stats/overview"; do
    start=$(date +%s%N)
    curl -s "http://localhost:8001$endpoint" > /dev/null 2>&1
    end=$(date +%s%N)
    echo "  $endpoint: $(( (end - start) / 1000000 ))ms"
done

echo ""
echo "=== 搜索延迟 ==="
start=$(date +%s%N)
curl -s -X POST "http://localhost:8001/api/kb/search/" \
  -H "Content-Type: application/json" \
  -d '{"query":"测试查询","top_k":3}' > /dev/null 2>&1
end=$(date +%s%N)
echo "  搜索: $(( (end - start) / 1000000 ))ms"

echo ""
echo "=== 向量库状态 ==="
curl -s "http://localhost:8001/api/kb/documents/stats/overview" | python3 -m json.tool
