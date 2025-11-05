Web 版AI 旅行规划师 (AI Travel Planner)
一、说明：

软件旨在简化旅行规划过程，通过 AI 了解用户需求，自动生成详细的旅行路线和建议，并提供实时旅行辅助。



二、核心功能：

1、智能行程规划: 用户可以通过语音（或文字，语音功能一定要有）输入旅行目的地、日期、预算、同行人数、旅行偏好（例如：“我想去日本，5 天，预算 1 万元，喜欢美食和动漫，带孩子”），AI 会自动生成个性化的旅行路线，包括交通、住宿、景点、餐厅等详细信息。

2、费用预算与管理: 由 AI 进行预算分析，记录旅行开销（推荐可以使用语音）。

3、用户管理与数据存储:

注册登录系统: 用户可以保存和管理多份旅行计划。

云端行程同步: 旅行计划、偏好设置、费用记录等数据云端同步，方便多设备查看和修改。



三、技术栈（ Web）:自选，以下仅提供一些建议，不是严格要求。

语音识别：基于科大讯飞或其他语音识别 API 提供语音识别功能

地图导航：基于高德或百度地图 API 提供地理位置服务和导航功能

数据库/认证： Supabase，或Firebase Authentication 和 Firestore，或其它你认为合适的服务。

行程规划和费用预算：通过大语言模型完成形成规划和费用预算的估计，大语言模型 API 自选

UI/UX： 地图为主的交互界面，清晰的行程展示，美观的图片。



四、提交要求



提交一个 pdf 文件，该文件包含 GitHub repo 地址和 readme 文档。



项目代码提交在 GitHub 上，并提供可以直接下载运行的 docker image 文件和如何运行的 readme 文档（如果你用的不是阿里云的 API key（助教有阿里云百炼平台的 key），请将 key 提交在 readme 文档中，并保证 3 个月内可用，供助教批改作业使用）。保留尽可能多的、详细的GitHub 提交记录。



PS. 可以通过 Github Actions 将项目打包成 Docker 镜像并推送到阿里云镜像仓库中，相关的操作可以查阅官方文档或通过大模型完成。



五、注意事项

切记不要将任何 API key 写在代码中，尤其是 GitHub 上公开的代码库。建议在程序设置页面增加一个输入 key 的输入窗口或通过配置文件来指定 API Key。

六、实现方案与运行指南（基于 api.md）

一）服务与配置选择（已在 api.md 指定）

- 语音识别：科大讯飞（使用 `APPID`、`SPEECH_API_KEY`、`SPEECH_API_SECRET`）
- 地图导航：高德地图（使用 `MAPS_API_KEY`，`MAPS_PROVIDER=gaode`）
- 大语言模型：阿里云百炼（使用 `LLM_PROVIDER=aliyun`、`LLM_API_KEY`、`AccessKey`）
- 数据库与认证：Supabase（使用 `SUPABASE_URL`、`SUPABASE_ANON_KEY`）

注意：`api.md` 中的值仅用于本地调试参考，提交代码与镜像时请改用环境变量或在设置页输入，不要将任何 key 写入仓库。

二）环境变量约定（.env 示例）

将以下变量写入 `.env` 或部署平台的环境配置，避免明文密钥进入仓库：

```
APPID=
SPEECH_API_KEY=
SPEECH_API_SECRET=

MAPS_API_KEY=
MAPS_PROVIDER=gaode

AccessKey=
LLM_API_KEY=
LLM_PROVIDER=aliyun

SUPABASE_URL=
SUPABASE_ANON_KEY=
``` 

三）功能实现方案（对齐核心功能）

- 智能行程规划：
  - 前端提供语音与文字输入；语音通过浏览器录音上传到后端语音识别服务（科大讯飞），得到文本意图。
  - 后端调用阿里云百炼大模型，基于意图生成行程（交通/住宿/景点/餐厅/时间线）。
  - 将生成结果结构化为天列表与地理坐标，前端用高德地图展示线路与兴趣点。
- 费用预算与管理：
  - 基于行程结果调用大模型估算预算（交通/住宿/餐饮/门票等分项）。
  - 用户可语音追加开销，后端写入 Supabase；前端展示累计与剩余预算。
- 用户管理与数据存储：
  - 使用 Supabase Auth 登录注册；
  - 行程、偏好与费用记录存入 Supabase（按用户隔离，支持多份计划）。

四）前后端与接口约定（建议）

- 前端：Next.js 或 Vite + React，地图采用高德 JS SDK；UI 使用 Tailwind/Ant Design。
- 后端：Node.js（Express/NestJS），提供以下 REST 接口：
  - `POST /api/speech/recognize`：上传音频，返回识别文本。
  - `POST /api/plan/create`：输入目的地/日期/预算/偏好，返回结构化行程。
  - `POST /api/budget/estimate`：输入行程，返回预算估算与分项。
  - `GET /api/trips` / `POST /api/trips`：读取/保存行程计划（Supabase）。

五）本地运行（示例流程）

- 准备 `.env`（参考上文），确保不要提交真实值到仓库。
- 安装依赖并启动开发：
  - `npm install` 或 `pnpm install`
  - `npm run dev` 启动前端与后端（或分别启动）。
- 将 `api.md` 的键值迁移到本机 `.env` 或应用设置页测试，仓库不保留密钥。

六）Docker 构建与运行（示例）

- 构建：`docker build -t ai-travel-planner:latest .`
- 运行（加载环境变量）：`docker run --env-file ./.env -p 3000:3000 ai-travel-planner:latest`

示例 Dockerfile（按所选框架调整）：

```
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --ignore-scripts
EXPOSE 3000
CMD ["npm","start"]
```

七）GitHub Actions（打包并推送到阿里云镜像仓库示例）

在仓库设置 Secrets：`ACR_REGISTRY`、`ACR_NAMESPACE`、`ACR_USERNAME`、`ACR_PASSWORD`。

```
name: Docker CI
on:
  push:
    branches: [ main ]
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - name: Login to ACR
        run: |
          echo ${{ secrets.ACR_PASSWORD }} | docker login ${{ secrets.ACR_REGISTRY }} -u ${{ secrets.ACR_USERNAME }} --password-stdin
      - name: Build and push
        run: |
          docker build -t ${{ secrets.ACR_REGISTRY }}/${{ secrets.ACR_NAMESPACE }}/ai-travel-planner:${{ github.sha }} .
          docker push ${{ secrets.ACR_REGISTRY }}/${{ secrets.ACR_NAMESPACE }}/ai-travel-planner:${{ github.sha }}
```

八）提交 PDF 的建议内容

- GitHub 仓库地址与 README 运行说明（包含环境变量约定与 Docker 指令）。
- 使用截图：语音输入、地图展示、行程与预算页面。
- 镜像仓库地址与版本标签。
- 重要说明：不在仓库内包含任何真实密钥；如非阿里云模型，按作业要求在 README 内提供用于批改的临时 key（保留 3 个月）。

九）Key 安全与设置页

- 应用内提供“设置”页面，让用户在本地输入/更新 key 并保存在浏览器安全存储或后端密钥管理（不写入代码仓库）。
- 生产部署通过环境变量注入，不在镜像内硬编码。

十）后续优化建议

- 行程结果的可编辑性：用户拖拽调整时间线与景点顺序，同步预算更新。
- 多语言与多地区支持：按目的地自动选择货币与地图图层。
- 费用与优惠聚合：结合平台券/交通票价 API 实时更新预算。
