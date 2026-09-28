"""
智能客服全流程测试
"""
import httpx
import json

BASE = "http://localhost:8002/api/cs"
results = []


def test(name, method, path, data=None, expect_status=200):
    """执行测试"""
    if method == "GET":
        resp = httpx.get(f"{BASE}{path}", timeout=60)
    elif method == "POST":
        resp = httpx.post(f"{BASE}{path}", json=data, timeout=120)
    elif method == "PUT":
        resp = httpx.put(f"{BASE}{path}", json=data, timeout=60)
    
    ok = resp.status_code == expect_status
    results.append({"name": name, "status": resp.status_code, "ok": ok})
    print(f"{'✅' if ok else '❌'} {name}: HTTP {resp.status_code}")
    return resp.json() if resp.status_code == 200 else {}


def run_tests():
    print("=" * 50)
    print("📋 智能客服全流程测试")
    print("=" * 50)
    
    # 1. 健康检查
    print("\n--- 1. 基础接口 ---")
    test("健康检查", "GET", "/../../health")
    test("数据统计", "GET", "/stats")
    
    # 2. 创建会话
    print("\n--- 2. 会话管理 ---")
    session = test("创建会话", "POST", "/sessions", 
                   {"user_id": "test_user_001", "user_name": "测试用户"})
    session_id = session.get("id")
    
    if session_id:
        test("获取会话", "GET", f"/sessions/{session_id}")
    
    # 3. AI对话
    print("\n--- 3. AI对话 ---")
    
    # 问候
    r = test("发送问候", "POST", f"/sessions/{session_id}/messages",
             {"content": "你好"})
    if r.get("ai_reply"):
        print(f"   AI: {r['ai_reply']['content'][:50]}")
    
    # 知识问答
    r = test("知识问答", "POST", f"/sessions/{session_id}/messages",
             {"content": "你们的营业时间是几点？"})
    if r.get("ai_reply"):
        print(f"   AI: {r['ai_reply']['content'][:50]}")
    
    # 4. 转人工
    print("\n--- 4. 转人工 ---")
    r = test("请求转人工", "POST", f"/sessions/{session_id}/messages",
             {"content": "我要转人工客服"})
    if r.get("action") == "transfer_human":
        print("   ✅ 正确触发转人工")
    
    # 5. 客服操作
    print("\n--- 5. 客服工作台 ---")
    sessions = test("客服-会话列表", "GET", "/agent/sessions")
    test("客服-回复", "POST", f"/agent/sessions/{session_id}/reply",
         {"content": "您好，我是客服小王，有什么可以帮您？"})
    
    # 6. 会话历史
    print("\n--- 6. 消息历史 ---")
    messages = test("获取消息", "GET", f"/sessions/{session_id}/messages")
    print(f"   消息数: {len(messages)}")
    
    # 7. 满意度
    print("\n--- 7. 满意度评价 ---")
    test("满意度评价", "POST", f"/sessions/{session_id}/satisfaction",
         {"score": 5, "comment": "服务很好"})
    
    # 8. 关闭会话
    print("\n--- 8. 关闭会话 ---")
    test("关闭会话", "POST", f"/agent/sessions/{session_id}/close")
    
    # 汇总
    passed = sum(1 for r in results if r["ok"])
    print(f"\n{'=' * 50}")
    print(f"📊 测试结果: {passed}/{len(results)} 通过")
    print(f"{'=' * 50}")
    
    return results


if __name__ == "__main__":
    run_tests()
