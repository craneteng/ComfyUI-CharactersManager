import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "Characters.Manager.Modal",
    async setup() {
        // 注入样式
        const style = document.createElement("style");
        style.textContent = `
            #char-manager-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); z-index: 10000; display: none;
                justify-content: center; align-items: center;
            }
            .char-manager-content {
                background: #1e1e1e; color: #eee; width: 90%; height: 88%;
                border-radius: 10px; display: flex; flex-direction: column;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6); border: 1px solid #333;
                font-family: -apple-system, "Segoe UI", sans-serif;
            }
            .char-manager-header {
                padding: 16px 24px; border-bottom: 1px solid #333;
                display: flex; justify-content: space-between; align-items: center;
                flex-shrink: 0;
            }
            .char-manager-header h3 { margin: 0; font-size: 16px; color: #fff; }
            .char-manager-search-wrap { display: flex; align-items: center; gap: 8px; }
            .char-manager-search {
                background: #2b2b2b; border: 1px solid #444; color: #eee;
                padding: 8px 14px; border-radius: 6px; width: 260px;
                outline: none; font-size: 13px; transition: border-color 0.2s;
            }
            .char-manager-search:focus { border-color: #3a86ff; }
            .char-manager-search::placeholder { color: #666; }
            .char-manager-body {
                flex: 1; display: flex; overflow: hidden;
            }
            .char-manager-sidebar {
                width: 200px; border-right: 1px solid #333; overflow-y: auto;
                padding: 12px; flex-shrink: 0;
            }
            .char-manager-main {
                flex: 1; padding: 20px; overflow-y: auto;
                display: flex; flex-direction: column; gap: 16px;
            }
            .group-tag {
                padding: 10px 14px; margin: 4px 0; cursor: pointer; border-radius: 6px;
                background: #2b2b2b; text-align: center; transition: all 0.2s;
                font-size: 13px; color: #ccc; border: 1px solid transparent;
            }
            .group-tag:hover { background: #333; color: #fff; }
            .group-tag.active { background: #3a86ff; color: #fff; border-color: #5a9fff; }
            .char-card {
                background: #2b2b2b; border: 1px solid #444; border-radius: 8px; padding: 16px;
                transition: border-color 0.2s;
            }
            .char-card:hover { border-color: #555; }
            .char-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
            }
            .char-title { font-size: 15px; font-weight: bold; color: #3a86ff; }
            .char-subtitle { font-size: 11px; color: #777; }
            .prompt-box {
                background: #1a1a1a; border: 1px solid #3a3a3a; padding: 10px 12px;
                border-radius: 5px; font-family: "Consolas", "Courier New", monospace;
                font-size: 12px; color: #bbb; white-space: pre-wrap; word-break: break-all;
                line-height: 1.5; min-height: 36px;
            }
            .prompt-box:empty::before { content: "（空）"; color: #555; }
            .prompt-label { font-size: 11px; color: #888; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
            .prompt-section { margin-bottom: 12px; }
            .prompt-section:last-child { margin-bottom: 0; }
            .char-actions { display: flex; gap: 8px; flex-shrink: 0; }
            .btn {
                padding: 7px 16px; border: none; border-radius: 5px; cursor: pointer;
                color: #fff; font-size: 13px; font-weight: 500; transition: all 0.2s;
            }
            .btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
            .btn:active { transform: translateY(0); }
            .btn-primary { background: #3a86ff; }
            .btn-primary:hover { background: #4a95ff; }
            .btn-danger { background: #e63946; }
            .btn-danger:hover { background: #f4505d; }
            .btn-success { background: #2b9348; }
            .btn-success:hover { background: #3aa858; }
            .btn-sm { padding: 5px 12px; font-size: 12px; }
            .empty-hint {
                text-align: center; color: #555; padding: 60px 20px;
                font-size: 14px;
            }
            /* 编辑弹窗样式 */
            .edit-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); z-index: 10001; display: flex;
                justify-content: center; align-items: center;
            }
            .edit-modal {
                background: #1e1e1e; border: 1px solid #444; border-radius: 10px;
                width: 600px; max-width: 90%; padding: 24px; color: #eee;
                box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            }
            .edit-modal h4 { margin: 0 0 16px 0; font-size: 16px; color: #fff; }
            .edit-field { margin-bottom: 16px; }
            .edit-field label { display: block; font-size: 12px; color: #888; margin-bottom: 6px; }
            .edit-field textarea {
                width: 100%; min-height: 80px; background: #2b2b2b; border: 1px solid #444;
                color: #eee; padding: 10px; border-radius: 5px; font-family: monospace;
                font-size: 12px; resize: vertical; outline: none; box-sizing: border-box;
            }
            .edit-field textarea:focus { border-color: #3a86ff; }
            .edit-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        `;
        document.head.appendChild(style);

        // 创建 DOM
        const modal = document.createElement("div");
        modal.id = "char-manager-modal";
        modal.innerHTML = `
            <div class="char-manager-content">
                <div class="char-manager-header">
                    <h3>提示词管理</h3>
                    <div class="char-manager-search-wrap">
                        <input type="text" class="char-manager-search" placeholder="搜索角色名、提示词内容..." autocomplete="off">
                    </div>
                    <button class="btn btn-success" id="btn-add-char">✦ 添加提示词</button>
                    <button class="btn btn-danger btn-sm" id="btn-close-manager">✕</button>
                </div>
                <div class="char-manager-body">
                    <div class="char-manager-sidebar" id="group-list"></div>
                    <div class="char-manager-main" id="char-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        let allData = {};
        let activeGroup = "";

        // ============ 通过 API 加载数据 ============
        async function loadData() {
            try {
                const res = await fetch("/api/characters/data?_t=" + Date.now());
                if (!res.ok) throw new Error("HTTP " + res.status);
                allData = await res.json();
            } catch (e) {
                console.error("[CharactersManager] 加载失败:", e);
                allData = {};
            }
        }

        // ============ 通过 API 保存数据 ============
        async function saveData() {
            try {
                const res = await fetch("/api/characters/data", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(allData)
                });
                if (!res.ok) throw new Error("HTTP " + res.status);
                await loadData();
                renderGroups();
                renderChars();
                // 通知 dispatche 刷新
                window.dispatchEvent(new CustomEvent("comfy-characters-data-updated"));
                // 同时直接刷新画布（双重保障）
                if (typeof app !== "undefined" && app.canvas) {
                    app.canvas.draw(true);
                }
            } catch (e) {
                alert("保存失败: " + e.message);
            }
        }

        // ============ 渲染分组列表 ============
        function renderGroups() {
            const list = document.getElementById("group-list");
            list.innerHTML = "";

            // "全部"选项
            const allTag = document.createElement("div");
            allTag.className = `group-tag ${activeGroup === "" ? "active" : ""}`;
            allTag.textContent = "全部";
            allTag.onclick = () => {
                activeGroup = "";
                renderGroups();
                renderChars();
            };
            list.appendChild(allTag);

            // 遍历所有分组
            const groups = Object.keys(allData);
            groups.forEach(group => {
                const tag = document.createElement("div");
                tag.className = `group-tag ${activeGroup === group ? "active" : ""}`;
                tag.textContent = group;
                tag.onclick = () => {
                    activeGroup = group;
                    renderGroups();
                    renderChars();
                };
                list.appendChild(tag);
            });
        }

        // ============ 渲染角色列表 ============
        function renderChars() {
            const list = document.getElementById("char-list");
            list.innerHTML = "";
            const searchVal = document.querySelector(".char-manager-search").value.toLowerCase().trim();

            let count = 0;

            for (let group in allData) {
                if (activeGroup && group !== activeGroup) continue;

                for (let charName in allData[group]) {
                    const data = allData[group][charName];

                    // 搜索过滤
                    if (searchVal) {
                        const matchName = charName.toLowerCase().includes(searchVal);
                        const matchGroup = group.toLowerCase().includes(searchVal);
                        const matchBase = (data.base || "").toLowerCase().includes(searchVal);
                        const matchHair = (data.hair || "").toLowerCase().includes(searchVal);
                        const matchClothes = (data.clothes || "").toLowerCase().includes(searchVal);
                        if (!matchName && !matchGroup && !matchBase && !matchHair && !matchClothes) {
                            continue;
                        }
                    }

                    count++;
                    const card = document.createElement("div");
                    card.className = "char-card";
                    card.innerHTML = `
                        <div class="char-header">
                            <div>
                                <span class="char-title">${escapeHtml(charName)}</span>
                                <span class="char-subtitle"> [${escapeHtml(group)}]</span>
                            </div>
                            <div class="char-actions">
                                <button class="btn btn-primary btn-sm btn-edit">编辑</button>
                                <button class="btn btn-danger btn-sm btn-delete">删除</button>
                            </div>
                        </div>
                        <div class="prompt-section">
                            <div class="prompt-label">基础</div>
                            <div class="prompt-box">${escapeHtml(data.base || "")}</div>
                        </div>
                        <div class="prompt-section">
                            <div class="prompt-label">发型</div>
                            <div class="prompt-box">${escapeHtml(data.hair || "")}</div>
                        </div>
                        <div class="prompt-section">
                            <div class="prompt-label">衣服</div>
                            <div class="prompt-box">${escapeHtml(data.clothes || "")}</div>
                        </div>
                    `;

                    card.querySelector(".btn-edit").onclick = () => openEditModal(group, charName);
                    card.querySelector(".btn-delete").onclick = () => deleteChar(group, charName);
                    list.appendChild(card);
                }
            }

            if (count === 0) {
                list.innerHTML = `<div class="empty-hint">暂无角色数据</div>`;
            }
        }

        function escapeHtml(str) {
            const div = document.createElement("div");
            div.textContent = str;
            return div.innerHTML;
        }

        // ============ 删除角色 ============
        async function deleteChar(group, name) {
            if (!confirm(`确定要删除角色「${group} — ${name}」吗？`)) return;
            delete allData[group][name];
            if (Object.keys(allData[group]).length === 0) {
                delete allData[group];
                if (activeGroup === group) activeGroup = "";
            }
            await saveData();
        }

        // ============ 编辑弹窗 ============
        function openEditModal(group, name) {
            const data = allData[group][name];
            const overlay = document.createElement("div");
            overlay.className = "edit-modal-overlay";
            overlay.innerHTML = `
                <div class="edit-modal">
                    <h4>编辑：${escapeHtml(group)} — ${escapeHtml(name)}</h4>
                    <div class="edit-field">
                        <label>基础提示词</label>
                        <textarea class="edit-base" placeholder="基础属性（种族、外貌、特征等）">${escapeHtml(data.base || "")}</textarea>
                    </div>
                    <div class="edit-field">
                        <label>发型提示词</label>
                        <textarea class="edit-hair" placeholder="发型、发饰等">${escapeHtml(data.hair || "")}</textarea>
                    </div>
                    <div class="edit-field">
                        <label>衣服提示词</label>
                        <textarea class="edit-clothes" placeholder="服装、配饰等">${escapeHtml(data.clothes || "")}</textarea>
                    </div>
                    <div class="edit-actions">
                        <button class="btn btn-danger btn-sm edit-cancel">取消</button>
                        <button class="btn btn-success edit-save">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            overlay.querySelector(".edit-cancel").onclick = () => overlay.remove();
            overlay.querySelector(".edit-save").onclick = () => {
                allData[group][name] = {
                    base: overlay.querySelector(".edit-base").value,
                    hair: overlay.querySelector(".edit-hair").value,
                    clothes: overlay.querySelector(".edit-clothes").value
                };
                overlay.remove();
                saveData();
            };
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        }

        // ============ 添加角色弹窗 ============
        function openAddModal() {
            const groups = Object.keys(allData);
            const overlay = document.createElement("div");
            overlay.className = "edit-modal-overlay";
            overlay.innerHTML = `
                <div class="edit-modal">
                    <h4>添加提示词</h4>
                    <div class="edit-field">
                        <label>分组（已有分组名称则加入该组，新名称则创建新分组）</label>
                        <input type="text" class="add-group" list="existing-groups" placeholder="输入或选择分组"
                            style="width:100%;padding:10px;background:#2b2b2b;border:1px solid #444;color:#eee;border-radius:5px;font-size:13px;outline:none;box-sizing:border-box;">
                        <datalist id="existing-groups">
                            ${groups.map(g => `<option value="${escapeHtml(g)}">`).join("")}
                        </datalist>
                    </div>
                    <div class="edit-field">
                        <label>角色名称</label>
                        <input type="text" class="add-name" placeholder="输入角色名称"
                            style="width:100%;padding:10px;background:#2b2b2b;border:1px solid #444;color:#eee;border-radius:5px;font-size:13px;outline:none;box-sizing:border-box;">
                    </div>
                    <div class="edit-field">
                        <label>基础提示词</label>
                        <textarea class="add-base" placeholder="基础属性">${""}</textarea>
                    </div>
                    <div class="edit-field">
                        <label>发型提示词</label>
                        <textarea class="add-hair" placeholder="发型相关">${""}</textarea>
                    </div>
                    <div class="edit-field">
                        <label>衣服提示词</label>
                        <textarea class="add-clothes" placeholder="服装相关">${""}</textarea>
                    </div>
                    <div class="edit-actions">
                        <button class="btn btn-danger btn-sm add-cancel">取消</button>
                        <button class="btn btn-success add-save">保存</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            // 复用编辑弹窗的 textarea 样式
            overlay.querySelectorAll("textarea").forEach(ta => {
                ta.style.cssText = "width:100%;min-height:70px;background:#2b2b2b;border:1px solid #444;color:#eee;padding:10px;border-radius:5px;font-family:monospace;font-size:12px;resize:vertical;outline:none;box-sizing:border-box;";
                ta.onfocus = function() { this.style.borderColor = "#3a86ff"; };
                ta.onblur = function() { this.style.borderColor = "#444"; };
            });

            overlay.querySelector(".add-cancel").onclick = () => overlay.remove();
            overlay.querySelector(".add-save").onclick = () => {
                const groupName = overlay.querySelector(".add-group").value.trim();
                const charName = overlay.querySelector(".add-name").value.trim();
                if (!groupName) { alert("分组名称不能为空"); return; }
                if (!charName) { alert("角色名称不能为空"); return; }

                if (!allData[groupName]) allData[groupName] = {};
                allData[groupName][charName] = {
                    base: overlay.querySelector(".add-base").value,
                    hair: overlay.querySelector(".add-hair").value,
                    clothes: overlay.querySelector(".add-clothes").value
                };
                overlay.remove();
                saveData();
            };
            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };
        }

        // ============ 事件绑定 ============
        document.getElementById("btn-close-manager").onclick = () => {
            modal.style.display = "none";
        };

        document.getElementById("btn-add-char").onclick = openAddModal;

        // 搜索框自动搜索（input 事件实时触发）
        document.querySelector(".char-manager-search").addEventListener("input", () => {
            renderChars();
        });

        // 点击遮罩关闭
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = "none";
        };

        // 接收唤醒信号
        window.addEventListener("comfy-characters-open-manager", async () => {
            modal.style.display = "flex";
            await loadData();
            renderGroups();
            renderChars();
        });

        // 接收数据更新信号
        window.addEventListener("comfy-characters-data-updated", () => {
            // 已在 saveData 中调用 renderGroups/renderChars
        });
    }
});