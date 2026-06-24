import { Router } from 'express';
import { loginB, getTokenB } from '../services/authB.js';
import { pauseAgentB } from '../services/pauseB.js';
import { agentsMap } from '../config/agents.js';
import { trackRcsEvent } from '../services/rcsQueue.js';


export const webhookRouter = Router();

webhookRouter.post('/agent-login', async (req, res) => {

  const { type, data } = req.body;

   console.log('======= WEBHOOK REÇU =======');
  console.log('Body reçu :', JSON.stringify(req.body, null, 2));
  console.log('Webhook reçu :', JSON.stringify(req.body, null, 2));

  if (type !== 'agent:login') {
    return res.status(200).json({ received: true, ignored: true });
  }

  const agentId = data?.agentId;

  if (!agentId) {
    return res.status(400).json({ error: 'agentId manquant' });
  }

  console.log(`Webhook agent:login reçu pour l'agent ${agentId}`);

  res.json({ received: true });

  try {
    await loginB(agentId);
    console.log(`Login B réussi pour l'agent ${agentId}`);
  } catch (err) {
    console.error(`Erreur login B :`, err.message);
    console.error(`Détail :`, err.cause); 
  }
});



// Login automatique
webhookRouter.post('/agent-login', async (req, res) => {
  const { type, data } = req.body;
  console.log('======= WEBHOOK REÇU =======');
  console.log('Body reçu :', JSON.stringify(req.body, null, 2));

  if (type !== 'agent:login') {
    return res.status(200).json({ received: true, ignored: true });
  }

  const agentId = data?.agentId;
  if (!agentId) {
    return res.status(400).json({ error: 'agentId manquant' });
  }

  res.json({ received: true });

  try {
    await loginB(agentId);
    console.log(`Login B réussi pour l'agent ${agentId}`);
  } catch (err) {
    console.error(`Erreur login B :`, err.message);
    console.error(`Détail :`, err.cause);
  }
});

// Changement de statut → pause
webhookRouter.post('/agent-state', async (req, res) => {
  const { type, data } = req.body;

  console.log('======= STATE CHANGE REÇU =======');
  console.log('Body reçu :', JSON.stringify(req.body, null, 2));

  if (type !== 'agent:state_change') {
    return res.status(200).json({ received: true, ignored: true });
  }

  const { agentId, currentState, idleCodeId } = data;

  if (!agentId) {
    return res.status(400).json({ error: 'agentId manquant' });
  }

  // On répond immédiatement à Webex
  res.json({ received: true });

  // On traite uniquement idle et available
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
  }
});