import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { linkTaskToRoom, getTaskForRoom, unlinkTask } from '../services/taskRoomMap.js';

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

// Map inverse : roomId -> taskId
const roomToTask = new Map();
// Reconstruction de la map inverse au démarrage
for (const [taskId, roomId] of taskToRoom.entries()) {
  roomToTask.set(roomId, taskId);
}

export function linkTaskToRoom(taskId, roomId) {
  if (!taskId || !roomId) return;
  taskToRoom.set(taskId, roomId);
  roomToTask.set(roomId, taskId);
  saveToDisk(taskToRoom);
  console.log(`Lien créé : taskId ${taskId} -> room_id ${roomId}`);
}

export function getRoomForTask(taskId) {
  return taskToRoom.get(taskId) || null;
}

export function getTaskForRoom(roomId) {
  return roomToTask.get(roomId) || null;
}

export function unlinkTask(taskId) {
  const roomId = taskToRoom.get(taskId);
  if (roomId) roomToTask.delete(roomId);
  taskToRoom.delete(taskId);
  saveToDisk(taskToRoom);
}