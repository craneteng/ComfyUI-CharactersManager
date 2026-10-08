# ComfyUI-CharactersManager 入口文件
# 版本号：V1.0.1

import threading
import urllib.request
import json
import os

# ============================================================
# 版本信息
# ============================================================
__version__ = "1.0.1"

# GitHub 仓库信息
GITHUB_REPO = "craneteng/ComfyUI-CharactersManager"
GITHUB_API_RELEASES = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
GITHUB_API_TAGS = f"https://api.github.com/repos/{GITHUB_REPO}/tags"

# 国内镜像加速（当直接访问 GitHub 被限流/超时时使用）
GITHUB_PROXY_BASE = "https://ghfast.top"
GITHUB_PROXY_RELEASES = f"{GITHUB_PROXY_BASE}/https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
GITHUB_PROXY_TAGS = f"{GITHUB_PROXY_BASE}/https://api.github.com/repos/{GITHUB_REPO}/tags"


def _fetch_json(url, timeout=5):
    """发起 HTTP 请求并返回 JSON 数据，失败返回 None"""
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": f"ComfyUI-CharactersManager/{__version__}",
                "Accept": "application/vnd.github.v3+json",
                "Authorization": "token " + os.environ.get("GITHUB_TOKEN", ""),
            }
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception:
        return None


def _parse_version(tag_name):
    """从 tag/release 名称中提取版本号（去掉 'v' 前缀）"""
    if tag_name:
        return tag_name.lstrip("v").strip()
    return ""


def check_update():
    """
    检查版本更新（非阻塞，在独立线程中运行）
    
    检查逻辑：
    1. 先尝试通过 GitHub Releases API 获取最新版本
    2. 如果 Releases 不可用（404/限流/网络问题），回退到 Tags API
    3. 如果 Tags 也不可用，尝试通过国内镜像代理访问
    4. 比较版本号，如果有新版本则在控制台打印提示
    5. 所有异常均静默捕获，绝不影响 ComfyUI 启动
    """
    latest_version = ""
    
    # 第一步：尝试从 Releases 获取最新版本（直接访问）
    data = _fetch_json(GITHUB_API_RELEASES)
    if data is not None and "tag_name" in data:
        latest_version = _parse_version(data["tag_name"])
    else:
        # 第二步：Releases 不可用时，回退到 Tags API（直接访问）
        data = _fetch_json(GITHUB_API_TAGS)
        if data is not None and isinstance(data, list) and len(data) > 0:
            latest_version = _parse_version(data[0].get("name", ""))
        else:
            # 第三步：直接访问也失败时，尝试国内镜像代理
            data = _fetch_json(GITHUB_PROXY_RELEASES)
            if data is not None and "tag_name" in data:
                latest_version = _parse_version(data["tag_name"])
            else:
                data = _fetch_json(GITHUB_PROXY_TAGS)
                if data is not None and isinstance(data, list) and len(data) > 0:
                    latest_version = _parse_version(data[0].get("name", ""))
    
    # 第四步：版本比较与提示
    current = _parse_version(__version__)
    if latest_version and latest_version != current:
        # 解析版本号用于语义化比较（支持 semantic versioning）
        try:
            current_parts = [int(x) for x in current.split(".") if x.isdigit()]
            latest_parts = [int(x) for x in latest_version.split(".") if x.isdigit()]
            
            # 补齐长度（如 1.0 和 1.0.1 需要补齐）
            max_len = max(len(current_parts), len(latest_parts))
            current_parts.extend([0] * (max_len - len(current_parts)))
            latest_parts.extend([0] * (max_len - len(latest_parts)))
            
            if latest_parts > current_parts:
                print()
                print("=" * 50)
                print(f"  [CharactersManager] 发现新版本可用!")
                print(f"  当前版本: V{current}")
                print(f"  最新版本: V{latest_version}")
                print(f"  更新地址: https://github.com/{GITHUB_REPO}")
                print("=" * 50)
                print()
        except Exception:
            # 版本号格式不支持数值比较时，只做字符串提示
            print()
            print(f"[CharactersManager] 发现新版本: V{latest_version} (当前: V{current})")
            print(f"[CharactersManager] 更新地址: https://github.com/{GITHUB_REPO}")
            print()


# ============================================================
# 启动版本检查（非阻塞，不延迟 ComfyUI 启动）
# ============================================================
try:
    # 通过环境变量 COMFYUI_CHECK_UPDATE=0 可禁用更新检查
    if os.environ.get("COMFYUI_CHECK_UPDATE", "1").lower() not in ("0", "false", "no"):
        threading.Thread(target=check_update, daemon=True).start()
except Exception:
    pass  # 静默忽略，绝不让版本检查影响启动


# ============================================================
# 原有节点注册代码（保持不变）
# ============================================================
from .nodes import CharactersManager

NODE_CLASS_MAPPINGS = {
    "CharactersManager": CharactersManager
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "CharactersManager": "Characters Manager (角色管理)"
}

WEB_DIRECTORY = "./web"

# 打印当前加载版本（方便调试）
print(f"[CharactersManager] 已加载版本: V{__version__}")
