const EVENT_CONFIG = {
  method_call:     { label: 'Method Call',    bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/40' },
  method_return:   { label: 'Method Return',  bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' },
  object_create:   { label: 'Heap Alloc',     bg: 'bg-emerald-500/20',text: 'text-emerald-300',border: 'border-emerald-500/40' },
  variable_assign: { label: 'Stack Write',    bg: 'bg-cyan-500/20',   text: 'text-cyan-300',   border: 'border-cyan-500/40' },
  static_load:     { label: 'Metaspace Load', bg: 'bg-amber-500/20',  text: 'text-amber-300',  border: 'border-amber-500/40' },
}

export default function EventBadge({ type }) {
  const cfg = EVENT_CONFIG[type] || EVENT_CONFIG.variable_assign
  return (
    <span className={`event-badge border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}