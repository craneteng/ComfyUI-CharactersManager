import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "Characters.Manager.Dispatch",

    async nodeCreated(node) {
        if (node.comfyClass !== "CharactersManager") {
            return;
        }

        // 【关键1】延迟执行，等待 ComfyUI 完成节点和 DOM 的初始化渲染
        setTimeout(async () => {
            const wGroup = node.widgets.find(w => w.name === "group");
            const wChar = node.widgets.find(w => w.name === "character");
            const wHair = node.widgets.find(w => w.name === "enable_hair");
            const wClothes = node.widgets.find(w => w.name === "enable_clothes");
            const wText = node.widgets.find(w => w.name === "text");
            const wManager = node.widgets.find(w => w.name === "open_manager");

            let allData = {};

            // 【关键2】绕过 ComfyUI 对下拉菜单的合法值校验（防止变红、报错）
            node.is_valid = function (data) {
                return true;
            };

            // ============ 1. 角色管理开关 ============
            if (wManager) {
                const origManagerCallback = wManager.callback;
                wManager.callback = function (v) {
                    if (origManagerCallback) origManagerCallback.apply(this, arguments);
                    if (v === true) {
                        window.dispatchEvent(new CustomEvent("comfy-characters-open-manager"));
                        wManager.value = false; // 触发后复位
                    }
                };
            }

            // ============ 2. 获取后端完整数据 ============
            async function loadData() {
                try {
                    const res = await fetch("/api/characters/data?_t=" + Date.now());
                    if (!res.ok) throw new Error("HTTP " + res.status);
                    allData = await res.json();
                } catch (e) {
                    console.error("[CharactersManager] 数据加载失败:", e);
                    allData = {};
                }
            }

            // ============ 3. 更新分组下拉（初始化时调用一次） ============
            function updateGroups() {
                const groups = Object.keys(allData);
                if (wGroup) {
                    wGroup.options.values = ["", ...groups];
                    // 如果当前值不在新选项中，则重置为空
                    if (!wGroup.options.values.includes(wGroup.value)) {
                        wGroup.value = "";
                    }
                }
                if (wChar) {
                    wChar.options.values = [""];
                    wChar.value = "";
                }
                if (app.canvas) app.canvas.draw(true); // 【关键3】强制画布重绘
            }

            // ============ 4. 更新角色下拉（联动逻辑） ============
            function updateCharacters() {
                const selectedGroup = wGroup ? wGroup.value : "";
                if (!wChar) return;

                if (!selectedGroup || !allData[selectedGroup]) {
                    wChar.options.values = [""];
                    wChar.value = "";
                } else {
                    const chars = Object.keys(allData[selectedGroup]);
                    wChar.options.values = ["", ...chars];
                    // 如果当前选择的角色不在新分组中，自动选中第一个角色
                    if (!wChar.options.values.includes(wChar.value)) {
                        wChar.value = chars[0] || "";
                    }
                }
                if (app.canvas) app.canvas.draw(true); // 强制重绘
                updatePromptOutput(); // 触发提示词更新
            }

            // ============ 5. 拼接提示词并写入文本框 ============
            function updatePromptOutput() {
                if (!wText) return;

                const group = wGroup ? wGroup.value : "";
                const charName = wChar ? wChar.value : "";

                if (!group || !charName || !allData[group]?.[charName]) {
                    wText.value = "";
                    return;
                }

                const charData = allData[group][charName];
                let prompt = (charData.base || "").trim();

                if (wHair && wHair.value) {
                    const hair = (charData.hair || "").trim();
                    if (hair) prompt += (prompt ? ", " : "") + hair;
                }
                if (wClothes && wClothes.value) {
                    const clothes = (charData.clothes || "").trim();
                    if (clothes) prompt += (prompt ? ", " : "") + clothes;
                }

                wText.value = prompt;
            }

            // ============ 6. 绑定事件（正确包装原 callback 确保状态同步） ============
            if (wGroup) {
                const origCatCallback = wGroup.callback;
                wGroup.callback = function (value) {
                    if (origCatCallback) origCatCallback.apply(this, arguments);
                    updateCharacters(); // 切换分组 -> 联动更新角色
                };
            }

            if (wChar) {
                const origCharCallback = wChar.callback;
                wChar.callback = function (value) {
                    if (origCharCallback) origCharCallback.apply(this, arguments);
                    updatePromptOutput(); // 切换角色 -> 更新文本框
                };
            }

            if (wHair) {
                const origHairCallback = wHair.callback;
                wHair.callback = function (value) {
                    if (origHairCallback) origHairCallback.apply(this, arguments);
                    updatePromptOutput();
                };
            }

            if (wClothes) {
                const origClothesCallback = wClothes.callback;
                wClothes.callback = function (value) {
                    if (origClothesCallback) origClothesCallback.apply(this, arguments);
                    updatePromptOutput();
                };
            }

            // ============ 7. 启动初始化 ============
            await loadData();
            updateGroups();

            // ============ 8. 接收数据更新信号，重新加载并刷新下拉菜单 ============
            window.addEventListener("comfy-characters-data-updated", async () => {
                await loadData();
                // 刷新分组下拉
                const groups = Object.keys(allData);
                if (wGroup) {
                    wGroup.options.values = ["", ...groups];
                    if (!wGroup.options.values.includes(wGroup.value)) {
                        wGroup.value = "";
                    }
                }
                // 刷新角色下拉（根据当前选中的分组）
                const selectedGroup = wGroup ? wGroup.value : "";
                if (wChar) {
                    if (selectedGroup && allData[selectedGroup]) {
                        const chars = Object.keys(allData[selectedGroup]);
                        wChar.options.values = ["", ...chars];
                        // 自动选中第一个角色
                        if (!wChar.options.values.includes(wChar.value)) {
                            wChar.value = chars[0] || "";
                        }
                    } else {
                        wChar.options.values = [""];
                        wChar.value = "";
                    }
                }
                // 更新提示词文本框
                updatePromptOutput();
                // 刷新画布
                if (app.canvas) {
                    app.canvas.draw(true);
                }
            });
        }, 200);
    },
});