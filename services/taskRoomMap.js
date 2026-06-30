import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_FILE = path.join(__dirname, 'taskRoomMap.json');

function loadFromDisk() {
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return new Map(Object.entries(JSON.parse(raw)));
  } catch {
    return new Map();
  }
}

function saveToDisk(map) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(Object.fromEntries(map)));
}

const taskToRoom = loadFromDisk();

export function linkTaskToRoom(taskId, roomId) {
  if (!taskId || !roomId) return;
  taskToRoom.set(taskId, roomId);
  saveToDisk(taskToRoom);
  console.log(`Lien créé : taskId ${taskId} -> room_id ${roomId}`);
}

export function getRoomForTask(taskId) {
  return taskToRoom.get(taskId) || null;
}

export function unlinkTask(taskId) {
  taskToRoom.delete(taskId);
  saveToDisk(taskToRoom);
}