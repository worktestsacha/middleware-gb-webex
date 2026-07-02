import { Router } from 'express';
import { loginB } from '../services/authB.js';
import { pauseAgentB } from '../services/pauseB.js';
import { trackRcsEvent } from '../services/rcsQueue.js';
import { createWxccTaskFromRcs, appendMessageToWxccTask, endWxccTask, extractRoomIdFromOrigin } from '../services/wxccTasks.js';
import { linkTaskToRoom, getTaskForRoom, unlinkTask } from '../services/taskRoomMap.js';
import { sendMessageToGreenBureau } from '../services/greenBureauSend.js';

export const webhookRouter = Router();


const seenEventIds = new Set();

webhookRouter.post('/agent-login', async (req, res) => {
  const { type, data } = req.body;
  console.log('======= WEBHOOK REÇU =======');
  console.log('Body reçu :', JSON.stringify(req.body, null, 2));

  if (type !== 'agent:login') {
    return res.status(200).json({ received: true, ignored: true });
  }

  const agentId = data?.agentId;
  if (!agentId) return res.status(400).json({ error: 'agentId manquant' });

  res.json({ received: true });

  try {
    await loginB(agentId);
    console.log(`Login B réussi pour l'agent ${agentId}`);
  } catch (err) {
    console.error(`Erreur login B :`, err.message);
    console.error(`Détail :`, err.cause);
  }
});

webhookRouter.post('/agent-state', async (req, res) => {
  const { type, data } = req.body;
  console.log('======= STATE CHANGE REÇU =======');
  console.log('Body reçu :', JSON.stringify(req.body, null, 2));

  if (type !== 'agent:state_change') {
    return res.status(200).json({ received: true, ignored: true });
  }

  const { agentId, currentState, idleCodeId } = data;
  if (!agentId) return res.status(400).json({ error: 'agentId manquant' });

  res.json({ received: true });

  if (currentState !== 'idle' && currentState !== 'available') {
    console.log(`État ignoré : ${currentState}`);
    return;
  }

  try {
    await pauseAgentB(agentId, currentState, idleCodeId);
  } catch (err) {
    console.error(`Erreur pause B :`, err.message);
  }
});

webhookRouter.post('/discussion-event', async (req, res) => {
  console.log('======= DISCUSSION EVENT REÇU =======');
  console.log(JSON.stringify(req.body, null, 2));

  res.json({ received: true });

  const data = req.body?.data;

  if (data?.channel === 'rcs') {
    trackRcsEvent(data.kind, data.room_id);

    if (data.kind === 'guest_message') {
      const eventId = data.event_id;

      if (seenEventIds.has(eventId)) {
        console.log(`Event ${eventId} déjà traité, on ignore (doublon)`);
        return;
      }
      seenEventIds.add(eventId);

      const messageText = Array.isArray(data.content) ? data.content[0] : data.content;
      const existingTaskId = getTaskForRoom(data.room_id);

      try {
        if (existingTaskId) {
          console.log(`Tâche existante pour room ${data.room_id} : ${existingTaskId} → append message`);
          try {
            await appendMessageToWxccTask(existingTaskId, messageText);
          } catch (appendErr) {
            console.log(`Append échoué (tâche expirée), suppression du lien et création nouvelle tâche`);
            unlinkTask(existingTaskId);
            await createWxccTaskFromRcs(data.room_id, messageText);
          }
        } else {
          console.log(`Pas de tâche pour room ${data.room_id} → Create Task`);
          await createWxccTaskFromRcs(data.room_id, messageText);
        }
      } catch (err) {
        console.error('Erreur envoi message WxCC :', err.message);
      }
    }

    if (data.kind === 'session_closed') {
      const existingTaskId = getTaskForRoom(data.room_id);
      if (existingTaskId) {
        console.log(`Session GreenBureau fermée, clôture tâche Webex CC : ${existingTaskId}`);
        try {
          await endWxccTask(existingTaskId);
          unlinkTask(existingTaskId);
          console.log(`Tâche ${existingTaskId} clôturée et lien supprimé`);
        } catch (err) {
          console.error('Erreur clôture tâche WxCC :', err.message);
        }
      }
    }
  }
});

webhookRouter.post('/wxcc-tasks', async (req, res) => {
  console.log('======= WXCC TASK EVENT REÇU =======');
  console.log(JSON.stringify(req.body, null, 2));

  res.json({ received: true });

  const { type, data } = req.body;

  if (type === 'task:new') {
    const roomId = extractRoomIdFromOrigin(data.origin);
    if (roomId) {
      linkTaskToRoom(data.taskId, roomId);
    }
  }
});

webhookRouter.post('/wxcc-outbound', async (req, res) => {
  console.log('======= WXCC OUTBOUND REÇU =======');
  console.log(JSON.stringify(req.body, null, 2));

  res.json({ received: true });

  const data = req.body?.data;

  console.log('[DEBUG] messageDirection:', data?.messageDirection);
  console.log('[DEBUG] senderType:', data?.senderType);

  if (data?.messageDirection !== 'OUTBOUND' || data?.senderType !== 'agent') {
    console.log('[DEBUG] Filtré');
    return;
  }

  const messageText = data?.channelParams?.message?.text;
  console.log('[DEBUG] messageText:', messageText);
  if (!messageText) return;

  const roomId = extractRoomIdFromOrigin(data.origin);
  console.log('[DEBUG] roomId:', roomId);
  if (!roomId) {
    console.log('Pas de room_id GreenBureau dans origin, message ignoré');
    return;
  }

  try {
    await sendMessageToGreenBureau(roomId, messageText);
    console.log(`Message agent transmis à GreenBureau pour room ${roomId}`);
  } catch (err) {
    console.error('Erreur envoi message GreenBureau :', err.message);
  }
});