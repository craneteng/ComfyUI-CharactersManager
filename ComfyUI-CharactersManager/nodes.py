from server import PromptServer
from aiohttp import web
import json
import os

DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(DIR, "characters.json")

def load_data():
    """从 JSON 读取所有分组和角色"""
    if not os.path.exists(JSON_PATH):
        return ["暂无分组"], ["暂无角色"]
    
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except:
            return ["暂无分组"], ["暂无角色"]

    # 提取所有分组名称
    groups = list(data.keys())
    if not groups:
        groups = ["暂无分组"]

    # 提取所有角色名称（合并所有分组下的角色并去重）
    all_characters = set()
    for group_items in data.values():
        all_characters.update(group_items.keys())
    
    characters = sorted(list(all_characters))
    if not characters:
        characters = ["暂无角色"]

    return groups, characters

class CharactersManager:
    @classmethod
    def INPUT_TYPES(s):
        # 每次节点被创建或刷新时，动态读取下拉菜单的选项
        groups, all_chars = load_data()
        
        return {
            "required": {
                # 【下拉菜单】预加载所有分组（元组格式）
                "group": (groups,),
                
                # 【下拉菜单】预加载所有角色（元组格式）
                "character": (all_chars,),
                
                # 2个开关
                "enable_hair": ("BOOLEAN", {"default": False, "label_on": "启用发型", "label_off": "禁用发型"}),
                "enable_clothes": ("BOOLEAN", {"default": False, "label_on": "启用衣服", "label_off": "禁用衣服"}),
                
                # 文本框（用于传递最终数据）
                "text": ("STRING", {"multiline": True, "dynamicPrompts": False, "default": ""}),
                
                # 角色管理按钮（放在最底下）
                "open_manager": ("BOOLEAN", {"default": False, "label_on": "角色管理", "label_off": "角色管理"}),
            }
        }

    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("text",)
    FUNCTION = "execute"
    CATEGORY = "Characters"

    def execute(self, group, character, enable_hair, enable_clothes, text="", open_manager=False):
        # 只输出 text 文本框的值，下拉菜单只在前端用于联动选择
        return (text,)

# ============ API 路由 ============
@PromptServer.instance.routes.get("/api/characters/data")
async def get_characters_data(request):
    try:
        if os.path.exists(JSON_PATH):
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = {}
        return web.json_response(data)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

@PromptServer.instance.routes.post("/api/characters/data")
async def save_characters_data(request):
    try:
        body = await request.json()
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(body, f, ensure_ascii=False, indent=2)
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)