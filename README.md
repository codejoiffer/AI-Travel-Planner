# LLM Course · AI Travel Planner

一个基于 Next.js 的 AI 旅行规划应用，包含前端界面与后端 API 路由，集成语音识别、行程规划、地图服务、行程与费用管理、限流与容错等能力。本文档聚焦于程序功能实现与架构说明；助教拉取与验收指南请参见 `docs/ta-check.md`。

## 项目概述

- 技术栈：`Next.js`（前端 + API 路由）、`Node.js`、`Docker`
- 目标：提供从“语音输入/文本偏好”到“多天行程 + 地图显示 + 预算估算 + 云端存储”的端到端体验
- 发布：已构建并推送公开镜像至阿里云 ACR（详情见 `docs/ta-check.md`）

## 程序功能

- 语音识别：浏览器录音，后端 `/api/speech/recognize` 对接科大讯飞（未配置密钥时提示缺失）
- 智能行程规划：`/api/plan/create` 支持目的地、天数、预算、偏好等；注入 `LLM_PROVIDER=aliyun` 与 `LLM_API_KEY` 时调用百炼（Qwen），否则降级为示例数据
- 地图集成：前端加载高德 JS API（`NEXT_PUBLIC_MAPS_API_KEY`）；服务端代理高德 Web 服务（`/api/amap/{service}`，需 `MAPS_API_KEY`）
- 行程数据：`/api/trips` 获取/新增/删除，默认内存存储；配置 Supabase 后按用户鉴权访问
- 费用记录：`/api/expenses` 按行程记录与管理，需用户鉴权（Supabase）
- 预算估算：`/api/budget` 与前端组件协同，基于行程内容估算预算
- 限流与容错：内置基于 IP+Path 的限流器；缺失外部密钥时降级为示例/报错提示

## 系统架构

- 前端页面（`pages/*.jsx`）
  - `index.jsx`：首页与欢迎模块、语音输入入口、地图加载
  - `plan.jsx`：目的地与偏好设置，展示生成的多天行程
  - `trips.jsx`：用户行程列表（内存或 Supabase）
  - `expenses.jsx`：费用记录列表与新增/删除
- 关键组件（`components/*`）
  - `PlanSettingsCard`：目的地/天数/预算/偏好表单
  - `PlanResults`：按日行程、地图中心与 POI 展示
  - `MapPanel`：高德地图渲染与标注/路线
  - `VoiceInputCard`：录音与语音识别触发
  - `SavedTripsCard`、`ExpensesListCard`：行程与费用列表
- 后端 API 路由（`pages/api/*`）
  - `amap/[service].js`：统一代理高德 Web 服务（地理编码、输入提示、周边、驾车路线、静态图等）
  - `plan/create.js`：行程生成（LLM 或内置示例），返回 `center`/`pois`/`itinerary`/`meta`
  - `speech/recognize.js`：语音识别（PCM Base64 → 文本）
  - `trips.js`：行程的获取/新增/删除（内存或 Supabase）
  - `expenses.js`：费用记录的获取/新增/删除（需鉴权）
- 工具模块（`utils/*`）
  - `amap.js`：高德 JS API 加载与 Web 服务封装（键值读取自环境变量）
  - `rate-limit.js`：简单限流器（IP + 路径）
  - `trips.js`：行程数据存取封装（内存与 Supabase）
- 数据层与存储
  - Supabase：`supabase/migrations/*.sql` 提供建表与 RLS（行级安全）策略，前后端共用 `SUPABASE_URL/ANON_KEY`
  - 内存模式：未配置 Supabase 时自动回退（开发/验收用），刷新不保留数据
- 配置与构建
  - `next.config.js`：Next 构建与运行配置
  - `Dockerfile`：基于 `node:20-alpine` 构建，生产安装与运行

## 目录结构（摘录）

- `pages/`：前端页面与 API 路由
- `components/`：功能组件，如地图、行程、费用、录音等
- `utils/`：地图封装、限流器、数据访问等
- `supabase/migrations/`：数据库表与 RLS 策略
- `docs/ta-check.md`：助教拉取与验收指南（公开镜像、环境注入与 API 示例）

## 开发与运行

- 本地开发：
  - `npm install`
  - `npm run dev`（打开 `http://localhost:3000`）
- Docker 本地构建：
  - `docker build -t llm_course:local .`
  - `docker run --rm -p 3000:3000 llm_course:local`
- 运行时环境变量：
  - 地图：`NEXT_PUBLIC_MAPS_API_KEY`（前端）、`NEXT_PUBLIC_AMAP_SECURITY_JS_CODE`（可选）、`MAPS_API_KEY`（服务端）
  - Supabase：`SUPABASE_URL`、`SUPABASE_ANON_KEY`
  - 语音识别：`APPID`、`SPEECH_API_KEY`、`SPEECH_API_SECRET`
  - 规划 LLM：`LLM_PROVIDER`（如 `aliyun`）、`LLM_API_KEY`
  - 更多运行示例与一键命令见：`docs/ta-check.md`

## API 概览（摘要）

- 地图代理：`GET /api/amap/{service}`（`geocode`、`inputTips`、`placeAround`、`directionDriving`、`staticMap`）
- 行程规划：`POST /api/plan/create`
- 语音识别：`POST /api/speech/recognize`
- 行程存储：`GET|POST|DELETE /api/trips`
- 费用记录：`GET|POST|DELETE /api/expenses`

接口入参与示例详见 `docs/ta-check.md`。

## CI/CD 与发布

- GitHub Actions：见 `.github/workflows/docker.yml`，自动构建并推送至阿里云 ACR
- 本地推送脚本：`scripts/push_acr.sh` 支持 `latest`/`SHA`/`v*` 标签与 VPC 域名
- 镜像信息与拉取运行命令：详见 `docs/ta-check.md`

## 设计与容错

- 缺失外部服务密钥时的降级策略：
  - 行程规划：返回示例计划
  - 地图代理：返回 `400 Bad Request`
  - 语音识别：返回缺失密钥错误
  - 行程/费用：未配置 Supabase 时使用内存模式；费用接口默认需鉴权
- 限流：基于 IP 与路径，减少接口滥用
- 错误处理：统一返回结构与状态码，日志打印关键路径

## 安全与合规

- 请勿在仓库提交真实密钥；推荐通过运行时环境变量注入
- 课程示例值仅用于验收，勿用于生产；完成后清理容器与历史命令

## 相关文档

- 助教拉取与验收指南：`docs/ta-check.md`
- 作业提交说明：`docs/submission.md`

