import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Plus, 
  Trash2, 
  FileText,
  BarChart3,
  Code2,
  Info,
  Languages,
  Sparkles
} from "lucide-react";

const TARGET_LANGUAGES = [
  "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Urdu", "Kannada", "Odia", "Malayalam", "Punjabi", "Sanskrit",
  "Spanish", "French", "German", "Chinese", "Japanese", "Korean", "Russian", "Arabic", "Portuguese"
];

interface AnalysisResult {
  status: "success" | "error";
  similarity_scores: number[];
  mean_similarity: number;
  variance: number;
  stability_index: number;
  classification: string;
  semantic_outlier_index: number;
  explanation: string;
  message?: string;
}

export default function App() {
  const [original, setOriginal] = useState("");
  const [translations, setTranslations] = useState(["", "", ""]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["Hindi", "Spanish", "French"]);
  const [error, setError] = useState<string | null>(null);

  const toggleLanguage = (lang: string) => {
    if (selectedLangs.includes(lang)) {
      setSelectedLangs(selectedLangs.filter(l => l !== lang));
    } else {
      setSelectedLangs([...selectedLangs, lang]);
    }
  };

  const generateTranslations = async () => {
    if (!original) {
      setError("Please enter original text first.");
      return;
    }
    if (selectedLangs.length === 0) {
      setError("Please select at least one target language.");
      return;
    }

    setTranslating(true);
    setError(null);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: original, languages: selectedLangs }),
      });

      const data = await response.json();
      if (data.status === "error") {
        setError(data.message);
      } else {
        setTranslations(data.translations);
      }
    } catch (err: any) {
      setError("Failed to connect to the translation server.");
    } finally {
      setTranslating(false);
    }
  };

  const handleAddTranslation = () => {
    setTranslations([...translations, ""]);
  };

  const handleRemoveTranslation = (index: number) => {
    if (translations.length <= 3) return;
    const newTranslations = translations.filter((_, i) => i !== index);
    setTranslations(newTranslations);
  };

  const handleTranslationChange = (index: number, value: string) => {
    const newTranslations = [...translations];
    newTranslations[index] = value;
    setTranslations(newTranslations);
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original, translations }),
      });

      const data = await response.json();
      if (data.status === "error") {
        setError(data.message);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError("Failed to connect to the analysis server.");
    } finally {
      setLoading(false);
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "Highly Stable": return "text-emerald-500";
      case "Moderately Stable": return "text-amber-500";
      case "Unstable Meaning": return "text-rose-500";
      default: return "text-slate-500";
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6">
      {/* Header */}
      <header className="glass-panel rounded-2xl p-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">ContextShift 3.0</h1>
            <p className="text-[10px] font-mono text-indigo-600 uppercase tracking-[0.2em] font-bold">Semantic Stability Profiling</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-[11px] font-serif italic text-slate-500">Multilingual Meaning Drift Analysis</p>
            <p className="text-[9px] font-mono uppercase tracking-widest opacity-40">Build 2026.02.23</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">System Online</span>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Input */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel rounded-2xl p-8 flex-1 flex flex-col gap-8 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase tracking-widest font-bold">Source Material</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-40">Original Text</label>
                <textarea
                  value={original}
                  onChange={(e) => setOriginal(e.target.value)}
                  placeholder="Enter the authoritative original text..."
                  className="glass-input w-full h-32 p-4 rounded-xl font-serif text-lg leading-relaxed shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Languages className="w-4 h-4" />
                <span className="text-[11px] font-mono uppercase tracking-widest font-bold">Auto-Translation</span>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-40">Select Target Languages (Indian & Global)</p>
                <div className="flex flex-wrap gap-2">
                  {TARGET_LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono transition-all border ${
                        selectedLangs.includes(lang)
                          ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                          : "bg-white/30 text-slate-500 border-white/40 hover:border-indigo-500/50"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={generateTranslations}
                  disabled={translating || !original || selectedLangs.length === 0}
                  className="w-full py-3 bg-white/50 border border-indigo-500/30 text-indigo-600 rounded-xl font-mono uppercase tracking-widest text-[10px] font-bold hover:bg-indigo-50/50 disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                >
                  {translating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                      Translating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      Generate {selectedLangs.length} Translations
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Activity className="w-4 h-4" />
                  <span className="text-[11px] font-mono uppercase tracking-widest font-bold">Comparative Variants</span>
                </div>
                <button 
                  onClick={handleAddTranslation}
                  className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-indigo-600 hover:text-indigo-700 font-bold transition-colors"
                >
                  <Plus className="w-3 h-3" /> Add Variant
                </button>
              </div>
              
              <div className="space-y-4">
                {translations.map((t, i) => (
                  <motion.div 
                    layout
                    key={i} 
                    className="group relative"
                  >
                    <div className="absolute -left-3 top-4 text-[10px] font-mono opacity-20 transform -rotate-90 origin-right">{String(i + 1).padStart(2, '0')}</div>
                    <textarea
                      value={t}
                      onChange={(e) => handleTranslationChange(i, e.target.value)}
                      placeholder={`Translation/Paraphrase ${i + 1}...`}
                      className="glass-input w-full h-24 p-4 rounded-xl text-sm leading-relaxed shadow-sm"
                    />
                    {translations.length > 3 && (
                      <button 
                        onClick={() => handleRemoveTranslation(i)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all duration-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading || !original || translations.some(t => !t)}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-mono uppercase tracking-[0.2em] text-xs font-bold hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing Embeddings...
                </>
              ) : (
                <>
                  Compute Stability Profile
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-700 text-xs flex items-start gap-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}
          </div>
        </section>

        {/* Right Panel: Results */}
        <section className="lg:col-span-7 flex flex-col">
          <div className="glass-panel rounded-2xl p-8 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-6"
                >
                  <div className="w-20 h-20 bg-indigo-500/5 rounded-full flex items-center justify-center border border-indigo-500/10">
                    <BarChart3 className="w-10 h-10 text-indigo-500/30 stroke-[1.5]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-serif italic text-slate-400">Awaiting input data for profiling</p>
                    <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-slate-300">System Ready</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center space-y-8"
                >
                  <div className="relative">
                    <div className="w-32 h-32 border-2 border-indigo-500/5 rounded-full animate-[spin_4s_linear_infinite]" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center animate-pulse">
                        <Activity className="w-8 h-8 text-indigo-600" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-indigo-600 font-bold">Analyzing Drift</p>
                    <p className="text-xs text-slate-400 font-serif italic">Normalizing vectors & computing cosine similarity...</p>
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-10"
                >
                  {/* Summary Header */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card rounded-2xl p-6 space-y-2">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">Classification</p>
                      <p className={`text-xl font-bold tracking-tight ${getClassificationColor(result.classification)}`}>
                        {result.classification}
                      </p>
                    </div>
                    <div className="glass-card rounded-2xl p-6 space-y-2">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">Stability Index (SSI)</p>
                      <p className="text-2xl font-mono font-bold tracking-tighter text-slate-800">
                        {result.stability_index.toFixed(4)}
                      </p>
                    </div>
                    <div className="glass-card rounded-2xl p-6 space-y-2">
                      <p className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">Mean Similarity</p>
                      <p className="text-2xl font-mono font-bold tracking-tighter text-slate-800">
                        {result.mean_similarity.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Detailed Metrics Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <BarChart3 className="w-4 h-4" />
                        <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold">Similarity Distribution</h3>
                      </div>
                      <div className="space-y-5">
                        {result.similarity_scores.map((score, idx) => (
                          <div key={idx} className="space-y-2">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-slate-400 font-bold">VARIANT {idx + 1}</span>
                              <span className={idx === result.semantic_outlier_index ? "text-rose-500 font-bold" : "text-slate-600 font-bold"}>
                                {score.toFixed(4)} {idx === result.semantic_outlier_index && "(OUTLIER)"}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${score * 100}%` }}
                                transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.1 }}
                                className={`h-full rounded-full ${idx === result.semantic_outlier_index ? "bg-gradient-to-r from-rose-400 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]" : "bg-gradient-to-r from-indigo-400 to-indigo-600 shadow-[0_0_12px_rgba(99,102,241,0.3)]"}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Info className="w-4 h-4" />
                        <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold">Stability Analysis</h3>
                      </div>
                      <div className="glass-card rounded-2xl p-6 bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 space-y-6">
                        <p className="text-base font-serif italic leading-relaxed opacity-90">
                          "{result.explanation}"
                        </p>
                        <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className="text-[8px] font-mono uppercase opacity-50 tracking-widest font-bold">Variance</p>
                            <p className="text-sm font-mono font-bold">{result.variance.toFixed(6)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[8px] font-mono uppercase opacity-50 tracking-widest font-bold">Outlier Index</p>
                            <p className="text-sm font-mono font-bold">#{result.semantic_outlier_index + 1}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Raw Output Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Code2 className="w-4 h-4" />
                      <h3 className="text-[10px] font-mono uppercase tracking-widest font-bold">Structured JSON Response</h3>
                    </div>
                    <div className="glass-card rounded-2xl p-6 overflow-hidden">
                      <pre className="text-[10px] font-mono text-slate-500 overflow-x-auto custom-scrollbar">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  </div>

                  <div className="pt-8 flex items-center gap-2 text-[10px] font-mono text-slate-300 uppercase tracking-[0.3em] justify-center">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Analysis Complete • Deterministic Calculation Verified
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
      
      <footer className="text-center py-2">
        <p className="text-[9px] font-mono uppercase tracking-[0.5em] text-slate-400">ContextShift 3.0 • Semantic Stability Profiling Engine</p>
      </footer>
    </div>
  );
}
