'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, Send, CheckCircle, AlertCircle, Loader2, ChevronRight,
  Pill, Building2, FileText, Calendar, ThumbsUp, ThumbsDown, HelpCircle,
  LogOut, Copy, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { complaintAPI } from '@/lib/api';
import useChatStore, { STEPS } from '@/store/chatStore';

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChatBubble({ role, children, animate = true }) {
  const isBot = role === 'bot';
  return (
    <div className={`flex items-end gap-3 ${isBot ? 'justify-start' : 'justify-end'} ${animate ? 'animate-slide-in' : ''}`}>
      {isBot && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex-shrink-0 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isBot
            ? 'bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-bl-sm border border-emerald-200'
            : 'bg-emerald-600 text-white rounded-br-sm'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }) {
  const stepOrder = [
    STEPS.WELCOME, STEPS.MEDICINE_INFO, STEPS.SYMPTOMS,
    STEPS.USER_SEVERITY, STEPS.NARANJO_Q1, STEPS.NARANJO_Q2,
    STEPS.NARANJO_Q3, STEPS.NARANJO_Q4, STEPS.COMPLETE
  ];
  const labels = ['Start', 'Drug Info', 'Symptoms', 'Severity', 'Q1', 'Q2', 'Q3', 'Q4', 'Done'];
  const visible = [STEPS.WELCOME, STEPS.MEDICINE_INFO, STEPS.SYMPTOMS, STEPS.NARANJO_Q1, STEPS.COMPLETE];
  const visibleLabels = ['Welcome', 'Drug Info', 'Symptoms', 'Causality', 'Complete'];
  const currentIdx = stepOrder.indexOf(currentStep);
  const mappedIdx = currentIdx <= 1 ? 0 : currentIdx <= 2 ? 1 : currentIdx <= 3 ? 2 : currentIdx <= 7 ? 3 : 4;

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {visibleLabels.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-300 ${
            i < mappedIdx
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : i === mappedIdx
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-500/50'
              : 'bg-white/80 border border-emerald-100 text-emerald-700 border border-emerald-200'
          }`}>
            {i < mappedIdx ? <CheckCircle className="w-3 h-3" /> : <span>{i + 1}</span>}
            {label}
          </div>
          {i < visibleLabels.length - 1 && (
            <ChevronRight className={`w-3 h-3 ${i < mappedIdx ? 'text-emerald-500' : 'text-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function AnswerButton({ label, icon: Icon, onClick, variant = 'default' }) {
  const variants = {
    yes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25',
    no: 'bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25',
    unknown: 'bg-slate-500/15 text-emerald-800 border-slate-500/40 hover:bg-slate-500/25',
    default: 'bg-emerald-50 text-emerald-700 border-emerald-500/40 hover:bg-emerald-500/25',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all duration-200 active:scale-95 ${variants[variant]}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}

// ─── Main Chat Page ──────────────────────────────────────────────────────────
export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);

  const {
    step, messages, complaintId, isLoading, apiResult, finalResult,
    setStep, setLoading, addMessage, setComplaintId, setApiResult, setFinalResult, reset
  } = useChatStore();

  // Form states
  const [medicineForm, setMedicineForm] = useState({ medicineName: '', companyName: '' });
  const [symptomForm, setSymptomForm] = useState({ rawSymptomDescription: '', daysFeelingIll: '' });
  const [severitySlider, setSeveritySlider] = useState(5);

  useEffect(() => {
    const token = localStorage.getItem('pv_token');
    const userData = localStorage.getItem('pv_user');
    if (!token || !userData) { router.replace('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role === 'admin') { router.replace('/admin'); return; }
    setUser(parsed);

    // Add welcome message on first load
    let timeoutId;
    if (messages.length === 0) {
      timeoutId = setTimeout(() => {
        addMessage('bot', `Hello${parsed.name ? ', ' + parsed.name : ''}! I'm your pharmacovigilance assistant. I'll help you report an adverse drug reaction quickly and safely. This takes about 2–3 minutes.`);
      }, 400);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step]);

  const logout = () => {
    localStorage.removeItem('pv_token');
    localStorage.removeItem('pv_user');
    reset();
    router.push('/');
  };

  // ── Step Handlers ────────────────────────────────────────────

  const handleStart = () => {
    addMessage('bot', "Great! Let's start. Please tell me the medicine name and the company that manufactures it.");
    setStep(STEPS.MEDICINE_INFO);
  };

  const handleMedicineSubmit = async (e) => {
    e.preventDefault();
    if (!medicineForm.medicineName.trim() || !medicineForm.companyName.trim()) return;

    addMessage('user', `Medicine: ${medicineForm.medicineName} | Company: ${medicineForm.companyName}`);
    setLoading(true);

    try {
      const res = await complaintAPI.start(medicineForm);
      setComplaintId(res.data.data.complaintId);
      addMessage('bot', `Thank you! I've noted the medicine "${medicineForm.medicineName}" by ${medicineForm.companyName}. Now, please describe your symptoms and how many days you have been feeling unwell.`);
      setStep(STEPS.SYMPTOMS);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving medicine info');
    } finally {
      setLoading(false);
    }
  };

  const handleSymptomsSubmit = async (e) => {
    e.preventDefault();
    if (!symptomForm.rawSymptomDescription.trim() || !symptomForm.daysFeelingIll) return;

    addMessage('user', `Symptoms: "${symptomForm.rawSymptomDescription}" | Days ill: ${symptomForm.daysFeelingIll}`);
    setLoading(true);

    addMessage('bot', '🔬 Analysing your symptoms using MedDRA classification... This may take a moment.');

    try {
      const res = await complaintAPI.addSymptoms(complaintId, {
        rawSymptomDescription: symptomForm.rawSymptomDescription,
        daysFeelingIll: Number(symptomForm.daysFeelingIll),
      });

      const { meddraTerm, apiSeverityScore, needsUserScore } = res.data.data;
      setApiResult({ meddraTerm, apiSeverityScore, needsUserScore });

      addMessage('bot', `✅ MedDRA Classification: **${meddraTerm}** (system severity score: ${apiSeverityScore}/10)`);

      if (needsUserScore) {
        setTimeout(() => {
          addMessage('bot', "The system gave a lower severity score. On a scale of 1 to 10, how severe does this feel to you personally? (1 = mild discomfort, 10 = life-threatening)");
          setStep(STEPS.USER_SEVERITY);
        }, 800);
      } else {
        setTimeout(() => {
          addMessage('bot', "Now I'll ask you 4 quick yes/no questions to assess the likelihood that the drug caused your reaction. This is called the Naranjo Causality Assessment.");
          setTimeout(() => {
            addMessage('bot', "**Question 1 of 4:** Did the adverse symptom appear *after* you started taking this medicine?");
            setStep(STEPS.NARANJO_Q1);
          }, 800);
        }, 800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error analysing symptoms');
      // Remove the "analysing" message on error
    } finally {
      setLoading(false);
    }
  };

  const handleUserSeverity = async () => {
    addMessage('user', `My severity: ${severitySlider}/10`);
    setLoading(true);
    try {
      await complaintAPI.addUserSeverity(complaintId, { userSeverityScore: severitySlider });
      addMessage('bot', `Understood. I've noted your severity of ${severitySlider}/10. Now let's assess causality.`);
      setTimeout(() => {
        addMessage('bot', "**Question 1 of 4:** Did the adverse symptom appear *after* you started taking this medicine?");
        setStep(STEPS.NARANJO_Q1);
      }, 600);
    } catch (err) {
      toast.error('Error saving severity');
    } finally {
      setLoading(false);
    }
  };

  const naranjoQuestions = {
    [STEPS.NARANJO_Q1]: { key: 'q1', next: STEPS.NARANJO_Q2, nextMsg: "**Question 2 of 4:** Did the symptom *improve or disappear* after stopping the medicine?" },
    [STEPS.NARANJO_Q2]: { key: 'q2', next: STEPS.NARANJO_Q3, nextMsg: "**Question 3 of 4:** Did the symptom *reappear* when you restarted or re-took the medicine?" },
    [STEPS.NARANJO_Q3]: { key: 'q3', next: STEPS.NARANJO_Q4, nextMsg: "**Question 4 of 4:** Did the *severity of the symptom change* when the dose of the medicine was changed?" },
    [STEPS.NARANJO_Q4]: { key: 'q4', next: null, nextMsg: null },
  };

  const naranjoAnswers = useRef({});

  const handleNaranjoAnswer = async (answer) => {
    const questionConfig = naranjoQuestions[step];
    if (!questionConfig) return;

    const answerLabels = { yes: 'Yes', no: 'No', unknown: "Don't Know" };
    addMessage('user', answerLabels[answer]);
    naranjoAnswers.current[questionConfig.key] = answer;

    if (questionConfig.next) {
      setTimeout(() => {
        addMessage('bot', questionConfig.nextMsg);
        setStep(questionConfig.next);
      }, 400);
    } else {
      // All 4 answered — submit
      setLoading(true);
      addMessage('bot', '⚙️ Calculating Naranjo causality score...');
      try {
        const res = await complaintAPI.submitNaranjo(complaintId, naranjoAnswers.current);
        const data = res.data.data;
        setFinalResult(data);

        addMessage('bot', `🎉 Your report has been submitted successfully!`);
        setTimeout(() => setStep(STEPS.COMPLETE), 600);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error submitting report');
      } finally {
        setLoading(false);
      }
    }
  };

  // ── Render Input Area ────────────────────────────────────────

  const renderInputArea = () => {
    switch (step) {
      case STEPS.WELCOME:
        return (
          <div className="flex justify-center">
            <button id="start-report" onClick={handleStart} className="btn-primary flex items-center gap-2 text-base px-8 py-4 animate-pulse-glow">
              <Shield className="w-5 h-5" />
              Start My Report
            </button>
          </div>
        );

      case STEPS.MEDICINE_INFO:
        return (
          <form onSubmit={handleMedicineSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Pill className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                <input
                  id="medicineName"
                  type="text"
                  required
                  placeholder="Medicine name"
                  value={medicineForm.medicineName}
                  onChange={(e) => setMedicineForm({ ...medicineForm, medicineName: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                <input
                  id="companyName"
                  type="text"
                  required
                  placeholder="Company / Manufacturer"
                  value={medicineForm.companyName}
                  onChange={(e) => setMedicineForm({ ...medicineForm, companyName: e.target.value })}
                  className="input-field pl-10"
                />
              </div>
            </div>
            <button id="submit-medicine" type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Continue
            </button>
          </form>
        );

      case STEPS.SYMPTOMS:
        return (
          <form onSubmit={handleSymptomsSubmit} className="space-y-3">
            <div className="relative">
              <FileText className="absolute left-3 top-4 w-4 h-4 text-emerald-600" />
              <textarea
                id="symptomDescription"
                required
                rows={3}
                placeholder="Describe your symptoms in detail (e.g., severe headache, nausea, rash on arms...)"
                value={symptomForm.rawSymptomDescription}
                onChange={(e) => setSymptomForm({ ...symptomForm, rawSymptomDescription: e.target.value })}
                className="input-field pl-10 resize-none"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
              <input
                id="daysFeelingIll"
                type="number"
                required
                min="0"
                placeholder="Number of days feeling ill"
                value={symptomForm.daysFeelingIll}
                onChange={(e) => setSymptomForm({ ...symptomForm, daysFeelingIll: e.target.value })}
                className="input-field pl-10"
              />
            </div>
            <button id="submit-symptoms" type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Analysing...</> : <><Send className="w-4 h-4" />Analyse Symptoms</>}
            </button>
          </form>
        );

      case STEPS.USER_SEVERITY:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-emerald-700">
                <span>Mild (1)</span>
                <span className="text-2xl font-black gradient-text">{severitySlider}</span>
                <span>Severe (10)</span>
              </div>
              <input
                id="severitySlider"
                type="range"
                min="1"
                max="10"
                value={severitySlider}
                onChange={(e) => setSeveritySlider(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-emerald-700">
                {[1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
              </div>
            </div>
            <button id="submit-severity" onClick={handleUserSeverity} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit ({severitySlider}/10)
            </button>
          </div>
        );

      case STEPS.NARANJO_Q1:
      case STEPS.NARANJO_Q2:
      case STEPS.NARANJO_Q3:
      case STEPS.NARANJO_Q4:
        return (
          <div className="flex flex-wrap justify-center gap-3">
            <AnswerButton id="answer-yes" label="Yes" icon={ThumbsUp} onClick={() => handleNaranjoAnswer('yes')} variant="yes" />
            <AnswerButton id="answer-no" label="No" icon={ThumbsDown} onClick={() => handleNaranjoAnswer('no')} variant="no" />
            <AnswerButton id="answer-unknown" label="Don't Know" icon={HelpCircle} onClick={() => handleNaranjoAnswer('unknown')} variant="unknown" />
          </div>
        );

      case STEPS.COMPLETE:
        return null; // Shown inline in messages

      default:
        return null;
    }
  };

  // ── Complete Card ────────────────────────────────────────────

  const renderCompleteCard = () => {
    if (step !== STEPS.COMPLETE || !finalResult) return null;

    const categoryColors = {
      Probable: 'text-red-400 bg-red-500/10 border-red-500/30',
      Possible: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      Doubtful: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    };

    return (
      <div className="animate-slide-in glass rounded-2xl p-6 border-emerald-300 border mt-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-950">Report Submitted!</h3>
            <p className="text-emerald-700 text-sm">Your ADR has been recorded</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/80 border border-emerald-100 rounded-xl">
            <span className="text-emerald-700 text-sm">Case ID</span>
            <div className="flex items-center gap-2">
              <code className="text-emerald-700 text-sm font-mono">{finalResult.complaintId}</code>
              <button
                onClick={() => { navigator.clipboard.writeText(finalResult.complaintId); toast.success('Copied!'); }}
                className="text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/80 border border-emerald-100 rounded-xl">
            <span className="text-emerald-700 text-sm">MedDRA Term</span>
            <span className="text-emerald-900 text-sm font-semibold">{finalResult.meddraTerm}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/80 border border-emerald-100 rounded-xl">
            <span className="text-emerald-700 text-sm">Naranjo Score</span>
            <span className="text-emerald-900 text-sm font-semibold">{finalResult.causalityScore}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/80 border border-emerald-100 rounded-xl">
            <span className="text-emerald-700 text-sm">Causality Category</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full border ${categoryColors[finalResult.causalityCategory]}`}>
              {finalResult.causalityCategory}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/80 border border-emerald-100 rounded-xl">
            <span className="text-emerald-700 text-sm">Total Severity Score</span>
            <span className={`text-sm font-bold ${finalResult.totalIssueScore >= 8 ? 'text-red-400' : finalResult.totalIssueScore >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {finalResult.totalIssueScore}/10
            </span>
          </div>
        </div>

        <button
          id="new-report"
          onClick={() => { reset(); router.push('/dashboard'); }}
          className="btn-secondary w-full mt-4 text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  };

  // ── Main Render ──────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-emerald-950 text-sm">PharmaVigil</h1>
            <p className="text-emerald-600 text-xs">ADR Reporting Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-emerald-600 hover:text-emerald-800 text-sm font-semibold transition-colors px-3 py-1.5 bg-emerald-50 rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <StepIndicator currentStep={step} />
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto py-4 min-h-[400px]">
        {messages.map((msg) => (
          <ChatBubble key={msg.id} role={msg.role}>
            <span dangerouslySetInnerHTML={{
              __html: msg.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
            }} />
          </ChatBubble>
        ))}

        {isLoading && (
          <ChatBubble role="bot" animate={false}>
            <div className="flex items-center gap-2 text-emerald-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          </ChatBubble>
        )}

        {renderCompleteCard()}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isLoading && step !== STEPS.COMPLETE && (
        <div className="glass rounded-2xl p-4 mt-4 border border-emerald-200">
          {renderInputArea()}
        </div>
      )}
    </div>
  );
}
