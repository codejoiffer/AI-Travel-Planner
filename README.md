# AI Travel Planner (Web)

一个最小可运行的 Web 版 AI 旅行规划师骨架，包含前端（Next.js）与后端（API 路由），语音输入占位实现、行程生成示例、预算估算与地图展示（高德）。

## 功能

- 语音输入（浏览器录音，后端识别接口占位返回示例文本）
- 行程生成（后端示例计划，后续可接入阿里云百炼 LLM）
- 预算估算（基于行程的简单估算）
- 地图展示（高德地图，显示兴趣点）
- 行程保存（内存存储占位；可接 Supabase）

## 环境变量

参考 `.env.example`，在本地创建 `.env` 并填入：

```
APPID=
SPEECH_API_KEY=
SPEECH_API_SECRET=

MAPS_API_KEY=
MAPS_PROVIDER=gaode
NEXT_PUBLIC_MAPS_API_KEY=

AccessKey=
LLM_API_KEY=
LLM_PROVIDER=aliyun

SUPABASE_URL=
SUPABASE_ANON_KEY=
```

注意：不要在仓库中提交任何真实的密钥。部署时通过环境注入，或在设置页输入。

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

## GitHub Actions（示例）

参考 `assignment.md` 中的工作流示例，配置 ACR 登录与镜像推送。

## Supabase 数据库设置

1. **创建数据库表**: 运行提供的迁移脚本创建 `trips` 表
2. **启用邮箱验证**: 在 Supabase 控制台 > Authentication > Settings 中配置邮箱设置
3. **配置环境变量**: 确保 `.env` 文件包含正确的 Supabase URL 和匿名密钥

迁移脚本位置: `supabase/migrations/001_create_trips_table.sql`

## 后续接入建议

- 将 `/api/speech/recognize` 接入科大讯飞 SDK 或 HTTP API。
- 将 `/api/plan/create` 接入阿里云百炼 LLM，并返回更细致、可编辑的行程结构（含经纬度）。
- 用 Supabase Auth 做登录注册，并用数据库存储用户行程与偏好。
- 添加费用记录功能，支持语音输入开销记录
- 实现多设备同步，确保行程数据云端备份

