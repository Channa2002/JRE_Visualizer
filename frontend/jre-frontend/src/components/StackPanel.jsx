import { useState } from 'react'
import { Layers, ChevronDown, ChevronRight } from 'lucide-react'

function VarRow({ v }) {
  const isRef = !v.isPrimitive && v.heapRef
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[#0d1b2e] border border-blue-900/40 text-xs font-mono gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-blue-500/60 shrink-0">{v.type}</span>
        <span className="text-blue-200 font-semibold truncate">{v.name}</span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {isRef ? (
          <>
            <span className="text-[10px] text-blue-500/50">ref →</span>
            <span className="text-emerald-400 font-bold">{v.value}</span>
          </>
        ) : (
          <span className="text-cyan-300">{v.value}</span>
        )}
      </div>
    </div>
  )
}

function Frame({ frame, isTop, index }) {
  const [open, setOpen] = useState(true)
  const vars = Object.values(frame.localVariables || {})
  const primitives = vars.filter(v => v.isPrimitive)
  const refs       = vars.filter(v => !v.isPrimitive)

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-300
      ${isTop
        ? 'border-blue-500/70 shadow-[0_0_18px_rgba(59,130,246,0.35)] bg-blue-950/30'
        : 'border-blue-900/40 bg-blue-950/10'}`}>

      {/* Frame header */}
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-900/20 transition-colors text-left">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isTop ? 'bg-blue-400 animate-pulse' : 'bg-blue-800'}`} />
        <span className="font-mono text-xs font-bold text-blue-300 flex-1 truncate">
          {frame.className}.<span className="text-blue-100">{frame.methodName}</span>()
        </span>
        <span className="text-[10px] text-blue-600 font-mono">line {frame.lineNumber}</span>
        {open ? <ChevronDown size={12} className="text-blue-500 shrink-0"/> : <ChevronRight size={12} className="text-blue-500 shrink-0"/>}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1">
          {vars.length === 0 && (
            <p className="text-[11px] text-blue-700 font-mono italic">— empty frame —</p>
          )}
          {primitives.length > 0 && (
            <div>
              <p className="text-[9px] text-blue-600/60 uppercase tracking-widest mb-1 font-mono">Primitives</p>
              <div className="space-y-1">{primitives.map(v => <VarRow key={v.name} v={v}/>)}</div>
            </div>
          )}
          {refs.length > 0 && (
            <div>
              <p className="text-[9px] text-blue-600/60 uppercase tracking-widest mb-1 font-mono">References (→ Heap)</p>
              <div className="space-y-1">{refs.map(v => <VarRow key={v.name} v={v}/>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function StackPanel({ callStack }) {
  const frames = Array.isArray(callStack) ? callStack : []

  return (
    <div className="segment-card h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-500"/>
        <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-widest">Call Stack</span>
        <span className="ml-auto text-[11px] text-blue-600 font-mono">{frames.length} frame{frames.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="text-[10px] text-blue-700 font-mono bg-blue-950/20 rounded px-2 py-1 border border-blue-900/30">
        Holds: <span className="text-blue-400">primitives</span> · <span className="text-blue-400">object references</span> · <span className="text-blue-400">return addresses</span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {frames.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2 opacity-40">
            <Layers size={28} className="text-blue-700"/>
            <p className="text-xs text-blue-700 font-mono">Stack is empty</p>
          </div>
        ) : (
          frames.map((f, i) => <Frame key={f.id || i} frame={f} isTop={i === 0} index={frames.length - i}/>)
        )}
      </div>

      <div className="text-[10px] text-blue-700/50 font-mono border-t border-blue-900/30 pt-1">
        ↑ top of stack (most recent call)
      </div>
    </div>
  )
}