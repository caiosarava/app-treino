import React, { useState, useEffect, useMemo } from 'react';
import { 
  Dumbbell, 
  User, 
  Activity, 
  AlertTriangle, 
  Download, 
  ChevronRight, 
  Loader2, 
  Scale, 
  CheckCircle2,
  History,
  Plus
} from 'lucide-react';

/**
 * CONFIGURAÇÃO E INTEGRAÇÃO
 * O app utiliza a API do Gemini 2.5 Flash com um prompt profissional estruturado.
 * A exportação para o Hevy é otimizada via CSV.
 */

const apiKey = ""; // A plataforma injeta a chave automaticamente

const App = () => {
  // --- Estados do Formulário ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [workoutResult, setWorkoutResult] = useState(null);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    age: '',
    height: '',
    weight: '',
    gender: 'Masculino',
    activityLevel: 'Sedentário',
    objective: 'Hipertrofia',
    conditions: [],
    customCondition: ''
  });

  // --- Lógica de Cálculo de IMC ---
  const imc = useMemo(() => {
    if (!formData.weight || !formData.height) return null;
    const h = formData.height / 100;
    return (formData.weight / (h * h)).toFixed(1);
  }, [formData.weight, formData.height]);

  const getIMCCategory = (val) => {
    if (val < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' };
    if (val < 25) return { label: 'Peso normal', color: 'text-green-500' };
    if (val < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' };
    return { label: 'Obesidade', color: 'text-red-500' };
  };

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleCondition = (cond) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.includes(cond) 
        ? prev.conditions.filter(c => c !== cond) 
        : [...prev.conditions, cond]
    }));
  };

  // --- Integração com Gemini API ---
  const generateWorkout = async () => {
    setLoading(true);
    setError(null);
    
    // Injeção do Prompt Estruturado Conforme Solicitado
    const systemPrompt = `ROLE:
Você é um treinador físico profissional certificado, com experiência em prescrição de treinos personalizados baseados em evidências científicas, considerando limitações físicas, condições de saúde e nível de condicionamento.

OBJETIVO:
Criar um plano de treino seguro, eficaz e personalizado para o usuário com base nos dados fornecidos.

⚠️ REGRAS IMPORTANTES:
1. Priorize segurança acima de performance.
2. Adapte exercícios para quaisquer limitações ou condições médicas.
3. Evite exercícios de risco quando houver:
   - Hipertensão → evitar picos de esforço
   - Diabetes → considerar controle glicêmico
   - Gravidez → evitar impacto e compressão abdominal
   - Lesões → substituir exercícios afetados
4. Ajuste intensidade com base no nível de atividade.

🏋️ FORMATO DA RESPOSTA (OBRIGATÓRIO):
Responda APENAS em JSON estruturado, sem texto adicional:
{
  "workout_name": "string",
  "goal": "string",
  "frequency_per_week": number,
  "days": [
    {
      "day": "string",
      "focus": "string",
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string",
          "rest_seconds": number,
          "notes": "string"
        }
      ]
    }
  ],
  "safety_notes": "string",
  "progression_plan": "string"
}

🔄 COMPATIBILIDADE COM HEVY:
- Use nomes de exercícios padronizados (ex: "Bench Press", "Squat", "Deadlift").
- Evite abreviações incomuns.`;

    const userQuery = `📥 DADOS DO USUÁRIO
Idade: ${formData.age}
Sexo: ${formData.gender}
Altura: ${formData.height} cm
Peso: ${formData.weight} kg
IMC: ${imc}
Nível de atividade: ${formData.activityLevel}

Condições especiais:
${formData.conditions.join(', ')} ${formData.customCondition}

Objetivo do usuário:
${formData.objective} (ex: emagrecimento, hipertrofia, condicionamento)

🎯 RESULTADO ESPERADO:
Retorne apenas o JSON válido, pronto para ser convertido em arquivo exportável.`;

    try {
      let retryCount = 0;
      const maxRetries = 5;
      let response;

      while (retryCount < maxRetries) {
        try {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userQuery }] }],
              systemInstruction: { parts: [{ text: systemPrompt }] },
              generationConfig: { responseMimeType: "application/json" }
            })
          });
          if (response.ok) break;
        } catch (e) {
          console.error("Erro na tentativa", retryCount);
        }
        retryCount++;
        await new Promise(res => setTimeout(res, Math.pow(2, retryCount) * 1000));
      }

      if (!response || !response.ok) throw new Error("Falha ao conectar com a IA.");

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const workoutJson = JSON.parse(generatedText);
      
      setWorkoutResult(workoutJson);
      setStep(3);
    } catch (err) {
      setError("Não foi possível gerar seu treino. Verifique os dados e tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Exportação para Hevy (CSV) ---
  const exportToHevy = () => {
    if (!workoutResult) return;

    let csvContent = "Date,Workout Name,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes\n";
    const today = new Date().toISOString().split('T')[0];

    workoutResult.days.forEach(day => {
      day.exercises.forEach(ex => {
        for (let i = 1; i <= (parseInt(ex.sets) || 3); i++) {
          csvContent += `${today},${day.day},${ex.name},${i},0,${ex.reps},0,0,${ex.notes}\n`;
        }
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `treino_hevy_${formData.objective.toLowerCase()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Dumbbell size={28} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">FitGen <span className="text-blue-600">AI</span></h1>
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
            <div className={`w-2 h-2 rounded-full ${apiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
            {apiKey ? 'IA Online' : 'Conectando...'}
          </div>
        </header>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        {/* Step 1: Dados Biométricos */}
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-blue-600" />
              <h2 className="text-xl font-bold">Perfil Biométrico</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Sexo</label>
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  {['Masculino', 'Feminino'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setFormData({...formData, gender: opt})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.gender === opt ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Idade</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="Ex: 28" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Altura (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleInputChange} placeholder="Ex: 175" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Peso (kg)</label>
                <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} placeholder="Ex: 80" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {imc && (
              <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm"><Scale size={20} className="text-blue-600" /></div>
                  <div>
                    <p className="text-xs font-bold text-blue-900/60 uppercase">IMC Calculado</p>
                    <p className="text-lg font-black text-blue-900">{imc}</p>
                  </div>
                </div>
                <div className={`font-bold px-3 py-1 rounded-full bg-white text-sm shadow-sm ${getIMCCategory(imc).color}`}>{getIMCCategory(imc).label}</div>
              </div>
            )}

            <button onClick={() => setStep(2)} disabled={!formData.age || !formData.height || !formData.weight} className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2">Próximo Passo <ChevronRight size={20} /></button>
          </div>
        )}

        {/* Step 2: Estilo de Vida e Saúde */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-slate-100 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-blue-600" />
              <h2 className="text-xl font-bold">Saúde e Objetivo</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Nível de Atividade</label>
                <select name="activityLevel" value={formData.activityLevel} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50">
                  <option>Sedentário</option>
                  <option>Levemente ativo</option>
                  <option>Moderadamente ativo</option>
                  <option>Muito ativo</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Objetivo</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {['Emagrecimento', 'Hipertrofia', 'Resistência', 'Saúde Mental'].map(obj => (
                    <button key={obj} onClick={() => setFormData({...formData, objective: obj})} className={`p-3 rounded-xl border text-sm font-bold transition-all ${formData.objective === obj ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>{obj}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Condições Especiais</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Diabetes', 'Hipertensão', 'Gravidez', 'Lesão no Joelho', 'Asma'].map(cond => (
                    <div key={cond} onClick={() => toggleCondition(cond)} className={`cursor-pointer flex items-center gap-3 p-3 rounded-xl border transition-all ${formData.conditions.includes(cond) ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200'}`}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${formData.conditions.includes(cond) ? 'bg-amber-500 text-white' : 'border-slate-300'}`}>{formData.conditions.includes(cond) && <CheckCircle2 size={14} />}</div>
                      <span className="text-xs font-bold">{cond}</span>
                    </div>
                  ))}
                </div>
                <input type="text" name="customCondition" value={formData.customCondition} onChange={handleInputChange} placeholder="Outra condição..." className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm italic" />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl">Voltar</button>
              <button onClick={generateWorkout} disabled={loading} className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="animate-spin" size={20} /> Gerando...</> : <><Dumbbell size={20} /> Gerar Treino</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Resultado do Treino */}
        {step === 3 && workoutResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-800">{workoutResult.workout_name}</h2>
                  <p className="text-slate-500 text-sm mt-2">Objetivo: {workoutResult.goal} | {workoutResult.frequency_per_week}x por semana</p>
                </div>
                <button onClick={exportToHevy} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100"><Download size={20} /> Exportar para Hevy</button>
              </div>

              {workoutResult.safety_notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8">
                  <div className="flex items-center gap-2 text-amber-800 font-bold mb-1"><AlertTriangle size={18} /> Segurança</div>
                  <p className="text-xs text-amber-700 leading-relaxed">{workoutResult.safety_notes}</p>
                </div>
              )}

              <div className="space-y-8">
                {workoutResult.days.map((day, dIdx) => (
                  <div key={dIdx} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
                      <h3 className="font-black text-blue-900 uppercase text-xs tracking-widest">{day.day} - {day.focus}</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {day.exercises.map((ex, eIdx) => (
                        <div key={eIdx} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">{eIdx + 1}</div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{ex.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 italic">{ex.notes}</p>
                          </div>
                          <div className="flex gap-4">
                            <div className="bg-slate-100 rounded-xl px-3 py-1.5 min-w-[60px] text-center">
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Séries</p>
                              <p className="font-black text-slate-700 text-sm">{ex.sets}</p>
                            </div>
                            <div className="bg-slate-100 rounded-xl px-3 py-1.5 min-w-[60px] text-center">
                              <p className="text-[8px] font-bold text-slate-400 uppercase">Reps</p>
                              <p className="font-black text-slate-700 text-sm">{ex.reps}</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl px-3 py-1.5 min-w-[60px] text-center">
                              <p className="text-[8px] font-bold text-blue-400 uppercase">Descanso</p>
                              <p className="font-black text-blue-700 text-sm">{ex.rest_seconds}s</p>
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
                <p className="text-xs text-slate-500 leading-relaxed">{workoutResult.progression_plan}</p>
              </div>

              <button onClick={() => setStep(1)} className="w-full mt-10 text-slate-400 font-bold text-xs">Novo formulário</button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 animate-bounce">
            <AlertTriangle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <footer className="mt-12 text-center text-slate-400 text-[10px]">
          <p>© 2024 FitGen AI - Consultoria Digital. Consulte sempre um profissional.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;