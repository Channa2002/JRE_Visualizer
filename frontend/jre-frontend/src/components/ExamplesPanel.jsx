import { useState } from 'react'
import { BookOpen, Layers, Database, Cpu, ChevronRight } from 'lucide-react'

const CATEGORY_CONFIG = {
  Stack:      { icon: Layers,   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'  },
  Heap:       { icon: Database, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Metaspace:  { icon: Cpu,      color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/30'  },
}

export default function ExamplesPanel({ examples, onSelect, selectedId }) {
  const [filter, setFilter] = useState('All')
  const categories = ['All', 'Stack', 'Heap', 'Metaspace']

  const filtered = filter === 'All' ? examples : examples.filter(e => e.category === filter)

  return (
    <div className="flex flex-col gap-3">
      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`example-chip transition-all ${
              filter === cat
                ? 'bg-accent/20 border-accent/60 text-purple-300'
                : 'border-border text-muted hover:border-muted hover:text-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Example cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(ex => {
          const cfg = CATEGORY_CONFIG[ex.category] || CATEGORY_CONFIG.Stack
          const Icon = cfg.icon
          const isSelected = ex.id === selectedId

          return (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className={`text-left rounded-xl border p-4 flex flex-col gap-2 transition-all duration-200
                hover:scale-[1.02] hover:shadow-lg group
                ${isSelected
                  ? `${cfg.border} ${cfg.bg} shadow-lg`
                  : 'border-border bg-card hover:border-muted/40'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-2 ${cfg.color}`}>
                  <Icon size={13} />
                  <span className="text-[10px] font-mono uppercase tracking-wider">{ex.category}</span>
                </div>
                <ChevronRight size={13} className={`transition-transform group-hover:translate-x-0.5
                  ${isSelected ? cfg.color : 'text-muted'}`} />
              </div>
              <p className="text-sm font-semibold text-text">{ex.title}</p>
              <p className="text-[11px] text-muted leading-relaxed">{ex.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}