import { useState, useEffect, useCallback } from 'react'
import { Play, RotateCcw, BookOpen, Code2, Cpu, AlertCircle, Loader2 } from 'lucide-react'

import StackPanel      from './components/StackPanel'
import HeapPanel       from './components/HeapPanel'
import MetaspacePanel  from './components/MetaspacePanel'
import CodeEditor      from './components/CodeEditor'
import StepControls    from './components/StepControls'
import ExamplesPanel   from './components/ExamplesPanel'

const API_BASE = '/api'

const DEFAULT_CODE = `public class HelloJVM {
    static int counter = 0;

    public static void main(String[] args) {
        int x = 42;
        double pi = 3.14;
        String message = new String("Hello, JVM!");
        Dog dog = new Dog("Rex", 3);
        counter = counter + 1;
        System.out.println(message);
    }
}
`

const EMPTY_SNAPSHOT = { callStack: [], heap: {}, metaspace: [] }
const TABS = [
  { id: 'editor',   label: 'Editor',   icon: Code2    },
  { id: 'examples', label: 'Examples', icon: BookOpen },
]

export default function App() {
  const [activeTab,       setActiveTab]       = useState('editor')
  const [code,            setCode]            = useState(DEFAULT_CODE)
  const [result,          setResult]          = useState(null)
  const [currentStep,     setCurrentStep]     = useState(0)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState(null)
  const [examples,        setExamples]        = useState([])
  const [selectedExample, setSelectedExample] = useState(null)
  const [examplesLoading, setExamplesLoading] = useState(false)

  useEffect(() => {
    setExamplesLoading(true)
    fetch(`${API_BASE}/examples`)
      .then(r => r.json())
      .then(setExamples)
      .catch(() => setExamples([]))
      .finally(() => setExamplesLoading(false))
  }, [])

  const snapshot    = result?.steps?.[currentStep]?.memorySnapshot ?? EMPTY_SNAPSHOT
  const currentLine = result?.steps?.[currentStep]?.lineNumber ?? null

  const analyze = useCallback(async (codeToAnalyze = code) => {
    setLoading(true); setError(null); setResult(null); setCurrentStep(0)
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeToAnalyze }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      setResult(await res.json())
    } catch (err) {
      setError(err.message.includes('Failed to fetch')
        ? 'Cannot connect to backend. Make sure Spring Boot is running on port 8080.'
        : err.message)
    } finally {
      setLoading(false)
    }
  }, [code])

  const handleSelectExample = ex => {
    setSelectedExample(ex); setCode(ex.code.trim())
    setResult(null); setCurrentStep(0); setError(null); setActiveTab('editor')
  }

  const reset = () => {
    setResult(null); setCurrentStep(0); setError(null)
    setSelectedExample(null); setCode(DEFAULT_CODE)
  }

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1700px] mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500
                            flex items-center justify-center shadow-accent-glow">
              <Cpu size={16} className="text-white"/>
            </div>
            <span className="font-display font-bold text-base tracking-tight">JRE Visualizer</span>
            <span className="hidden sm:inline text-muted text-xs ml-1">Stack · Heap · Metaspace</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reset} className="btn-secondary hidden sm:flex">
              <RotateCcw size={14}/> Reset
            </button>
            <button onClick={() => analyze(code)} disabled={loading || !code.trim()} className="btn-primary">
              {loading
                ? <><Loader2 size={14} className="animate-spin"/> Analyzing…</>
                : <><Play size={14}/> Run Visualizer</>}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1700px] mx-auto w-full px-4 sm:px-6 py-5 flex flex-col gap-5">

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 text-red-300 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400"/>
            <div>
              <p className="font-semibold">Analysis failed</p>
              <p className="text-red-400/80 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════
            MAIN LAYOUT
            ┌──────────────────────────────────────────────────────────┐
            │  LEFT: Code editor / Examples  │  RIGHT: memory panels   │
            │                                │                          │
            │                                │  [METASPACE — full row] │
            │                                │  [STACK]    [HEAP]      │
            └──────────────────────────────────────────────────────────┘
        ════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col xl:flex-row gap-5 flex-1">

          {/* ── LEFT column ─────────────────────────────────────────────── */}
          <div className="xl:w-[42%] flex flex-col gap-4">

            {/* Tab bar */}
            <div className="flex items-center gap-1 bg-surface rounded-xl p-1 border border-border self-start">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${activeTab === id
                      ? 'bg-card text-text shadow-sm border border-border'
                      : 'text-muted hover:text-text'}`}>
                  <Icon size={14}/>{label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'editor' ? (
              <div className="flex-1 flex flex-col gap-2 min-h-[380px]">
                <CodeEditor
                  code={code}
                  onChange={v => { setCode(v); setResult(null); setCurrentStep(0) }}
                  highlightLine={result ? currentLine : null}
                  readOnly={!!result}
                />
                {result && (
                  <button onClick={() => setResult(null)} className="btn-secondary text-xs self-start">
                    <Code2 size={12}/> Edit code
                  </button>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                {examplesLoading
                  ? <div className="flex items-center gap-3 py-12 text-muted justify-center">
                      <Loader2 size={18} className="animate-spin"/>
                      <span className="text-sm">Loading examples…</span>
                    </div>
                  : <ExamplesPanel examples={examples} onSelect={handleSelectExample} selectedId={selectedExample?.id}/>
                }
              </div>
            )}

            {/* Step controls */}
            {result && (
              <StepControls
                steps={result.steps}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
            )}

            {/* Empty CTA */}
            {!result && !loading && (
              <div className="border border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Play size={20} className="text-accent"/>
                </div>
                <div>
                  <p className="text-sm font-semibold">Ready to visualize</p>
                  <p className="text-xs text-muted mt-1">Write Java code then click <strong>Run Visualizer</strong></p>
                </div>
                <button onClick={() => setActiveTab('examples')} className="btn-secondary text-xs">
                  <BookOpen size={12}/> Browse examples
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT column — memory panels ──────────────────────────────── */}
          <div className="xl:flex-1 flex flex-col gap-4">

            {/* ── ROW 1: Metaspace — full width across the top ────────────── */}
            <div className="w-full" style={{ minHeight: '200px' }}>
              <MetaspacePanel metaspace={snapshot.metaspace}/>
            </div>

            {/* ── ROW 2: Stack (left) + Heap (right) side by side ─────────── */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="flex-1" style={{ minHeight: '260px' }}>
                <StackPanel callStack={snapshot.callStack}/>
              </div>
              <div className="flex-1" style={{ minHeight: '260px' }}>
                <HeapPanel heap={snapshot.heap}/>
              </div>
            </div>

          </div>
        </div>

        {/* ── Legend ──────────────────────────────────────────────────────── */}
        <footer className="flex flex-wrap items-center justify-center gap-6 border-t border-border pt-4 text-xs text-muted font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/60 border border-amber-500"/>
            <span>Metaspace — class metadata · method bytecode · static fields</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/60 border border-blue-500"/>
            <span>Stack — primitives · references · call frames</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60 border border-emerald-500"/>
            <span>Heap — all objects created with new</span>
          </div>
        </footer>
      </main>
    </div>
  )
}