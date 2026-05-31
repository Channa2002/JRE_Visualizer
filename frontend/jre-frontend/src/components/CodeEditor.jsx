import { FileCode } from 'lucide-react'

export default function CodeEditor({ code, onChange, highlightLine }) {
  const lines = code.split('\n')

  return (
    <div className="segment-card h-full flex flex-col">
      <div className="segment-header text-purple-400">
        <FileCode size={14} />
        <span>Java Editor</span>
        {highlightLine && (
          <span className="ml-auto text-purple-500/60 normal-case tracking-normal font-sans text-[11px]">
            line {highlightLine}
          </span>
        )}
      </div>

      {/* Always plain editable textarea — line numbers + optional line highlight */}
      <div className="flex-1 overflow-auto rounded-lg bg-[#0d1117] border border-border relative min-h-0">
        <div className="flex h-full">

          {/* Line numbers */}
          <div className="select-none shrink-0 bg-[#0d1117] border-r border-border pt-2 px-3 text-right">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`text-[11px] font-mono leading-6 transition-colors
                  ${highlightLine === i + 1 ? 'text-purple-400 font-bold' : 'text-slate-600'}`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Highlight layer — sits behind the textarea */}
          <div className="relative flex-1">
            {highlightLine && (
              <div
                className="absolute left-0 right-0 bg-purple-900/25 border-l-2 border-purple-500 pointer-events-none"
                style={{
                  top:    `${(highlightLine - 1) * 24 + 8}px`,
                  height: '24px',
                }}
              />
            )}

            {/* Editable textarea — always on, always plain text */}
            <textarea
              value={code}
              onChange={e => onChange && onChange(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full resize-none bg-transparent
                         text-slate-300 font-mono text-xs leading-6
                         pl-4 pr-4 pt-2 pb-2
                         focus:outline-none caret-purple-400
                         selection:bg-purple-900/50"
              placeholder="// Paste your Java code here..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}