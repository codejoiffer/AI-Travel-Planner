# 作业提交（AI Travel Planner）

## 1. GitHub 仓库地址

- https://github.com/codejoiffer/AI-Travel-Planner

## 2. README 运行说明（摘要）

本地运行：

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

Docker 构建与运行：

```bash
docker build -t ai-travel-planner:latest .
docker run --env-file ./.env -p 3000:3000 ai-travel-planner:latest
```

## 3. Docker 镜像下载地址（示例）

GitHub Actions 已配置推送到阿里云 ACR。镜像地址格式：

```
registry.cn-hangzhou.aliyuncs.com/<your-namespace>/ai-travel-planner:<commit-sha>
```

请将上面占位的 `<your-namespace>` 与 `<commit-sha>` 替换为实际值（可在 Actions 日志中查看）。

拉取并运行示例：

```bash
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:<commit-sha>
docker run --env-file ./.env -p 3000:3000 registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:<commit-sha>
```

## 4. 环境变量与密钥

请参考仓库根目录的 `README.md` 与 `.env.example`，在本地创建 `.env` 并填入所需的键值。

若未使用阿里云的 API Key，请按作业要求在 README 提供“批改用密钥”（有效期至少 3 个月）。

---

打印为 PDF 指南：

1. 打开此 Markdown 文件（或仓库 README）在浏览器渲染页面；
2. 使用浏览器“打印”功能选择“存储为 PDF”；
3. 合并仓库地址与 README 内容后，上传该 PDF 完成作业提交。

