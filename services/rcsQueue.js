const activeRcsRooms = new Set();

export function trackRcsEvent(eventKind, roomId) {
  if (!roomId) return;

  if (eventKind === 'guest_message') {
    activeRcsRooms.add(roomId);
  }

  if (eventKind === 'agent_message' || eventKind === 'session_closed') {
    activeRcsRooms.delete(roomId);
  }

  console.log(`File RCS mise à jour (${eventKind}) → ${activeRcsRooms.size} en attente`);
}

export function getRcsQueueCount() {
  return activeRcsRooms.size;
}