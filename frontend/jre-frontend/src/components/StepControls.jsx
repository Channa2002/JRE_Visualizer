import { useEffect, useRef, useState } from 'react'
import {
  SkipBack, ChevronLeft, ChevronRight, SkipForward,
  Play, Pause, Rewind, FastForward, Gauge
} from 'lucide-react'
import EventBadge from './EventBadge'

// Speed options: label shown to user + interval in ms
const SPEEDS = [
  { label: '0.25×', ms: 4000 },
  { label: '0.5×',  ms: 2400 },
  { label: '1×',    ms: 1200 },
  { label: '1.5×',  ms: 800  },
  { label: '2×',    ms: 600  },
  { label: '3×',    ms: 400  },
]
const DEFAULT_SPEED_IDX = 2  // 1×

export default function StepControls({ steps, currentStep, onStepChange }) {
  const [playing, setPlaying]       = useState(false)
  const [speedIdx, setSpeedIdx]     = useState(DEFAULT_SPEED_IDX)
  const intervalRef                 = useRef(null)
  const total                       = steps.length
  const step                        = steps[currentStep]
  const speed                       = SPEEDS[speedIdx]

  // Auto-play engine — restarts whenever playing/speed changes
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (playing) {
      intervalRef.current = setInterval(() => {
        onStepChange(prev => {
          if (prev >= total - 1) { setPlaying(false); return prev }
          return prev + 1
        })
      }, speed.ms)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, speed.ms, total])

  const go    = n  => { setPlaying(false); onStepChange(Math.max(0, Math.min(total - 1, n))) }
  const rewind  = () => go(Math.max(0, currentStep - 5))
  const forward = () => go(Math.min(total - 1, currentStep + 5))

  const pct = total > 1 ? (currentStep / (total - 1)) * 100 : 0

  // Scrub bar click
  const barRef = useRef(null)
  const handleBarClick = e => {
    const rect = barRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    go(Math.round(ratio * (total - 1)))
  }

  return (
    <div className="flex flex-col gap-3 bg-surface border border-border rounded-2xl p-4">

      {/* ── Step description ─────────────────────────────────────────── */}
      {step && (
        <div className="flex items-start gap-3 bg-card border border-border/60 rounded-xl px-4 py-3 min-h-[60px]">
          <div className="flex flex-col gap-1 shrink-0 pt-0.5">
            <span className="text-[10px] font-mono text-muted">
              {currentStep + 1} / {total}
            </span>
            <EventBadge type={step.eventType} />
          </div>
          <p className="text-sm text-text/80 leading-relaxed flex-1">{step.description}</p>
        </div>
      )}

      {/* ── Scrub bar ────────────────────────────────────────────────── */}
      <div
        ref={barRef}
        onClick={handleBarClick}
        className="relative h-2 bg-border rounded-full overflow-hidden cursor-pointer group"
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-200"
          style={{ width: `${pct}%` }}
        />
        {/* Thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-purple-500 shadow opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>

      {/* ── Controls row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap justify-between">

        {/* Left: navigation */}
        <div className="flex items-center gap-1">
          {/* First */}
          <button onClick={() => go(0)} disabled={currentStep === 0}
            title="First step (Home)"
            className="p-2 rounded-lg border border-border bg-card hover:bg-border disabled:opacity-30 transition-all">
            <SkipBack size={14} className="text-muted"/>
          </button>

          {/* Rewind 5 */}
          <button onClick={rewind} disabled={currentStep === 0}
            title="Rewind 5 steps"
            className="p-2 rounded-lg border border-border bg-card hover:bg-border disabled:opacity-30 transition-all">
            <Rewind size={14} className="text-muted"/>
          </button>

          {/* Prev 1 */}
          <button onClick={() => go(currentStep - 1)} disabled={currentStep === 0}
            title="Previous step (←)"
            className="p-2 rounded-lg border border-border bg-card hover:bg-border disabled:opacity-30 transition-all">
            <ChevronLeft size={14} className="text-muted"/>
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => setPlaying(p => !p)}
            disabled={currentStep === total - 1 && !playing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-accent hover:bg-accent/90
                       text-white font-bold text-sm transition-all shadow-accent-glow
                       disabled:opacity-40 mx-1"
          >
            {playing ? <Pause size={15}/> : <Play size={15}/>}
            {playing ? 'Pause' : 'Play'}
          </button>

          {/* Next 1 */}
          <button onClick={() => go(currentStep + 1)} disabled={currentStep === total - 1}
            title="Next step (→)"
            className="p-2 rounded-lg border border-border bg-card hover:bg-border disabled:opacity-30 transition-all">
            <ChevronRight size={14} className="text-muted"/>
          </button>

          {/* Forward 5 */}
          <button onClick={forward} disabled={currentStep === total - 1}
            title="Forward 5 steps"
            className="p-2 rounded-lg border border-border bg-card hover:bg-border disabled:opacity-30 transition-all">
            <FastForward size={14} className="text-muted"/>
          </button>

          {/* Last */}
          <button onClick={() => go(total - 1)} disabled={currentStep === total - 1}
            title="Last step (End)"
            className="p-2 rounded-lg border border-border bg-card hover:bg-border disabled:opacity-30 transition-all">
            <SkipForward size={14} className="text-muted"/>
          </button>
        </div>

        {/* Right: speed control */}
        <div className="flex items-center gap-2">
          <Gauge size={13} className="text-muted shrink-0"/>
          <span className="text-[11px] text-muted font-mono">Speed</span>
          <div className="flex items-center gap-1">
            {SPEEDS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setSpeedIdx(i)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono font-semibold transition-all
                  ${speedIdx === i
                    ? 'bg-accent text-white shadow-accent-glow'
                    : 'border border-border text-muted hover:text-text hover:border-muted'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}