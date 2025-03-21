# Cursor API 使用情况查看器

这个 VSCode 插件可以帮助您查看 Cursor API 的使用情况，包括各模型的请求次数、Token 用量以及剩余配额。

## 功能

- 查看 GPT-4、GPT-3.5 Turbo 和 GPT-4 32k 的使用情况
- 显示请求次数和 Token 使用量
- 可视化显示使用进度和剩余配额
- 显示本月计费周期开始时间

## 安装前提

使用此插件前，您需要获取以下信息：

1. `WorkosCursorSessionToken`：您的 Cursor 会话令牌。登录 cursor.com 后，在浏览器开发者工具中（网站 Cookies）找到 `WorkosCursorSessionToken` 的值。

## 安装方法

1. 在 VSCode 扩展面板中搜索 "Cursor Usage Viewer"
2. 点击安装
3. 安装完成后重启 VSCode

或者您可以直接下载 VSIX 文件并手动安装：

1. 在 VSCode 扩展面板菜单中选择 "从 VSIX 安装..."
2. 选择下载的 VSIX 文件

## 配置方法

1. 打开 VSCode 设置（文件 > 首选项 > 设置，或使用快捷键 `Ctrl+,`）
2. 搜索 "Cursor Balance"
3. 填写以下设置项：
   - `cursorBalance.token`：您的 WorkosCursorSessionToken

## 使用方法

1. 通过命令面板（`Ctrl+Shift+P` 或 `Cmd+Shift+P`）输入 "查看 Cursor 余额"
2. 选择该命令后，插件将显示您的 API 使用情况

## 隐私说明

本插件仅使用您提供的凭证访问 Cursor API，不会收集或存储您的任何个人数据。所有凭证信息仅存储在您的本地 VSCode 配置中。

## 问题反馈

如果您在使用过程中遇到任何问题，或有任何功能建议，请在 GitHub 上提交 issue。

## 许可证

MIT
