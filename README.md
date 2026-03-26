# 最大流算法 AI 可视化 (MaxFlow AI Visualizer)

这是一个基于 React + Vite + D3.js 开发的最大流算法（双标号法）可视化工具，集成了 Google Gemini 和 DeepSeek AI 助手。

## 功能特点

- **可视化交互**：支持手动构建图（添加节点、连线、设置容量）。
- **算法演示**：分步演示 Ford-Fulkerson 算法（双标号法），支持自动播放。
- **AI 场景生成**：输入主题（如“城市供水”），AI 自动生成对应的流网络。
- **AI 步骤解释**：AI 实时解释算法每一步的逻辑，适合教学。

## 本地开发

1. 安装依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

## 部署到 GitHub Pages

该项目已配置为支持 GitHub Pages 部署。

### 方式一：使用 gh-pages 脚本 (推荐)

1. 安装 `gh-pages` 依赖：
   ```bash
   npm install -D gh-pages
   ```

2. 在 `package.json` 中添加以下脚本：
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

3. 运行部署命令：
   ```bash
   npm run deploy
   ```

### 方式二：手动部署

1. 运行构建命令：
   ```bash
   npm run build
   ```

2. 将生成的 `dist` 目录下的所有文件上传到 GitHub 仓库的 `gh-pages` 分支。

## 注意事项

- **API Key**：为了安全，AI 功能需要用户在界面中手动输入自己的 API Key（Google AI Studio 或 DeepSeek）。这些 Key 仅保存在浏览器本地，不会上传到服务器。
- **HTTPS**：GitHub Pages 默认使用 HTTPS，确保所有外部资源也通过 HTTPS 加载。
