import {createServicesRegistry} from '../../services/createServicesRegistry.js';
import {initializeCoreServices} from '../../services/createServicesContainer.js';

const services = createServicesRegistry();
await initializeCoreServices(services);
const i18n = services.getI18n();
i18n.translateRoot(document);

// The calibration stops either at the hard limit or after one successful
// timing target has been reached for each distance class.
const MAX_TRIALS = 16;
const MIN_TRIALS = 4;
const POLYNOMIAL_ORDER = 3;
const DISTANCE_THRESHOLDS_MS = {courte: 450, moyenne: 800, longue: 1200};
const sessionId = new URLSearchParams(window.location.search).get('session');
const stage = document.getElementById('tuning-stage');
const startTarget = document.getElementById('tuning-start');
const endTarget = document.getElementById('tuning-end');
// `measurements` feeds the polynomial fit. `telemetry` is only a short-lived
// client-side buffer used to isolate the deltas belonging to the current pair.
const measurements = [];
const telemetry = [];
const reachedThresholds = new Set();
let lastSequence = 0;
let activeTrial = null;
let currentDistance = 'moyenne';
let pollTimer = null;

function setStatus(message) {
    document.getElementById('tuning-status').textContent = message;
}

function t(key, params) {
    return i18n.t(key, params);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function randomizeTargets() {
    const rect = stage.getBoundingClientRect();
    const padding = 70;
    const width = Math.max(rect.width - padding * 2, 1);
    const height = Math.max(rect.height - padding * 2, 1);
    const start = {x: padding + Math.random() * width, y: padding + Math.random() * height};
    let end;
    do {
        end = {x: padding + Math.random() * width, y: padding + Math.random() * height};
    } while (Math.hypot(end.x - start.x, end.y - start.y) < 90);
    startTarget.style.left = `${start.x}px`;
    startTarget.style.top = `${start.y}px`;
    endTarget.style.left = `${end.x}px`;
    endTarget.style.top = `${end.y}px`;
    // The class is based on the normalized distance, so it remains meaningful
    // when the host browser is resized or used on another screen.
    const distance = Math.hypot(end.x - start.x, end.y - start.y) / Math.hypot(rect.width, rect.height);
    currentDistance = distance > 0.55 ? 'longue' : distance > 0.3 ? 'moyenne' : 'courte';
    document.getElementById('tuning-distance').textContent = t(`mouseTuning.distance.${currentDistance}`);
}

async function pollTelemetry() {
    if (!sessionId) {
        setStatus(t('mouseTuning.sessionMissing'));
        return;
    }
    try {
        // Sequence numbers prevent a movement event from being counted twice.
        const response = await fetch(`/api/client/mouse-tuning/events?session=${encodeURIComponent(sessionId)}&after=${lastSequence}`, {cache: 'no-store'});
        if (!response.ok) throw new Error(t('mouseTuning.sessionUnavailable'));
        const result = await response.json();
        lastSequence = result.next;
        telemetry.push(...result.events);
        if (telemetry.length > 500) telemetry.splice(0, telemetry.length - 500);
    } catch (error) {
        setStatus(error.message);
    }
    pollTimer = window.setTimeout(pollTelemetry, 100);
}

function solveLinearSystem(matrix, values) {
    // Gaussian elimination solves the normal equations without adding a
    // numerical dependency to this small, browser-only calibration page.
    const size = values.length;
    for (let pivot = 0; pivot < size; pivot += 1) {
        let row = pivot;
        for (let candidate = pivot + 1; candidate < size; candidate += 1) {
            if (Math.abs(matrix[candidate][pivot]) > Math.abs(matrix[row][pivot])) row = candidate;
        }
        [matrix[pivot], matrix[row]] = [matrix[row], matrix[pivot]];
        [values[pivot], values[row]] = [values[row], values[pivot]];
        const divisor = matrix[pivot][pivot] || 1e-9;
        
        for (let column = pivot; column < size; column += 1) {
            matrix[pivot][column] /= divisor;
        }
        
        values[pivot] /= divisor;
       
        for (let other = 0; other < size; other += 1) {
            if (other === pivot) continue;
            const factor = matrix[other][pivot];
            for (let column = pivot; column < size; column += 1) {
                matrix[other][column] -= factor * matrix[pivot][column];
            }
            values[other] -= factor * values[pivot];
        }
    }
    return values;
}

function fitTransferFunction() {
    if (measurements.length < MIN_TRIALS) return null;
    // x is normalized input speed; y is the gain needed to reach the timing
    // target. The fitted coefficients are consumed by applyPointerTransfer().
    const size = POLYNOMIAL_ORDER + 1;
    const matrix = Array.from({length: size}, () => Array(size).fill(0));
    const values = Array(size).fill(0);
    for (const point of measurements) {
        const powers = Array.from({length: size}, (_, index) => point.x ** index);
        for (let row = 0; row < size; row += 1) {
            values[row] += powers[row] * point.y;
            for (let column = 0; column < size; column += 1) {
                matrix[row][column] += powers[row] * powers[column];
            }
        }
    }
    return solveLinearSystem(matrix, values).map((value) => clamp(value, -20, 20));
}

async function applyTransferFunction(coefficients) {
    // Applying after each fit lets the next physical movement immediately use
    // the latest curve; the remote client polls this session independently.
    const response = await fetch('/api/client/mouse-tuning/apply', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({sessionId, coefficients}),
    });
    if (!response.ok) throw new Error(t('mouseTuning.applyFailed'));
}

