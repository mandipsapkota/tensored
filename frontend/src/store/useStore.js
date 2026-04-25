import { create } from 'zustand';

const useStore = create((set) => ({
  // User State — restored from localStorage on app load
  user: JSON.parse(localStorage.getItem('animax_user') || 'null'),

  login: (userData) => {
    localStorage.setItem('animax_user', JSON.stringify(userData));
    if (userData.token) {
      localStorage.setItem('animax_token', userData.token);
    }
    set({ user: userData });
  },

  logout: () => {
    localStorage.removeItem('animax_user');
    localStorage.removeItem('animax_token');
    set({ user: null });
  },

  // Subjects & Topics
  subjects: [],
  setSubjects: (subjects) => set({ subjects }),
  currentSubject: null,
  setCurrentSubject: (subject) => set({ currentSubject: subject }),
  currentTopic: null,
  setCurrentTopic: (topic) => set({ currentTopic: topic }),

  // Animation & Learning State
  animationProgress: 0, // 0 to 100
  setAnimationProgress: (progress) => set({ animationProgress: progress }),
  
  // Quiz State
  quizAnswers: {},
  setQuizAnswer: (questionId, answerIndex) => set((state) => ({
    quizAnswers: { ...state.quizAnswers, [questionId]: answerIndex }
  })),
  clearQuizAnswers: () => set({ quizAnswers: {} }),
  
  // Performance State
  score: 0,
  setScore: (score) => set({ score }),
}));

export default useStore;
