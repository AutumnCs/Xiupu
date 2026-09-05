# 秀谱 XiuPu

秀演创作工作台。本地体验版提供需求解析、创意方向、方案 cue 表、反馈改稿和版本对比。

## 本地运行

```bash
bun install
Copy-Item .env.example .env
bun run dev
```

在 `.env` 中填入任意 OpenAI 兼容服务的 `AI_PROVIDER_BASE_URL`、`AI_PROVIDER_API_KEY` 和 `AI_PROVIDER_MODEL`，然后打开 [http://localhost:3000](http://localhost:3000)。密钥只在服务端 API 路由中使用。

本阶段采用本地 HTTP-only 访客 Cookie，不需要注册或数据库。Supabase 的认证、项目持久化和文件存储将在下一阶段引入。

## 验证与部署

```bash
bun run lint
bun run build
```

可部署到任意支持 Next.js 的主机；部署环境同样配置上述三个 AI 环境变量。