function resetTargetsForNextTrial() {
    // This is the idle state between two pairs: only A may start an attempt.
    activeTrial = null;
    startTarget.disabled = false;
    endTarget.disabled = true;
    randomizeTargets();
}

function isCalibrationComplete() {
    return measurements.length >= MAX_TRIALS || (
        measurements.length >= MIN_TRIALS && reachedThresholds.size === Object.keys(DISTANCE_THRESHOLDS_MS).length
    );
}

async function finishTrial() {
    const trial = activeTrial;
    // The last touch event can arrive just after B is clicked.
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const events = telemetry.filter((event) => event.sequence > trial.startSequence);
    const rawDistance = events.reduce((sum, event) => sum + Math.hypot(event.rawDx, event.rawDy), 0);
    const adjustedDistance = events.reduce((sum, event) => sum + Math.hypot(event.adjustedDx, event.adjustedDy), 0);
    const eventDuration = events.reduce((sum, event) => sum + event.elapsedMs, 0);
    const duration = Math.max(performance.now() - trial.startedAt, eventDuration, 1);

    if (rawDistance < 0.01) {
        resetTargetsForNextTrial();
        setStatus(t('mouseTuning.noMovement'));
        return;
    }

    const threshold = DISTANCE_THRESHOLDS_MS[trial.distance];
    const inputSpeed = clamp((rawDistance / duration) / 0.75, 0, 1);
    const observedGain = adjustedDistance > 0 ? adjustedDistance / rawDistance : 1;
    // If the user took longer than the target, increase the desired gain; if
    // the target was reached quickly, reduce it. This produces the polynomial
    // point for the observed input speed.
    const targetGain = clamp(observedGain * duration / threshold, 0.25, 8);
    measurements.push({x: inputSpeed, y: targetGain});
    if (duration <= threshold) reachedThresholds.add(trial.distance);

    const coefficients = fitTransferFunction();
    document.getElementById('tuning-results').textContent = t('mouseTuning.measurement', {
        current: measurements.length, max: MAX_TRIALS,
        duration: duration.toFixed(0), distance: rawDistance.toFixed(0),
    });
    document.getElementById('tuning-trial-count').textContent = t('mouseTuning.trialCount', {
        current: measurements.length, max: MAX_TRIALS,
    });

    if (coefficients) {
        try {
            await applyTransferFunction(coefficients);
        } catch (error) {
            resetTargetsForNextTrial();
            setStatus(error.message);
            return;
        }
    }

    if (isCalibrationComplete()) {
        activeTrial = null;
        startTarget.disabled = true;
        endTarget.disabled = true;
        setStatus(t('mouseTuning.complete'));
        return;
    }

    resetTargetsForNextTrial();
    setStatus(coefficients
        ? t('mouseTuning.adjusted')
        : t('mouseTuning.measurementsRemaining', {count: MIN_TRIALS - measurements.length}));
}

// A -> B is the only valid state transition. Disabling the buttons also
// prevents duplicate starts while the telemetry and fit are being finalized.
startTarget.disabled = false;
endTarget.disabled = true;
startTarget.addEventListener('click', () => {
    if (activeTrial || isCalibrationComplete()) return;
    activeTrial = {
        startSequence: lastSequence,
        startedAt: performance.now(),
        distance: currentDistance,
    };
    startTarget.disabled = true;
    endTarget.disabled = false;
    setStatus(t('mouseTuning.startActivated'));
});

endTarget.addEventListener('click', () => {
    if (!activeTrial) {
        setStatus(t('mouseTuning.clickStartFirst'));
        return;
    }
    endTarget.disabled = true;
    startTarget.disabled = false;
    void finishTrial();
});

document.getElementById('tuning-recommendation').textContent = t('mouseTuning.instructions');
randomizeTargets();
void pollTelemetry();
window.addEventListener('beforeunload', () => window.clearTimeout(pollTimer));

