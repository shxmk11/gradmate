import { useState } from 'react'
import type { SemesterGpa } from '../utils/gpa'

const WIDTH = 640
const HEIGHT = 220
const PAD = { top: 16, right: 56, bottom: 32, left: 36 }
const SCALE_MAX = 4.5

// 성적 범위에 맞춘 세로축: 최소·최대값에 여백을 두고 0.1 단위로 맞춤
function calcScale(values: number[]) {
  const lo = values.length ? Math.min(...values) : 0
  const hi = values.length ? Math.max(...values) : SCALE_MAX
  let min = Math.floor((lo - 0.1) * 10) / 10
  let max = Math.ceil((hi + 0.1) * 10) / 10
  // 차이가 너무 작으면 최소 0.6 폭 확보
  if (max - min < 0.6) {
    const mid = (min + max) / 2
    min = mid - 0.3
    max = mid + 0.3
  }
  min = Math.max(0, Math.round(min * 10) / 10)
  max = Math.min(SCALE_MAX, Math.round(max * 10) / 10)

  const step = [0.1, 0.2, 0.25, 0.5, 1].find((s) => (max - min) / s <= 5) ?? 1
  const ticks: number[] = []
  for (let t = Math.ceil(min / step) * step; t <= max + 1e-9; t += step) {
    ticks.push(Math.round(t * 100) / 100)
  }
  return { min, max, ticks }
}

const SERIES = [
  { key: 'gpa', label: '학기별', color: '#a78bfa', dash: '5 4' },
  { key: 'cumulativeGpa', label: '누적', color: '#5b21b6', dash: undefined },
] as const

const shortSemester = (s: SemesterGpa) => {
  const name = s.semester.replace('학기', '')
  return `${String(s.year).slice(2)}-${name}`
}

interface Props {
  data: SemesterGpa[]
}

function GpaChart({ data }: Props) {
  const [hover, setHover] = useState<number | null>(null)

  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const step = data.length > 1 ? innerW / (data.length - 1) : 0
  const x = (i: number) => PAD.left + (data.length > 1 ? i * step : innerW / 2)
  const scale = calcScale(
    data.flatMap((d) =>
      [d.gpa, d.cumulativeGpa].filter((v): v is number => v !== null),
    ),
  )
  const y = (v: number) =>
    PAD.top + innerH - ((v - scale.min) / (scale.max - scale.min)) * innerH
  const band = data.length > 1 ? step : innerW

  const hovered = hover !== null ? data[hover] : null

  // 마지막 값 라벨 두 개가 겹치지 않도록 세로 위치 조정
  const lastValues = SERIES.map((s) => {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i][s.key]
      if (v !== null) return y(v)
    }
    return null
  })
  const labelY = [...lastValues]
  const MIN_GAP = 14
  if (labelY[0] !== null && labelY[1] !== null) {
    const diff = Math.abs(labelY[0] - labelY[1])
    if (diff < MIN_GAP) {
      const shift = (MIN_GAP - diff) / 2
      const upper = labelY[0] <= labelY[1] ? 0 : 1
      labelY[upper] = labelY[upper]! - shift
      labelY[1 - upper] = labelY[1 - upper]! + shift
    }
  }

  return (
    <div className="relative">
      <div className="mb-3 flex gap-4 text-xs text-gray-500">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <svg width="18" height="8" aria-hidden="true">
              <line
                x1="0"
                y1="4"
                x2="18"
                y2="4"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.dash}
              />
            </svg>
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="학기별 및 누적 GPA 추이"
        onMouseLeave={() => setHover(null)}
      >
        {scale.ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#f3f4f6"
            />
            <text
              x={PAD.left - 8}
              y={y(t)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-gray-400 text-[11px]"
            >
              {t.toFixed(Math.round(t * 100) % 10 === 0 ? 1 : 2)}
            </text>
          </g>
        ))}

        {data.map((d, i) => (
          <text
            key={`${d.year}-${d.semester}`}
            x={x(i)}
            y={HEIGHT - 10}
            textAnchor="middle"
            className="fill-gray-400 text-[11px]"
          >
            {shortSemester(d)}
          </text>
        ))}

        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="#e5e7eb"
          />
        )}

        {SERIES.map((s, si) => {
          const points = data
            .map((d, i) => ({ i, v: d[s.key] }))
            .filter((p): p is { i: number; v: number } => p.v !== null)
          const last = points[points.length - 1]

          return (
            <g key={s.key}>
              <polyline
                points={points.map((p) => `${x(p.i)},${y(p.v)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.dash}
                strokeLinejoin="round"
              />
              {points.map((p) => (
                <circle
                  key={p.i}
                  cx={x(p.i)}
                  cy={y(p.v)}
                  r={hover === p.i ? 5 : 4}
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}
              {last && (
                <text
                  x={x(last.i) + 10}
                  y={labelY[si] ?? y(last.v)}
                  dominantBaseline="middle"
                  className="fill-gray-600 text-[11px] font-medium"
                >
                  {last.v.toFixed(2)}
                </text>
              )}
            </g>
          )
        })}

        {data.map((d, i) => (
          <rect
            key={`hit-${d.year}-${d.semester}`}
            x={x(i) - band / 2}
            y={PAD.top}
            width={band}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hovered && hover !== null && (
        <div
          className="pointer-events-none absolute top-8 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm"
          style={{
            left: `${(x(hover) / WIDTH) * 100}%`,
            transform:
              x(hover) > WIDTH / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)',
          }}
        >
          <p className="mb-1 font-medium text-gray-900">
            {hovered.year}년 {hovered.semester}
          </p>
          <p className="text-gray-500">
            학기별 {hovered.gpa?.toFixed(2) ?? '-'}
          </p>
          <p className="text-gray-500">
            누적 {hovered.cumulativeGpa?.toFixed(2) ?? '-'}
          </p>
          <p className="text-gray-400">취득 {hovered.earnedCredits}학점</p>
        </div>
      )}
    </div>
  )
}

export default GpaChart
