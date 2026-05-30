import { useEffect, useRef } from 'react'
import { FileCode } from 'lucide-react'

// Simple syntax highlighting without CodeMirror dependency issues
function highlightJava(code) {
  const keywords = ['public','private','protected','static','final','void','class',
    'interface','enum','new','return','if','else','while','for','int','double',
    'float','long','short','byte','char','boolean','String','null','true','false',
    'this','super','extends','implements','import','package','try','catch','throw']

  return code
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]*)"/g, '<span class="text-amber-300">"$1"</span>')
    .replace(/'(.)'/g, '<span class="text-amber-300">\'$1\'</span>')
    .replace(/\/\/.*/g, '<span class="text-slate-500">$&</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="text-cyan-300">$1</span>')
    .replace(
      new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'),
      '<span class="text-purple-400 font-semibold">$1</span>'
    )
}

export default function CodeEditor({ code, onChange, highlightLine, readOnly = false }) {
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

      <div className="flex-1 overflow-auto rounded-lg bg-[#0d1117] border border-border relative">
        {readOnly ? (
          /* Read-only highlighted view */
          <table className="w-full border-collapse text-xs font-mono">
            <tbody>
              {lines.map((line, i) => {
                const lineNum = i + 1
                const isHighlighted = lineNum === highlightLine
                return (
                  <tr
                    key={i}
                    className={`transition-colors duration-200 ${
                      isHighlighted ? 'bg-purple-900/30' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className={`select-none text-right pr-4 pl-3 py-0.5 w-10 border-r
                      ${isHighlighted ? 'border-purple-500/50 text-purple-400' : 'border-border text-slate-600'}`}>
                      {lineNum}
                    </td>
                    <td className={`pl-4 pr-3 py-0.5 ${isHighlighted ? 'border-l-2 border-purple-500' : ''}`}>
                      <span
                        className="text-slate-300 leading-6"
                        dangerouslySetInnerHTML={{ __html: highlightJava(line) || '&nbsp;' }}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          /* Editable textarea */
          <div className="relative h-full">
            {/* Line numbers */}
            <div className="absolute left-0 top-0 bottom-0 w-10 bg-[#0d1117] border-r border-border pt-2 select-none z-10">
              {lines.map((_, i) => (
                <div key={i} className="text-right pr-3 text-[11px] font-mono text-slate-600 leading-6">
                  {i + 1}
                </div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={e => onChange(e.target.value)}
              spellCheck={false}
              className="absolute inset-0 w-full h-full resize-none bg-transparent text-slate-300
                font-mono text-xs leading-6 pl-12 pr-4 pt-2 pb-2 focus:outline-none
                caret-purple-400 selection:bg-purple-900/50"
              placeholder="// Paste your Java code here..."
            />
          </div>
        )}
      </div>
    </div>
  )
}