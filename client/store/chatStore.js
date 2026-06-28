import { create } from 'zustand';

const STEPS = {
  WELCOME: 'WELCOME',
  MEDICINE_INFO: 'MEDICINE_INFO',
  SYMPTOMS: 'SYMPTOMS',
  USER_SEVERITY: 'USER_SEVERITY',
  NARANJO_Q1: 'NARANJO_Q1',
  NARANJO_Q2: 'NARANJO_Q2',
  NARANJO_Q3: 'NARANJO_Q3',
  NARANJO_Q4: 'NARANJO_Q4',
  COMPLETE: 'COMPLETE',
};

export { STEPS };

const useChatStore = create((set, get) => ({
  step: STEPS.WELCOME,
  messages: [],
  complaintId: null,
  medicineData: { medicineName: '', companyName: '' },
  symptomData: { rawSymptomDescription: '', daysFeelingIll: '' },
  apiResult: { meddraTerm: '', apiSeverityScore: null, needsUserScore: false },
  userSeverityScore: null,
  naranjoAnswers: { q1: null, q2: null, q3: null, q4: null },
  finalResult: null,
  isLoading: false,
  error: null,

  setStep: (step) => set({ step }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  addMessage: (role, content, type = 'text', meta = {}) =>
    set((state) => ({
      messages: [...state.messages, { id: Date.now() + Math.random(), role, content, type, meta, timestamp: new Date() }],
    })),

  setComplaintId: (id) => set({ complaintId: id }),
  setMedicineData: (data) => set({ medicineData: data }),
  setSymptomData: (data) => set({ symptomData: data }),
  setApiResult: (result) => set({ apiResult: result }),
  setUserSeverityScore: (score) => set({ userSeverityScore: score }),
  setNaranjoAnswer: (question, answer) =>
    set((state) => ({
      naranjoAnswers: { ...state.naranjoAnswers, [question]: answer },
    })),
  setFinalResult: (result) => set({ finalResult: result }),

  reset: () =>
    set({
      step: STEPS.WELCOME,
      messages: [],
      complaintId: null,
      medicineData: { medicineName: '', companyName: '' },
      symptomData: { rawSymptomDescription: '', daysFeelingIll: '' },
      apiResult: { meddraTerm: '', apiSeverityScore: null, needsUserScore: false },
      userSeverityScore: null,
      naranjoAnswers: { q1: null, q2: null, q3: null, q4: null },
      finalResult: null,
      isLoading: false,
      error: null,
    }),
}));

export default useChatStore;
