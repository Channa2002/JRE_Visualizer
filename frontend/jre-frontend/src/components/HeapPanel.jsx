import { useState } from 'react'
import { Database, ChevronDown, ChevronRight, Box } from 'lucide-react'

function FieldRow({ f }) {
  const isRef = !f.isPrimitive && f.heapRef
  return (
    <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-[#051a10] border border-emerald-900/40 text-xs font-mono gap-2">
      <span className="text-emerald-200 truncate">{f.name}</span>
      <div className="flex items-center gap-1 shrink-0">
        {isRef ? (
          <><span className="text-[10px] text-emerald-600">ref →</span><span className="text-emerald-300 font-bold">{f.value}</span></>
        ) : (
          <span className="text-cyan-300">{f.value}</span>
        )}
      </div>
    </div>
  )
}

function HeapObj({ id, obj }) {
  const [open, setOpen] = useState(true)
  const fields = Object.values(obj.fields || {})
  const badge = obj.objectType === 'string' ? '📝 String'
              : obj.objectType === 'array'  ? '📦 Array'
              : '🔷 Instance'

  return (
    <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 overflow-hidden hover:border-emerald-600/50 transition-colors">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-emerald-900/10 transition-colors text-left">
        <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-900/50 px-1.5 py-0.5 rounded shrink-0">{id}</span>
        <span className="font-mono text-xs font-bold text-emerald-200 flex-1">{obj.className}</span>
        <span className="text-[10px] text-emerald-600">{badge}</span>
        {open ? <ChevronDown size={12} className="text-emerald-600 shrink-0"/> : <ChevronRight size={12} className="text-emerald-600 shrink-0"/>}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-1">
          {fields.length === 0
            ? <p className="text-[11px] text-emerald-800 font-mono italic">— no fields —</p>
            : fields.map(f => <FieldRow key={f.name} f={f}/>)
          }
        </div>
      )}
    </div>
  )
}

export default function HeapPanel({ heap }) {
  const entries = Object.entries(heap || {})

  return (
    <div className="segment-card h-full flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"/>
        <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Heap</span>
        <span className="ml-auto text-[11px] text-emerald-600 font-mono">{entries.length} object{entries.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="text-[10px] text-emerald-700 font-mono bg-emerald-950/20 rounded px-2 py-1 border border-emerald-900/30">
        Holds: <span className="text-emerald-400">all objects (new …)</span> · <span className="text-emerald-400">arrays</span> · <span className="text-emerald-400">Strings</span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto flex-1">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-8 gap-2 opacity-40">
            <Database size={28} className="text-emerald-700"/>
            <p className="text-xs text-emerald-700 font-mono">No objects allocated yet</p>
          </div>
        ) : (
          entries.map(([id, obj]) => <HeapObj key={id} id={id} obj={obj}/>)
        )}
      </div>

      {entries.length > 0 && (
        <div className="text-[10px] text-emerald-700/50 font-mono border-t border-emerald-900/30 pt-1">
          Objects persist until GC collects them (no more references)
        </div>
      )}
    </div>
  )
}