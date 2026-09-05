import type {
  StructuredRequirement,
  CreativeDirection,
  PlanSnapshot,
  ChangeProposal,
} from "./types";

/**
 * 固定演示案例的预置数据。
 * 用途：1) AI 调用失败时的兜底；2) 尚未接入的阶段（方案表/反馈分析）的占位数据。
 * 后续这些占位会被对应 Agent 的真实输出替换。
 */

export const CASE_BRIEF =
  "3分钟科技品牌开场秀，主题「从个体到共生」；12名舞者（含1名领舞）；主LED屏，左右两个出入口；情绪从克制到连接再到爆发；结尾需体现品牌力量感。";

export const FALLBACK_REQUIREMENT: StructuredRequirement = {
  fixed: [
    "节目类型：科技品牌开场秀",
    "时长：180 秒（3 分钟）",
    "主题：从个体到共生",
    "舞台：主 LED 屏 + 左右出入口",
  ],
  creative: ["演绎形式与队形编排", "情绪曲线：克制 → 连接 → 爆发", "LED 视觉动势与灯光设计"],
  pending: [
    "领舞是否单独亮相？（默认假设：领舞在爆发段居中亮相）",
    "结尾是否保留中央展示区？（待导演确认）",
  ],
};

export const FALLBACK_DIRECTIONS: CreativeDirection[] = [
  { id: "d1", title: "粒子共生", concept: "个体如离散粒子，逐步吸附成整体，LED 呈现数据流汇聚。", format: "群舞 + 粒子投影", arc: "离散 → 吸引 → 融合爆发", keyMoments: "0:45 首次聚合 / 2:30 全体共振", difficulty: "中" },
  { id: "d2", title: "镜像回响", concept: "双人镜像结构对称展开，象征个体与群体的呼应关系。", format: "对称双列 + 镜面 LED", arc: "独舞 → 镜像 → 齐奏", keyMoments: "1:00 镜像分裂 / 2:40 合流", difficulty: "高" },
  { id: "d3", title: "光之脉络", concept: "以光带串联舞者走位，形成不断生长的神经网络意象。", format: "线性走位 + 光带追踪", arc: "单点 → 连线 → 全场脉动", keyMoments: "0:50 连线成型 / 2:35 全网点亮", difficulty: "低" },
];

/** 方案表（多专业内容 Agent 尚未接入，暂用预置片段：爆发段 120–180s） */
export const FALLBACK_PLAN: PlanSnapshot = {
  segmentLabel: "选定片段：高潮·爆发段（120s–180s）",
  columns: ["time", "music", "speech", "formation", "visual", "lighting", "props"],
  rows: [
    { time: "2:00–2:12", music: "低频脉冲进入，节拍 90BPM", speech: "（无台词）", people: 12, lead: true, formationNote: "12人散点，领舞居中", visual: "主屏：粒子微光缓慢漂浮", lighting: "冷蓝顶光，低亮度", props: "手持发光棒（每人1支）" },
    { time: "2:12–2:28", music: "鼓点叠加，能量渐强", speech: "旁白：「个体，从未孤单。」", people: 12, lead: true, formationNote: "向心聚拢成圆", visual: "主屏：粒子向中心汇聚", lighting: "蓝转青，亮度上升", props: "手持发光棒挥动" },
    { time: "2:28–2:44", music: "副歌前奏，弦乐铺垫", speech: "（无台词）", people: 12, lead: false, formationNote: "两列纵队交错推进", visual: "主屏：数据流汇成光柱", lighting: "青光扫射 + 频闪", props: "手持发光棒举高" },
    { time: "2:44–3:00", music: "全奏爆发 + 品牌音效落点", speech: "旁白：「共生，方能抵达。」", people: 12, lead: true, formationNote: "全体聚合 V 字，领舞居中亮相", visual: "主屏：全屏品牌 LOGO 点亮", lighting: "暖金全场 + 追光领舞", props: "手持发光棒同步熄灭定格" },
  ],
};

export const FEEDBACK_EXAMPLE = "人数改成8人；最后30秒更有力量感；不使用手持道具。";

/** 反馈影响分析 Agent 的兜底 ChangeProposal（含字段级修改指令） */
export const FALLBACK_PROPOSALS: ChangeProposal[] = [
  { id: "p1", title: "人数：12 人 → 8 人", before: "12 名舞者", after: "8 名舞者", reason: "导演要求缩减规模，需重排队形与画面密度。", deps: ["队形", "画面密度", "参考图"], edits: [{ rowIndex: -1, field: "people", value: 8 }] },
  { id: "p2", title: "结尾更有力量感（最后 30 秒）", before: "暖金全场 + 追光领舞", after: "暖金全场 + 频闪爆点 + 追光领舞", reason: "增强结尾情绪，需联动音乐节奏、灯光亮度与 LED 动势。", deps: ["音乐节奏", "灯光亮度", "LED 动势"], edits: [{ rowIndex: 3, field: "lighting", value: "暖金全场 + 频闪爆点 + 追光领舞" }, { rowIndex: 3, field: "music", value: "全奏爆发（+8% 力度）+ 品牌音效重击落点" }] },
  { id: "p3", title: "移除手持道具", before: "手持发光棒", after: "改为地面 LED 光带 / 徒手动作", reason: "删除手持道具，联动动作设计与视觉构图，并触发安全检查。", deps: ["动作设计", "视觉构图", "安全检查"], edits: [{ rowIndex: -1, field: "props", value: "无手持道具（改用地面 LED 光带）" }] },
];
