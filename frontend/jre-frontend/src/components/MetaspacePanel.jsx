import { useState } from 'react'
import { Cpu, ChevronDown, ChevronRight, Zap, Lock } from 'lucide-react'

function StaticRow({ f }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[#1a0f00] border border-amber-900/40 text-xs font-mono gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <Lock size={9} className="text-amber-600 shrink-0"/>
        <span className="text-amber-500/70 shrink-0">{f.type}</span>
        <span className="text-amber-200 font-semibold truncate">{f.name}</span>
      </div>
      <span className={f.isPrimitive ? 'text-cyan-300 shrink-0' : 'text-emerald-400 shrink-0'}>{f.value}</span>
    </div>
  )
}

function MethodRow({ sig }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#1a0f00] border border-amber-900/30 text-xs font-mono">
      <Zap size={9} className="text-amber-500 shrink-0"/>
      <span className="text-amber-200 truncate">{sig}</span>
    </div>
  )
}

function ClassEntry({ entry }) {
  const [open, setOpen] = useState(true)
  const statics = Object.values(entry.staticFields || {})
  const methods = entry.methods || []

  return (
    <div className="rounded-xl border border-amber-800/40 bg-amber-950/10 overflow-hidden hover:border-amber-600/40 transition-colors">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-900/10 transition-colors text-left">
        <span className="text-[10px] font-mono text-amber-600 bg-amber-900/30 px-1.5 py-0.5 rounded uppercase shrink-0">{entry.classType}</span>
        <span className="font-mono text-xs font-bold text-amber-200 flex-1">{entry.className}</span>
        {open ? <ChevronDown size={12} className="text-amber-600 shrink-0"/> : <ChevronRight size={12} className="text-amber-600 shrink-0"/>}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {methods.length > 0 && (
            <div>
              <p className="text-[9px] text-amber-700/70 uppercase tracking-widest mb-1 font-mono">Methods (bytecode in Metaspace)</p>
              <div className="space-y-1">{methods.map((m, i) => <MethodRow key={i} sig={m}/>)}</div>
            </div>
          )}
          {statics.length > 0 && (
            <div>
              <p className="text-[9px] text-amber-700/70 uppercase tracking-widest mb-1 font-mono">Static Fields (class-level data)</p>
              <div className="space-y-1">{statics.map(f => <StaticRow key={f.name} f={f}/>)}</div>
            </div>
          )}
          {methods.length === 0 && statics.length === 0 && (
            <p className="text-[11px] text-amber-800 font-mono italic">— no members —</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function MetaspacePanel({ metaspace }) {
  const entries = Array.isArray(metaspace) ? metaspace : []

  return (
    <div className="segment-card h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"/>
        <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-widest">Metaspace</span>
        <span className="ml-auto text-[11px] text-amber-600 font-mono">{entries.length} class{entries.length !== 1 ? 'es' : ''}</span>
      </div>

      <div className="text-[10px] text-amber-700 font-mono bg-amber-950/20 rounded px-2 py-1 border border-amber-900/30">
        Holds: <span className="text-amber-400">class metadata</span> · <span className="text-amber-400">method bytecode</span> · <span className="text-amber-400">static fields</span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2 opacity-40">
            <Cpu size={28} className="text-amber-700"/>
            <p className="text-xs text-amber-700 font-mono">No classes loaded</p>
          </div>
        ) : (
          entries.map((e, i) => <ClassEntry key={i} entry={e}/>)
        )}
      </div>

      <div className="text-[10px] text-amber-700/50 font-mono border-t border-amber-900/30 pt-1">
        Managed by JVM — NOT part of the Java Heap
      </div>
    </div>
  )
}