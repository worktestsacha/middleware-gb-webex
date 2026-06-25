import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_FILE = path.join(__dirname, 'rcsQueue.json');

function loadFromDisk() {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveToDisk(set) {
  fs.writeFileSync(STORE_FILE, JSON.stringify([...set]));
}

const activeRcsRooms = loadFromDisk();

export function trackRcsEvent(eventKind, roomId) {
  if (!roomId) return;

  const enAttente = ['session_created', 'session_waiting', 'session_late', 'guest_message'];
  const priseEnCharge = ['session_running', 'agent_message', 'session_closed'];

  if (enAttente.includes(eventKind)) {
    activeRcsRooms.add(roomId);
  }

  if (priseEnCharge.includes(eventKind)) {
    activeRcsRooms.delete(roomId);
  }

  saveToDisk(activeRcsRooms);
  console.log(`File RCS mise à jour (${eventKind}) → ${activeRcsRooms.size} en attente`);
}

export function getRcsQueueCount() {
  return activeRcsRooms.size;
}