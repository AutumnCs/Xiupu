import type {
  StructuredRequirement,
  CreativeDirection,
  PlanSnapshot,
  PerformanceDraft,
  ImpactReport,
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

export const FALLBACK_PERFORMANCE: PerformanceDraft = {
  title: "从个体到共生",
  theme: "让离散的个体在光与动作中逐步连接，最终形成集体能量。",
  overview: "以克制开场、连接发展、群体爆发收束，主 LED 始终服务舞者关系变化。",
  sections: [
    { id: "s1", label: "开场 · 个体苏醒", durationLabel: "约30秒", staging: "舞者分散静置，领舞以单点动作唤醒空间。", blocking: "左右入口分批进入，保持疏离距离。", visual: "微光粒子缓慢漂浮", lighting: "冷蓝低亮度顶光" },
    { id: "s2", label: "发展 · 关系建立", durationLabel: "约45秒", staging: "舞者以镜像、呼应动作建立连接。", blocking: "两组由两侧向中心交换推进。", visual: "粒子连线形成光路", lighting: "蓝青渐亮，侧光勾轮廓" },
    { id: "s3", label: "转场 · 能量汇聚", durationLabel: "约30秒", staging: "动作由个体节拍转为共同脉冲。", blocking: "队列穿插后形成中心通道。", visual: "数据流向中心收束", lighting: "扫光与低频脉冲同步" },
    { id: "s4", label: "高潮 · 群体共振", durationLabel: "约45秒", staging: "全体在同一节拍完成能量爆发。", blocking: "V字聚合，领舞居中。", visual: "全屏光网向外扩张", lighting: "暖金全场与追光" },
    { id: "s5", label: "结尾 · 品牌落点", durationLabel: "约30秒", staging: "群体定格，为品牌信息留出清晰落点。", blocking: "全体面向观众，中心留展示区。", visual: "品牌标识在光网中点亮", lighting: "暖金收束，保持可见度" },
  ],
};

/** 单节目完整 Cue 的服务不可用兜底数据。 */
export const FALLBACK_PLAN: PlanSnapshot = {
  segmentLabel: "完整节目 Cue · 从个体到共生",
  columns: ["time", "music", "speech", "formation", "visual", "lighting", "props"],
  rows: [
    { id: "c1", sectionId: "s1", durationSeconds: 30, time: "开场｜约30秒", music: "低频环境音进入", speech: "（无台词）", people: 12, lead: true, formationNote: "12人散点，领舞居中唤醒", visual: "主屏：粒子微光缓慢漂浮", lighting: "冷蓝顶光，低亮度", props: "无" },
    { id: "c2", sectionId: "s2", durationSeconds: 45, time: "发展｜约45秒", music: "节拍逐步叠加", speech: "旁白：个体，从未孤单。", people: 12, lead: false, formationNote: "两组镜像推进并向中心靠拢", visual: "主屏：粒子连线形成光路", lighting: "蓝转青，亮度上升", props: "无" },
    { id: "c3", sectionId: "s3", durationSeconds: 30, time: "转场｜约30秒", music: "鼓点收紧，转场音效进入", speech: "（无台词）", people: 12, lead: false, formationNote: "两列穿插，形成中心通道", visual: "主屏：数据流向中心收束", lighting: "扫光与低频脉冲同步", props: "无" },
    { id: "c4", sectionId: "s4", durationSeconds: 45, time: "高潮｜约45秒", music: "全奏爆发", speech: "（无台词）", people: 12, lead: true, formationNote: "全体聚合 V 字，领舞居中", visual: "主屏：全屏光网向外扩张", lighting: "暖金全场 + 追光领舞", props: "无" },
    { id: "c5", sectionId: "s5", durationSeconds: 30, time: "结尾｜约30秒", music: "品牌音效落点并收束", speech: "旁白：共生，方能抵达。", people: 12, lead: true, formationNote: "全体面向观众定格，中心留展示区", visual: "主屏：品牌标识在光网中点亮", lighting: "暖金收束，保持可见度", props: "无" },
  ],
};

export const FALLBACK_IMPACT: ImpactReport = {
  must: [{ id: "i1", level: "must", title: "相关 Cue 的视觉与灯光", detail: "反馈直接改变舞台画面，需要同步更新对应段落。", sectionIds: ["s4"], cueIds: ["c4"], departments: ["视觉", "灯光"] }],
  maybe: [{ id: "i2", level: "maybe", title: "演员调度", detail: "若视觉节奏改变，队形与动作可能需要微调。", sectionIds: ["s4"], cueIds: ["c4"], departments: ["演员/调度"] }],
  unaffected: [{ id: "i3", level: "unaffected", title: "开场结构", detail: "当前反馈不影响开场段落。", sectionIds: ["s1"], cueIds: ["c1"], departments: [] }],
};
