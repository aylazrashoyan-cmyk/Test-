// ===== Состояние =====
const state = {
  score: 0,
  streak: 0,
  mode: null,
  questionNum: 0,
  totalQuestions: 10,
  correctInRound: 0,
  currentAnswer: null,
};

const QUESTIONS_PER_ROUND = 10;

// Загружаем прогресс
function loadProgress() {
  const saved = localStorage.getItem('math3-progress');
  if (saved) {
    const data = JSON.parse(saved);
    state.score = data.score || 0;
    state.streak = data.streak || 0;
  }
  updateStats();
}

function saveProgress() {
  localStorage.setItem('math3-progress', JSON.stringify({
    score: state.score,
    streak: state.streak,
  }));
}

function updateStats() {
  document.getElementById('score').textContent = state.score;
  document.getElementById('streak').textContent = state.streak;
}

// ===== Генераторы вопросов =====
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// Уникальные варианты ответов, один из которых правильный
function makeOptions(correct) {
  const opts = new Set([correct]);
  while (opts.size < 4) {
    let delta = rand(1, 10);
    const candidate = Math.random() > 0.5 ? correct + delta : correct - delta;
    if (candidate > 0) opts.add(candidate);
  }
  return shuffle([...opts]);
}

function generateMultiply() {
  const a = rand(2, 9);
  const b = rand(2, 9);
  // Иногда деление вместо умножения
  if (Math.random() < 0.4) {
    const product = a * b;
    return {
      text: `${product} ÷ ${a} = ?`,
      answer: b,
    };
  }
  return { text: `${a} × ${b} = ?`, answer: a * b };
}

function generateHundreds() {
  const isAdd = Math.random() > 0.5;
  if (isAdd) {
    const a = rand(100, 800);
    const b = rand(50, 199);
    return { text: `${a} + ${b} = ?`, answer: a + b };
  } else {
    const a = rand(200, 999);
    const b = rand(50, a - 50);
    return { text: `${a} − ${b} = ?`, answer: a - b };
  }
}

const logicTasks = [
  { text: 'У Пети 5 яблок, у Васи в 3 раза больше. Сколько у Васи?', answer: 15 },
  { text: 'В корзине 24 гриба, треть — белые. Сколько белых?', answer: 8 },
  { text: 'Книга стоит 120 ₽. Сколько стоят 3 книги?', answer: 360 },
  { text: 'Лента 96 см, отрезали четверть. Сколько осталось?', answer: 72 },
  { text: 'В 4 коробках по 8 карандашей. Сколько всего?', answer: 32 },
  { text: 'Было 50 конфет, съели 2/5. Сколько осталось?', answer: 30 },
  { text: 'Периметр квадрата 36 см. Чему равна сторона?', answer: 9 },
  { text: 'У Маши 18 наклеек, это в 2 раза больше, чем у Оли. Сколько у Оли?', answer: 9 },
  { text: 'Сколько минут в двух с половиной часах?', answer: 150 },
  { text: 'Один альбом 45 ₽. Сколько сдачи с 200 ₽ за 3 альбома?', answer: 65 },
  { text: 'За 5 тетрадей заплатили 100 ₽. Сколько стоит одна?', answer: 20 },
  { text: 'В классе 28 учеников, 3/4 — девочки. Сколько мальчиков?', answer: 7 },
];

function generateLogic() {
  const task = logicTasks[rand(0, logicTasks.length - 1)];
  return { text: task.text, answer: task.answer, options: makeOptions(task.answer) };
}

// ===== Игровой цикл =====
function startGame(mode) {
  state.mode = mode;
  state.questionNum = 0;
  state.correctInRound = 0;
  showScreen('game');
  nextQuestion();
}

function nextQuestion() {
  if (state.questionNum >= QUESTIONS_PER_ROUND) {
    endGame();
    return;
  }
  state.questionNum++;

  let q;
  if (state.mode === 'multiply') q = generateMultiply();
  else if (state.mode === 'hundreds') q = generateHundreds();
  else q = generateLogic();

  state.currentAnswer = q.answer;
  document.getElementById('question').textContent = q.text;
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';

  const options = q.options || makeOptions(q.answer);
  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => checkAnswer(btn, opt));
    answersDiv.appendChild(btn);
  });
}

function checkAnswer(btn, chosen) {
  const buttons = document.querySelectorAll('.answer-btn');
  buttons.forEach(b => b.disabled = true);

  const feedback = document.getElementById('feedback');

  if (chosen === state.currentAnswer) {
    btn.classList.add('correct');
    state.score += 10;
    state.streak += 1;
    state.correctInRound++;
    feedback.textContent = state.streak >= 3
      ? `🔥 Отлично! Серия ${state.streak}!`
      : '✅ Правильно!';
    feedback.className = 'feedback good';
  } else {
    btn.classList.add('wrong');
    state.streak = 0;
    feedback.textContent = `❌ Неверно. Правильный ответ: ${state.currentAnswer}`;
    feedback.className = 'feedback bad';
    // Подсветить правильный
    buttons.forEach(b => {
      if (Number(b.textContent) === state.currentAnswer) b.classList.add('correct');
    });
  }

  updateStats();
  saveProgress();

  setTimeout(nextQuestion, 1200);
}

function endGame() {
  const correct = state.correctInRound;
  let title, text;
  if (correct >= 9) { title = '🏆 Великолепно!'; text = `Ты решил ${correct} из ${QUESTIONS_PER_ROUND} — это уровень чемпиона!`; }
  else if (correct >= 7) { title = '🎉 Отлично!'; text = `Ты решил ${correct} из ${QUESTIONS_PER_ROUND}. Ещё немного тренировки!`; }
  else if (correct >= 5) { title = '👍 Хорошо!'; text = `Ты решил ${correct} из ${QUESTIONS_PER_ROUND}. Продолжай тренироваться!`; }
  else { title = '💪 Не сдавайся!'; text = `Ты решил ${correct} из ${QUESTIONS_PER_ROUND}. Попробуй ещё раз — получится!`; }

  document.getElementById('result-title').textContent = title;
  document.getElementById('result-text').textContent = text;
  showScreen('result');
}

// ===== Навигация =====
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name).classList.add('active');
}

// ===== Инициализация =====
document.addEventListener('DOMContentLoaded', () => {
  loadProgress();

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => startGame(btn.dataset.mode));
  });

  document.getElementById('back-btn').addEventListener('click', () => showScreen('menu'));
  document.getElementById('again-btn').addEventListener('click', () => startGame(state.mode));
  document.getElementById('menu-btn').addEventListener('click', () => showScreen('menu'));

  document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm('Сбросить весь прогресс?')) {
      localStorage.removeItem('math3-progress');
      state.score = 0;
      state.streak = 0;
      updateStats();
    }
  });
});
