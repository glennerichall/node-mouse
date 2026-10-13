import {
  POINTER_FAST_SPEED_STORAGE_KEY,
  POINTER_SLOW_SPEED_STORAGE_KEY,
} from '../../preferences/constants.js';

const DEFAULT_SLOW_SPEED = 1.3;
const DEFAULT_FAST_SPEED = 3;
const MIN_SPEED = 0.25;
const MAX_SLOW_SPEED = 5;
const MAX_FAST_SPEED = 8;
const cards = [...document.querySelectorAll('.mouse-tuning-card')];
const currentSlow = Number(localStorage.getItem(POINTER_SLOW_SPEED_STORAGE_KEY)) || DEFAULT_SLOW_SPEED;
const currentFast = Number(localStorage.getItem(POINTER_FAST_SPEED_STORAGE_KEY)) || DEFAULT_FAST_SPEED;
const measurements = new Map();
const selectedModes = new Map(cards.map((card) => [card, 'slow']));
let activeMeasurement = null;
let recommendation = null;

const formatSpeed = (value) => `${Number(value).toFixed(2)}×`;
const formatOutput = (value) => `${Math.round(value)} px/s`;
const measurementKey = (card, mode) => `${card.dataset.distance}:${mode}`;

document.getElementById('current-slow-speed').textContent = formatSpeed(currentSlow);
document.getElementById('current-fast-speed').textContent = formatSpeed(currentFast);

function setStatus(message) {
  document.getElementById('tuning-status').textContent = message;
}

function updateRecommendation() {
  if (measurements.size !== cards.length * 2) {
    recommendation = null;
    document.getElementById('tuning-recommendation').textContent = 'Mesurez les trois distances en vitesse lente et rapide pour obtenir une proposition.';
    document.getElementById('apply-tuning').disabled = true;
    return;
  }

  const average = (mode) => cards
    .map((card) => measurements.get(measurementKey(card, mode)).averageSpeed)
    .reduce((sum, value) => sum + value, 0) / cards.length;
  const slowOutput = average('slow');
  const fastOutput = average('fast');
  const ratio = fastOutput / Math.max(slowOutput, 1);
  recommendation = {
    slowSpeed: Math.min(MAX_SLOW_SPEED, Math.max(MIN_SPEED, currentSlow)),
    fastSpeed: Math.min(MAX_FAST_SPEED, Math.max(currentSlow, currentSlow * ratio)),
  };
  document.getElementById('tuning-recommendation').textContent = `Résultat : ${formatOutput(slowOutput)} en vitesse lente contre ${formatOutput(fastOutput)} en vitesse rapide (×${ratio.toFixed(2)}). Proposition : lente ${formatSpeed(recommendation.slowSpeed)}, rapide ${formatSpeed(recommendation.fastSpeed)}.`;
  document.getElementById('apply-tuning').disabled = false;
}

function calculateMeasurement(card, mode, endEvent) {
  const samples = activeMeasurement.samples;
  const elapsed = Math.max(performance.now() - activeMeasurement.startedAt, 1);
  const distance = Math.hypot(endEvent.clientX - activeMeasurement.startX, endEvent.clientY - activeMeasurement.startY);
  const speeds = samples.slice(1).map((sample, index) => {
    const previous = samples[index];
    const dt = Math.max(sample.time - previous.time, 1);
    return Math.hypot(sample.x - previous.x, sample.y - previous.y) / dt * 1000;
  });
  const measurement = {
    distance,
    duration: elapsed,
    averageSpeed: distance / elapsed * 1000,
    maxSpeed: Math.max(0, ...speeds),
  };
  measurements.set(measurementKey(card, mode), measurement);
  card.querySelector(`[data-result-${mode}]`).textContent = `${mode === 'slow' ? 'Vitesse lente' : 'Vitesse rapide'} : ${formatOutput(measurement.averageSpeed)} moyen · ${formatOutput(measurement.maxSpeed)} max`;
  activeMeasurement = null;
  setStatus(`${measurements.size}/6 mesures réalisées.`);
  updateRecommendation();
}

for (const card of cards) {
  const track = card.querySelector('.mouse-tuning-track');
  for (const modeButton of card.querySelectorAll('[data-mode]')) {
    modeButton.addEventListener('click', () => {
      selectedModes.set(card, modeButton.dataset.mode);
      for (const button of card.querySelectorAll('[data-mode]')) {
        button.setAttribute('aria-pressed', button === modeButton ? 'true' : 'false');
      }
      setStatus(`Mode ${modeButton.dataset.mode === 'slow' ? 'lent' : 'rapide'} sélectionné pour la distance ${card.dataset.distance}.`);
    });
  }
  track.addEventListener('pointermove', (event) => {
    if (!activeMeasurement || activeMeasurement.card !== card) return;
    activeMeasurement.samples.push({x: event.clientX, y: event.clientY, time: performance.now()});
  });
  track.querySelector('[data-side="start"]').addEventListener('click', (event) => {
    const now = performance.now();
    activeMeasurement = {
      card,
      mode: selectedModes.get(card),
      startX: event.clientX,
      startY: event.clientY,
      startedAt: now,
      samples: [{x: event.clientX, y: event.clientY, time: now}],
    };
    const result = card.querySelector(`[data-result-${activeMeasurement.mode}]`);
    result.textContent = `${activeMeasurement.mode === 'slow' ? 'Vitesse lente' : 'Vitesse rapide'} : déplacez-vous vers Arrivée…`;
    setStatus(`Distance ${card.dataset.distance}, vitesse ${activeMeasurement.mode === 'slow' ? 'lente' : 'rapide'} en cours.`);
  });
  track.querySelector('[data-side="end"]').addEventListener('click', (event) => {
    if (!activeMeasurement || activeMeasurement.card !== card) {
      setStatus('Cliquez d’abord sur Départ pour cette distance.');
      return;
    }
    activeMeasurement.samples.push({x: event.clientX, y: event.clientY, time: performance.now()});
    calculateMeasurement(card, activeMeasurement.mode, event);
  });
}

document.getElementById('apply-tuning').addEventListener('click', () => {
  if (!recommendation) return;
  localStorage.setItem(POINTER_SLOW_SPEED_STORAGE_KEY, String(recommendation.slowSpeed));
  localStorage.setItem(POINTER_FAST_SPEED_STORAGE_KEY, String(recommendation.fastSpeed));
  window.dispatchEvent(new CustomEvent('preferences-storage:changed'));
  document.getElementById('current-slow-speed').textContent = formatSpeed(recommendation.slowSpeed);
  document.getElementById('current-fast-speed').textContent = formatSpeed(recommendation.fastSpeed);
  setStatus('Proposition appliquée à ce navigateur.');
});

document.getElementById('reset-tuning').addEventListener('click', () => {
  measurements.clear();
  activeMeasurement = null;
  for (const card of cards) {
    card.querySelector('[data-result-slow]').textContent = 'Vitesse lente : pas encore mesurée.';
    card.querySelector('[data-result-fast]').textContent = 'Vitesse rapide : pas encore mesurée.';
  }
  setStatus('Mesures effacées.');
  updateRecommendation();
});
