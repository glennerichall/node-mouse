import {createServicesRegistry} from '../../services/createServicesRegistry.js';
import {initializeCoreServices} from '../../services/createServicesContainer.js';

const services = createServicesRegistry();
await initializeCoreServices(services);
const i18n = services.getI18n();
i18n.translateRoot(document);

// Each point is a gain for a normalized input-speed interval. Calibration
// starts at unity and performs a small local search around that value.
const SPEED_BANDS = [
    {key: 'lente', distance: 0.2},
    {key: 'moderee', distance: 0.4},
    {key: 'rapide', distance: 0.6},
    {key: 'tresRapide', distance: 0.8},
];
// Keep gains ordered from slow to fast, but calibrate the longest distance first.
const CALIBRATION_BAND_ORDER = [3, 2, 1, 0];
const STABILITY_SAMPLE_COUNT = 3;
const STABILITY_TOLERANCE = 0.12;
const STABILITY_MIN_RANGE_MS = 80;
const MAX_TRIALS_PER_BAND = 12;
const MAX_TRIALS = SPEED_BANDS.length * MAX_TRIALS_PER_BAND;
const INITIAL_GAIN = 1;
const INITIAL_STEP = 0.5;
const MIN_GAIN = 0.25;
const MAX_GAIN = 8;
const sessionId = new URLSearchParams(window.location.search).get('session');
const stage = document.getElementById('tuning-stage');
const startTarget = document.getElementById('tuning-start');
const endTarget = document.getElementById('tuning-end');
// Telemetry is only a short-lived client-side buffer used to isolate the
// deltas belonging to the current pair.
const telemetry = [];
const bands = SPEED_BANDS.map((definition) => ({
    ...definition,
    gain: INITIAL_GAIN,
    step: INITIAL_STEP,
    lastDuration: null,
    durations: [],
    trials: 0,
    stable: false,
}));
let lastSequence = 0;
let activeTrial = null;
let currentBandIndex = CALIBRATION_BAND_ORDER[0];
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

function getTargetPosition(rect, distanceRatio) {
    const padding = 70;
    const width = Math.max(rect.width - padding * 2, 1);
    const height = Math.max(rect.height - padding * 2, 1);
    const diagonal = Math.hypot(width, height);
    const distance = diagonal * distanceRatio;
    for (let attempt = 0; attempt < 100; attempt += 1) {
        const start = {x: padding + Math.random() * width, y: padding + Math.random() * height};
        const angle = Math.random() * Math.PI * 2;
        const end = {x: start.x + Math.cos(angle) * distance, y: start.y + Math.sin(angle) * distance};
        if (end.x >= padding && end.x <= padding + width && end.y >= padding && end.y <= padding + height) {
            return {start, end};
        }
    }
    return {
        start: {x: padding, y: padding},
        end: {x: padding + Math.min(distance, width), y: padding},
    };
}

function randomizeTargets() {
    const rect = stage.getBoundingClientRect();
    const band = bands[currentBandIndex];
    const {start, end} = getTargetPosition(rect, band.distance);
    startTarget.style.left = `${start.x}px`;
    startTarget.style.top = `${start.y}px`;
    endTarget.style.left = `${end.x}px`;
    endTarget.style.top = `${end.y}px`;
    document.getElementById('tuning-distance').textContent = t(`mouseTuning.distance.${band.key}`);
    document.getElementById('tuning-threshold').textContent = t('mouseTuning.currentThreshold', {
        threshold: t(`mouseTuning.distance.${band.key}`),
    });
    document.getElementById('tuning-calibrated-thresholds').textContent = t('mouseTuning.calibratedThresholds', {
        thresholds: bands
            .filter((item) => item.stable)
            .map((item) => t(`mouseTuning.distance.${item.key}`))
            .join(', ') || t('mouseTuning.none'),
    });
}

function getTargetVector() {
    const start = startTarget.getBoundingClientRect();
    const end = endTarget.getBoundingClientRect();
    const dx = (end.left + end.width / 2) - (start.left + start.width / 2);
    const dy = (end.top + end.height / 2) - (start.top + start.height / 2);
    return {
        dx,
        dy,
        distance: Math.hypot(dx, dy),
        direction: {
            dx: dx / Math.max(Math.hypot(dx, dy), 1),
            dy: dy / Math.max(Math.hypot(dx, dy), 1),
        },
    };
}

function getMovementDirectionScore(dx, dy, target) {
    return dx * target.direction.dx + dy * target.direction.dy;
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

async function applyTransferFunction(coefficients) {
    // Applying after each trial lets the next movement immediately use the
    // latest per-speed gains; the remote client polls this session independently.
    const response = await fetch('/api/client/mouse-tuning/apply', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({sessionId, coefficients}),
    });
    if (!response.ok) throw new Error(t('mouseTuning.applyFailed'));
}

