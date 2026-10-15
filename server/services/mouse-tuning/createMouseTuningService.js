import {randomUUID} from 'node:crypto';

const SESSION_TTL_MS = 30 * 60_000;
const MAX_EVENTS = 4_000;

export function createMouseTuningService({now = Date.now} = {}) {
  const sessions = new Map();

  function purge() {
    const cutoff = now() - SESSION_TTL_MS;
    for (const [id, session] of sessions) {
      if (session.createdAt < cutoff) sessions.delete(id);
    }
  }

  function createSession(deviceSessionId) {
    purge();
    for (const [id, session] of sessions) {
      if (session.deviceSessionId === deviceSessionId) sessions.delete(id);
    }
    const session = {
      id: randomUUID(),
      deviceSessionId: String(deviceSessionId || ''),
      createdAt: now(),
      nextSequence: 1,
      events: [],
      transferFunction: [],
    };
    sessions.set(session.id, session);
    return {id: session.id};
  }

  function getSession(id) {
    purge();
    return sessions.get(String(id || '')) || null;
  }

  function getSessionForDevice(deviceSessionId) {
    purge();
    return [...sessions.values()].find((session) => session.deviceSessionId === String(deviceSessionId || '')) || null;
  }

  function setTransferFunction(id, coefficients) {
    const session = getSession(id);
    if (!session || !Array.isArray(coefficients)) return false;
    session.transferFunction = coefficients.slice(0, 4).map(Number).filter(Number.isFinite);
    return session.transferFunction.length >= 2;
  }

  function recordMovement({sessionId, deviceSessionId, rawDx, rawDy, adjustedDx, adjustedDy, elapsedMs, touchSequence}) {
    const session = getSession(sessionId);
    if (!session || session.deviceSessionId !== String(deviceSessionId || '')) return false;
    session.events.push({
      sequence: session.nextSequence++,
      type: 'movement',
      at: now(),
      rawDx: Number(rawDx) || 0,
      rawDy: Number(rawDy) || 0,
      adjustedDx: Number(adjustedDx) || 0,
      adjustedDy: Number(adjustedDy) || 0,
      elapsedMs: Math.max(Number(elapsedMs) || 1, 1),
      touchSequence: Number.isFinite(Number(touchSequence)) ? Number(touchSequence) : null,
    });
    if (session.events.length > MAX_EVENTS) session.events.splice(0, session.events.length - MAX_EVENTS);
    return true;
  }

  function readEvents(id, after = 0) {
    const session = getSession(id);
    if (!session) return null;
    return {
      next: session.nextSequence - 1,
      events: session.events.filter((event) => event.sequence > Number(after || 0)),
    };
  }

  return {createSession, getSessionForDevice, readEvents, recordMovement, setTransferFunction};
}
