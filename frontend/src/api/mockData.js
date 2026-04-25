export const MOCK_SUBJECTS = [
  { id: 's1', title: 'Physics', icon: 'Atom', progress: 60, totalTopics: 12, completedTopics: 7 },
  { id: 's2', title: 'Mathematics', icon: 'Calculator', progress: 45, totalTopics: 15, completedTopics: 6 },
  { id: 's3', title: 'Computer Science', icon: 'Code', progress: 80, totalTopics: 10, completedTopics: 8 },
  { id: 's4', title: 'Biology', icon: 'Dna', progress: 20, totalTopics: 20, completedTopics: 4 },
];

export const MOCK_TOPICS = {
  's1': [
    { id: 't1', title: 'Newtonian Motion', duration: '8 mins', progress: 100 },
    { id: 't2', title: 'Electricity & Circuits', duration: '12 mins', progress: 40 },
    { id: 't3', title: 'Wave Properties', duration: '6 mins', progress: 0 },
  ]
};

export const MOCK_ANIMATION_SCRIPT = [
  {
    order: 1,
    text: '1. Superposition: Qubits exist in multiple states at once.',
    duration: 6,
    canvas_code: `
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const CX = canvas.width / 2;
      const CY = canvas.height / 2;
      const radius = 130;

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CX, CY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(CX, CY, radius, radius * 0.38, 0, 0, Math.PI * 2);
      ctx.stroke();

      const vectorX = CX + Math.sin(time * 2) * radius * Math.cos(time);
      const vectorY = CY + Math.cos(time * 2) * radius;

      ctx.shadowColor = '#00f2ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(vectorX, vectorY);
      ctx.stroke();

      ctx.fillStyle = '#00f2ff';
      ctx.beginPath();
      ctx.arc(vectorX, vectorY, 7, 0, Math.PI * 2);
      ctx.fill();
    `,
  },
  {
    order: 2,
    text: '2. Entanglement: Qubits become perfectly synchronized.',
    duration: 8,
    canvas_code: `
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const p1X = canvas.width * 0.3;
      const p2X = canvas.width * 0.7;
      const Y = canvas.height * 0.52;

      ctx.strokeStyle = 'rgba(191, 0, 255, 0.36)';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 15]);
      ctx.lineDashOffset = -time * 50;
      ctx.beginPath();
      ctx.moveTo(p1X, Y);
      ctx.lineTo(p2X, Y);
      ctx.stroke();
      ctx.setLineDash([]);

      const syncPulse = Math.sin(time * 5);
      [p1X, p2X].forEach((x) => {
        const glow = 15 + syncPulse * 10;
        ctx.shadowColor = '#bf00ff';
        ctx.shadowBlur = glow;
        ctx.fillStyle = '#bf00ff';
        ctx.beginPath();
        ctx.arc(x, Y, 26, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 2; i += 1) {
          const orbX = x + Math.cos(time * 3 + i * Math.PI) * 58;
          const orbY = Y + Math.sin(time * 3 + i * Math.PI) * 20;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    `,
  },
  {
    order: 3,
    text: '3. Interference: Collapsing waves into the correct result.',
    duration: 6,
    canvas_code: `
      ctx.fillStyle = '#050510';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i += 1) {
        const waveY = 60 + i * 34;
        ctx.beginPath();
        ctx.moveTo(0, waveY);
        for (let x = 0; x < canvas.width; x += 10) {
          const amp = i === 5 ? 34 : 10;
          const y = waveY + Math.sin(x * 0.05 + time * 10) * amp;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = i === 5 ? '#39ff14' : 'rgba(0, 255, 255, 0.25)';
        ctx.stroke();
      }

      if (time % 2 > 1.4) {
        ctx.shadowColor = '#39ff14';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#39ff14';
        ctx.font = '700 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RESULT: 1', canvas.width / 2, canvas.height - 34);
      }
    `,
  },
];

export const MOCK_QUIZ = [
  {
    id: 'q1',
    question: "What concept describes an object's resistance to a change in motion?",
    options: ["Friction", "Inertia", "Gravity", "Acceleration"],
    correctAnswer: 1
  },
  {
    id: 'q2',
    question: "According to Newton's Second Law, if you double the force applied to an object, its acceleration will:",
    options: ["Halve", "Remain the same", "Double", "Quadruple"],
    correctAnswer: 2
  }
];

export const MOCK_PERFORMANCE = {
  score: 85,
  accuracy: 90,
  timeTaken: "4m 20s",
  aiFeedback: [
    { type: 'positive', message: "You understood Inertia perfectly." },
    { type: 'improvement', message: "You struggled slightly with the formula F=ma. Watch Scene 4 again." }
  ]
};
