# 秀谱 XiuPu

秀演创作工作台。本地体验版提供需求解析、创意方向、方案 cue 表、反馈改稿和版本对比。

## 本地运行

```bash
bun install
Copy-Item .env.example .env
bun run dev
```

在 `.env` 中填入任意 OpenAI 兼容服务的 `AI_PROVIDER_BASE_URL`、`AI_PROVIDER_API_KEY` 和 `AI_PROVIDER_MODEL`，然后打开 [http://localhost:3000](http://localhost:3000)。密钥只在服务端 API 路由中使用。

当前 Demo 默认仍使用 HTTP-only 访客 Cookie；配置 Supabase 并执行 `supabase/migrations/20260906023000_projects.sql` 后，可以在版本记录区保存项目并生成分享链接。Supabase 的正式登录与文件存储留在后续阶段。

Supabase 项目配置：在 Vercel 中设置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 和服务端专用的 `SUPABASE_SERVICE_ROLE_KEY`。不要把 service role key 放进浏览器或提交到 Git。

## 验证与部署

```bash
bun run lint
bun run build
```

可部署到任意支持 Next.js 的主机；部署环境同样配置上述三个 AI 环境变量。
