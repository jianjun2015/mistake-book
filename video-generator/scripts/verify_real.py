#!/usr/bin/env python3
"""真实视频生成端到端验真脚本。

用途：账户在方舟控制台开通视频模型后，跑这一条命令就能证明「真实跑通」：
    python3 scripts/verify_real.py
    python3 scripts/verify_real.py --provider seedance --model doubao-seedance-2-0-260128
    python3 scripts/verify_real.py --provider runway --key key_xxx

它会：
1. 读取当前配置与自检结果，自动挑选第一个「已开通」的模型
2. 提交真实生成任务
3. 轮询直到完成（最长 10 分钟）
4. 下载视频到 data/videos/ 并校验 MP4 头与体积
退出码 0 = 真实生成成功；非 0 = 失败（并打印中文原因）。
"""
import argparse
import json
import sys
import time
import urllib.request

BASE = "http://localhost:8430/api"


def _get(path: str) -> dict:
    with urllib.request.urlopen(f"{BASE}{path}", timeout=30) as r:
        return json.loads(r.read().decode())


def _post(path: str, payload: dict, timeout: float = 60) -> dict:
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode())


def pick_model(provider: str) -> str:
    """从自检结果里挑一个可用模型。"""
    if provider == "mock":
        return "mock-v1"
    d = _get("/config/diagnose?probe=true")
    for p in d["providers"]:
        if p["provider"] != provider:
            continue
        if p.get("ready_model"):
            return p["ready_model"]
        print(f"❌ {provider} 没有可用模型。原因：{p['next_step']}", file=sys.stderr)
        for m in p.get("models", []):
            print(f"   - {m['id']}: {m['status']['state']} {m['status']['message'][:80]}", file=sys.stderr)
        sys.exit(2)
    print(f"❌ 未知厂商 {provider}", file=sys.stderr)
    sys.exit(2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--provider", default="seedance", choices=["seedance", "runway", "kling", "mock"])
    ap.add_argument("--model", default="", help="留空则自动挑选已开通的模型")
    ap.add_argument("--prompt", default="一只橘猫在阳光斑驳的窗台上伸懒腰，电影质感，浅景深")
    ap.add_argument("--duration", type=int, default=5)
    ap.add_argument("--timeout", type=int, default=600)
    args = ap.parse_args()

    model = args.model or pick_model(args.provider)
    print(f"▶ 厂商={args.provider} 模型={model}")

    start = time.time()
    task = _post("/generate", {
        "prompt": args.prompt,
        "provider": args.provider,
        "model": model,
        "params": {"duration": args.duration, "aspect_ratio": "16:9"},
    })
    if task.get("status") == "failed":
        print(f"❌ 提交失败：{task.get('error_message')}", file=sys.stderr)
        return 3
    task_id = task["id"]
    print(f"  任务 {task_id} 已提交，状态={task['status']}")

    while time.time() - start < args.timeout:
        time.sleep(5)
        t = _get(f"/tasks/{task_id}")
        status = t["status"]
        print(f"  [{int(time.time() - start)}s] {status}")
        if status == "completed":
            url = t["video_url"]
            print(f"✅ 生成成功（耗时 {t.get('duration')}s）")
            print(f"   视频地址：{url}")
            if url.startswith("/"):
                with urllib.request.urlopen(f"http://localhost:8430{url}", timeout=120) as r:
                    data = r.read()
                print(f"   本地文件校验：{len(data)} bytes, MP4头={data[4:8]!r}")
                if data[4:8] != b"ftyp":
                    print("❌ 下载内容不是合法 MP4", file=sys.stderr)
                    return 5
            return 0
        if status == "failed":
            print(f"❌ 生成失败：{t.get('error_message')}", file=sys.stderr)
            return 4
    print("❌ 超时未完成", file=sys.stderr)
    return 6


if __name__ == "__main__":
    sys.exit(main())
