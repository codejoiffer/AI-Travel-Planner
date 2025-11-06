# AI Travel Planner (Web)

一个最小可运行的 Web 版 AI 旅行规划师骨架，包含前端（Next.js）与后端（API 路由），语音输入占位实现、行程生成示例、预算估算与地图展示（高德），支持 Supabase 云端同步行程与费用记录（已包含迁移与 RLS）。

## 功能

- 语音输入（浏览器录音，后端识别接口占位返回示例文本）
- 行程生成（后端示例计划，后续可接入阿里云百炼 LLM）
- 预算估算（基于行程的简单估算）
- 地图展示（高德地图，显示兴趣点）
- 行程保存与费用记录（Supabase 云同步，未配置时回退本地内存）

## 环境变量

参考 `.env.example`，在本地创建 `.env` 并填入（前端与后端均需配置 Supabase）：

```
APPID=
SPEECH_API_KEY=
SPEECH_API_SECRET=

MAPS_API_KEY=
MAPS_PROVIDER=gaode
NEXT_PUBLIC_MAPS_API_KEY=
NEXT_PUBLIC_AMAP_SECURITY_JS_CODE=

AccessKey=
LLM_API_KEY=
LLM_PROVIDER=aliyun

SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# 可选：本地策略检查脚本使用
SUPABASE_SERVICE_ROLE_KEY=
```

注意：不要在仓库中提交任何真实的密钥。部署时通过环境注入，或在设置页输入。

提示：当 `.env`/`.env.local` 中已正确配置 Supabase（服务端与前端变量均设置）时，应用默认启用“云同步”。若缺失相关变量，则自动回退到内存存储，仅用于开发调试（刷新后不保留数据）。

## 本地运行

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

## Docker 构建与运行

```bash
docker build -t ai-travel-planner:latest .
docker run --env-file ./.env -p 3000:3000 ai-travel-planner:latest
```

### 直接下载镜像文件（无需登录镜像仓库）

在每次 CI 运行后，GitHub Actions 会上传可下载的镜像文件（`.tar`）：

- 进入仓库的 `Actions` > 选择最近一次工作流 > `Artifacts`
- 下载 `ai-travel-planner-image-<commit-sha>`（包含 `ai-travel-planner-<commit-sha>.tar`）
- 本地加载并运行：

```bash
docker load -i ai-travel-planner-<commit-sha>.tar
# 镜像名称为 <owner>/<repo>:<commit-sha>
# 例如：codejoiffer/AI-Travel-Planner:<commit-sha>
docker run --env-file ./.env -p 3000:3000 <owner>/<repo>:<commit-sha>
```

如果是打了 `v*` tag 的构建，还会在 GitHub Releases 中附带镜像 `.tar` 文件，无需登录即可下载。

## GitHub Actions（示例）
参考 `assignment.md` 与仓库内 `.github/workflows/docker.yml` 的工作流，配置 ACR 登录与镜像推送。

触发与分支：已支持 `main` 与 `master` 的 push，以及手动触发（workflow_dispatch）。

在仓库 Settings > Secrets 中添加：

- `ACR_REGISTRY`：如 `registry.cn-hangzhou.aliyuncs.com`
- `ACR_NAMESPACE`：你的命名空间，如 `your-namespace`
- `ACR_USERNAME` / `ACR_PASSWORD`：用于 `docker login` 的凭据

Actions 会构建镜像并以 `${{ github.sha }}` 作为标签推送至：

```
${ACR_REGISTRY}/${ACR_NAMESPACE}/ai-travel-planner:${GITHUB_SHA}
```

拉取并运行（示例，替换命名空间与标签）：

```bash
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:<commit-sha>
docker run --env-file ./.env -p 3000:3000 registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:<commit-sha>

主分支还会推送 `latest` 标签：

```bash
docker pull registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
docker run --env-file ./.env -p 3000:3000 registry.cn-hangzhou.aliyuncs.com/your-namespace/ai-travel-planner:latest
```
```

## Supabase 数据库设置

1. **创建数据库表**: 运行提供的迁移脚本创建 `trips` 与 `expenses` 表
2. **启用邮箱验证**: 在 Supabase 控制台 > Authentication > Settings 中配置邮箱设置
3. **配置环境变量**: 确保 `.env` 文件包含正确的 Supabase URL 和匿名密钥

迁移脚本位置:

- 行程：`supabase/migrations/001_create_trips_table.sql`
- 费用：`supabase/migrations/002_create_expenses_table.sql`

两张表均已启用 RLS（行级安全策略），确保用户只能访问自己的数据。

## 后续接入建议

- 将 `/api/speech/recognize` 接入科大讯飞 SDK 或 HTTP API。
- 将 `/api/plan/create` 接入阿里云百炼 LLM，并返回更细致、可编辑的行程结构（含经纬度）。
- 用 Supabase Auth 做登录注册，并用数据库存储用户行程与偏好。
- 添加费用记录功能，支持语音输入开销记录
- 实现多设备同步，确保行程数据云端备份

## 批改用密钥（作业要求）

若未使用阿里云的 API Key，请在此提供用于批改的“临时密钥”，有效期至少 3 个月：

```
# 示例占位，提交前替换为真实值（或提供获取方式）
LLM_API_KEY_FOR_GRADING=***
MAPS_API_KEY_FOR_GRADING=***
SPEECH_API_KEY_FOR_GRADING=***
SPEECH_API_SECRET_FOR_GRADING=***
```

注意：不要在代码中硬编码密钥。推荐在应用设置页输入或通过环境变量注入；仅在 README 的“批改用密钥”区域按作业要求提供评测所需信息。
