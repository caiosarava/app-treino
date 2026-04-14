import React, { useState, useMemo } from 'react';
import { 
  Dumbbell, User, Activity, AlertTriangle, Download, 
  ChevronRight, Loader2, Scale, CheckCircle2, RotateCcw, Plus
} from 'lucide-react';

// Ajuste para compatibilidade de ambiente e leitura de variáveis do Vite
const getApiKey = () => {
  try {
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();

const App = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workoutResult, setWorkoutResult] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    age: '', height: '', weight: '', gender: 'Masculino',
    activityLevel: 'Sedentário', objective: 'Hipertrofia',
    conditions: [], customCondition: ''
  });

  const imc = useMemo(() => {
    if (!formData.weight || !formData.height) return null;
    const h = formData.height / 100;
    return (formData.weight / (h * h)).toFixed(1);
  }, [formData.weight, formData.height]);

  const toggleCondition = (cond) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(cond) 
        ? prev.conditions.filter(c => c !== cond) 
        : [...prev.conditions, cond]
    }));
  };

  const generateWorkout = async () => {
    if (!apiKey) {
      setError("Chave API não configurada. Adicione VITE_GEMINI_API_KEY ao seu arquivo .env ou variáveis da Vercel.");
      return;
    }

    setLoading(true);
    setError(null);
    
    const systemPrompt = `ROLE: Treinador físico profissional certificado. OBJETIVO: Criar plano de treino personalizado em JSON. FORMATO: { "workout_name": "string", "goal": "string", "frequency_per_week": number, "days": [{"day": "string", "focus": "string", "exercises": [{"name": "string", "sets": number, "reps": "string", "rest_seconds": number, "notes": "string"}]}], "safety_notes": "string", "progression_plan": "string" }`;
    const userQuery = `Dados do Usuário: Idade ${formData.age}, Sexo ${formData.gender}, Altura ${formData.height}cm, Peso ${formData.weight}kg, IMC ${imc}, Nível ${formData.activityLevel}, Objetivo ${formData.objective}, Condições Especiais: ${formData.conditions.join(', ')} ${formData.customCondition}. Crie um treino seguro e eficaz.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userQuery }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { 
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) throw new Error("Erro na comunicação com a API de IA.");
      
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) throw new Error("A IA retornou um formato inesperado.");
      
      setWorkoutResult(JSON.parse(content));
      setStep(3);
    } catch (err) {
      console.error(err);
      setError("Ocorreu um erro ao gerar o treino. Verifique sua conexão e a validade da chave API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-2 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Dumbbell size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">FitGen <span className="text-blue-600">AI</span></h1>
        </header>

        {/* Indicador de Passos */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-blue-600" />
              <h2 className="text-xl font-bold">Perfil Biométrico</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Idade</label>
                <input type="number" placeholder="Ex: 28" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Altura (cm)</label>
                <input type="number" placeholder="Ex: 175" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Peso (kg)</label>
                <input type="number" placeholder="Ex: 80" className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Sexo</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option>Masculino</option>
                  <option>Feminino</option>
                </select>
              </div>
            </div>

            {imc && (
              <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scale className="text-blue-600" />
                  <div>
                    <p className="text-xs font-bold text-blue-900/60">IMC CALCULADO</p>
                    <p className="text-lg font-black text-blue-900">{imc}</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              disabled={!formData.age || !formData.height || !formData.weight}
              onClick={() => setStep(2)} 
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              Próximo Passo <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-blue-600" />
              <h2 className="text-xl font-bold">Saúde e Estilo de Vida</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Nível de Atividade</label>
                <select className="w-full p-3 border border-slate-200 rounded-xl outline-none bg-white" value={formData.activityLevel} onChange={e => setFormData({...formData, activityLevel: e.target.value})}>
                  <option>Sedentário</option>
                  <option>Levemente ativo</option>
                  <option>Moderadamente ativo</option>
                  <option>Muito ativo</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-600">Condições de Saúde</label>
                <div className="flex flex-wrap gap-2">
                  {['Diabetes', 'Hipertensão', 'Gravidez', 'Lesão Joelho', 'Asma'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => toggleCondition(c)} 
                      className={`px-4 py-2 rounded-full border text-xs font-bold transition-all ${formData.conditions.includes(c) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Observações Adicionais</label>
                <textarea 
                  placeholder="Descreva limitações físicas ou detalhes do objetivo..." 
                  className="w-full p-4 border border-slate-200 rounded-xl mb-2 min-h-[100px] outline-none focus:ring-2 focus:ring-blue-500" 
                  value={formData.customCondition}
                  onChange={e => setFormData({...formData, customCondition: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setStep(1)} className="flex-1 p-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50">Voltar</button>
              <button 
                disabled={loading}
                onClick={generateWorkout} 
                className="flex-[2] bg-blue-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Dumbbell size={20} /> Gerar Plano de Treino</>}
              </button>
            </div>
          </div>
        )}

        {step === 3 && workoutResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-slate-100">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">{workoutResult.workout_name}</h2>
                  <p className="text-slate-500 font-medium">Frequência sugerida: {workoutResult.frequency_per_week}x por semana</p>
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {workoutResult.goal}
                </div>
              </div>

              {workoutResult.safety_notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                  <p className="text-sm text-amber-800 leading-relaxed italic">"{workoutResult.safety_notes}"</p>
                </div>
              )}

              <div className="space-y-8">
                {workoutResult.days.map((day, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-blue-900 uppercase tracking-widest text-xs">{day.day} • {day.focus}</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {day.exercises.map((ex, j) => (
                        <div key={j} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{ex.name}</h4>
                            <p className="text-xs text-slate-400 mt-1">{ex.notes}</p>
                          </div>
                          <div className="flex gap-3">
                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-center min-w-[60px]">
                              <p className="text-[10px] font-bold text-slate-400">SÉRIES</p>
                              <p className="font-black text-slate-700">{ex.sets}</p>
                            </div>
                            <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-center min-w-[60px]">
                              <p className="text-[10px] font-bold text-slate-400">REPS</p>
                              <p className="font-black text-slate-700">{ex.reps}</p>
                            </div>
                            <div className="bg-blue-50 px-3 py-1.5 rounded-lg text-center min-w-[60px]">
                              <p className="text-[10px] font-bold text-blue-400">REST</p>
                              <p className="font-black text-blue-700">{ex.rest_seconds}s</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-slate-50 rounded-2xl">
                <h4 className="font-bold text-slate-700 mb-2 text-sm uppercase">Plano de Progressão</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{workoutResult.progression_plan}</p>
              </div>

              <button 
                onClick={() => setStep(1)} 
                className="w-full mt-10 text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:text-blue-600 transition-colors"
              >
                <RotateCcw size={14}/> Reiniciar e Gerar Novo Treino
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700">
            <AlertTriangle className="shrink-0" size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <footer className="mt-12 text-center text-slate-400 text-[10px] uppercase tracking-widest">
          <p>© 2024 FitGen AI • Inteligência Artificial para Saúde</p>
        </footer>
      </div>
    </div>
  );
};

export default App;