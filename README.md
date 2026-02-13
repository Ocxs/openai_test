# Dual LLM Workbench (No-API)

一个纯前端静态页面：输入一次问题，然后用“复制 + 打开官方站点”流程，手动粘贴到 ChatGPT 与 Gemini。

## 本地运行

直接打开 `index.html` 即可；建议用本地静态服务提升剪贴板兼容性：

```bash
npx serve .
```

## 注意事项

- **不调用任何 API**，不需要 key。
- **不嵌入 iframe**，仅通过 `window.open` 打开官方站点。
- Clipboard API 在 **localhost/https + 用户点击** 下更稳定；若失败会回退或提示手动复制。
- 浏览器可能拦截多窗口弹出；若被拦截，请允许弹窗或分别点击打开。