function updateBandAfterTrial(band, duration, overshot, multipleTouches) {
    const previousDuration = band.lastDuration;
    band.lastDuration = duration;
    band.durations.push(duration);
    if (band.durations.length > STABILITY_SAMPLE_COUNT) band.durations.shift();
    band.trials += 1;

    const timeRange = Math.max(...band.durations) - Math.min(...band.durations);
    const averageDuration = band.durations.reduce((sum, value) => sum + value, 0) / band.durations.length;
    const timeStable = band.durations.length === STABILITY_SAMPLE_COUNT
        && timeRange <= Math.max(STABILITY_MIN_RANGE_MS, averageDuration * STABILITY_TOLERANCE);

    if (timeStable && !overshot && !multipleTouches) {
        band.stable = true;
        return;
    }

    if (previousDuration === null) {
        return;
    }

    if (overshot) {
        band.gain = clamp(band.gain - band.step, MIN_GAIN, MAX_GAIN);
    } else if (multipleTouches || duration > previousDuration) {
        band.gain = clamp(band.gain + band.step, MIN_GAIN, MAX_GAIN);
    }

    if (band.trials >= MAX_TRIALS_PER_BAND) band.stable = true;
}

function getGains() {
    return bands.map((band) => band.gain);
}

function getIsolatedCalibrationGains(band) {
    return bands.map(() => band.gain);
}

function resetTargetsForNextTrial() {
    // This is the idle state between two pairs: only A may start an attempt.
    activeTrial = null;
    startTarget.disabled = false;
    endTarget.disabled = true;
    currentBandIndex = CALIBRATION_BAND_ORDER.find((index) => !bands[index].stable);
    if (currentBandIndex === undefined) currentBandIndex = CALIBRATION_BAND_ORDER[0];
    randomizeTargets();
}

function isCalibrationComplete() {
    return bands.every((band) => band.stable);
}

async function finishTrial() {
    const trial = activeTrial;
    // The last touch event can arrive just after B is clicked.
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    const events = telemetry.filter((event) => event.sequence > trial.startSequence);
    const rawDistance = events.reduce((sum, event) => sum + Math.hypot(event.rawDx, event.rawDy), 0);
    const eventDuration = events.reduce((sum, event) => sum + event.elapsedMs, 0);
    const duration = Math.max(performance.now() - trial.startedAt, eventDuration, 1);

    if (rawDistance < 0.01) {
        resetTargetsForNextTrial();
        setStatus(t('mouseTuning.noMovement'));
        return;
    }

    const netAdjusted = events.reduce((sum, event) => ({
        dx: sum.dx + event.adjustedDx,
        dy: sum.dy + event.adjustedDy,
    }), {dx: 0, dy: 0});
    const netProgress = getMovementDirectionScore(
        netAdjusted.dx,
        netAdjusted.dy,
        trial.target,
    );
    const forwardDistance = events.reduce((sum, event) => sum + Math.max(0,
        getMovementDirectionScore(event.adjustedDx, event.adjustedDy, trial.target)), 0);
    const overshot = netProgress > 0 && forwardDistance > trial.target.distance;
    const touchSequences = new Set(
        events.map((event) => event.touchSequence).filter((sequence) => Number.isFinite(Number(sequence))),
    );
    const multipleTouches = touchSequences.size > 1;
    const band = bands[trial.bandIndex];
    updateBandAfterTrial(band, duration, overshot, multipleTouches);
    document.getElementById('tuning-results').textContent = t('mouseTuning.measurement', {
        current: bands.reduce((sum, item) => sum + item.trials, 0), max: MAX_TRIALS,
        duration: duration.toFixed(0), distance: rawDistance.toFixed(0),
        gain: band.gain.toFixed(2),
        overshot: overshot ? t('mouseTuning.overshot') : t('mouseTuning.targetReached'),
        touches: touchSequences.size || 1,
    });
    document.getElementById('tuning-trial-count').textContent = t('mouseTuning.trialCount', {
        current: bands.reduce((sum, item) => sum + item.trials, 0), max: MAX_TRIALS,
    });

    if (isCalibrationComplete()) {
        try {
            await applyTransferFunction(getGains());
        } catch (error) {
            resetTargetsForNextTrial();
            setStatus(error.message);
            return;
        }
        activeTrial = null;
        startTarget.disabled = true;
        endTarget.disabled = true;
        setStatus(t('mouseTuning.complete'));
        return;
    }

    resetTargetsForNextTrial();
    try {
        await applyTransferFunction(getIsolatedCalibrationGains(bands[currentBandIndex]));
    } catch (error) {
        setStatus(error.message);
        return;
    }
    setStatus(t('mouseTuning.adjusted'));
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
        bandIndex: currentBandIndex,
        target: getTargetVector(),
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
document.getElementById('tuning-trial-count').textContent = t('mouseTuning.trialCount', {current: 0, max: MAX_TRIALS});
if (sessionId) {
    void applyTransferFunction(getIsolatedCalibrationGains(bands[currentBandIndex]))
        .catch((error) => setStatus(error.message));
}
randomizeTargets();
void pollTelemetry();
window.addEventListener('beforeunload', () => window.clearTimeout(pollTimer));
