"use client";

import type { PlanRow } from "@/lib/agents/types";

/** 队形示意图：编号圆点 + 领舞红色高亮，广播控台配色 */
export function FormationSvg({ row }: { row: PlanRow }) {
  const n = row.people;
  const cols = Math.ceil(Math.sqrt(n));
  const dots = [];
  const leadIndex = Math.floor(n / 2);
  for (let i = 0; i < n; i++) {
    const cx = 14 + (i % cols) * 24;
    const cy = 16 + Math.floor(i / cols) * 22;
    const isLead = row.lead && i === leadIndex;
    dots.push(
      <g key={i}>
        <circle cx={cx} cy={cy} r={7} fill={isLead ? "#ed3124" : "#2e5aa7"} />
        <text x={cx} y={cy + 3} fontSize={8} textAnchor="middle" fill="#fff" fontWeight={900}>
          {i + 1}
        </text>
      </g>,
    );
  }
  return (
    <div className="sm-fm">
      <svg viewBox="0 0 120 90">{dots}</svg>
      <small>{row.formationNote}</small>
    </div>
  );
}
