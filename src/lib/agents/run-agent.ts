import "server-only";
import { appAi } from "@/lib/ai/provider";

/**
 * 所有 Agent 共用的结构化 JSON 生成工具。
 * 强制模型返回可校验 JSON（不把 Markdown 当唯一数据源），
 * 并做健壮的解析与容错。密钥全部在服务端。
 */

type RunAgentJSONInput = {
  system: string;
  user: string;
  viewerUserId?: string;
  /** 温度等透传参数 */
  params?: Record<string, unknown>;
};

/** 从模型文本中稳健提取 JSON（容忍 ```json 代码块或前后噪声） */
function extractJSON(text: string): unknown {
  const trimmed = text.trim();
  // 优先剥离 ```json ... ``` 代码块
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    // 退而求其次：抓取第一个 { 到最后一个 }
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Agent 未返回可解析的 JSON");
  }
}

/**
 * 调用文本模型并返回解析后的 JSON 对象。
 * 返回 { data, raw }，raw 为原始文本便于排障。
 */
export async function runAgentJSON<T>(input: RunAgentJSONInput): Promise<{ data: T; raw: string }> {
  const completion = await appAi.chat({
    capability: "text",
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.user },
    ],
    // 引导模型输出 JSON；DeepSeek 支持 response_format
    response_format: { type: "json_object" },
    temperature: 0.7,
    ...(input.viewerUserId ? { viewer_user_id: input.viewerUserId } : {}),
    ...(input.params ?? {}),
  });

  const raw = completion?.choices?.[0]?.message?.content ?? "";
  const data = extractJSON(raw) as T;
  return { data, raw };
}
