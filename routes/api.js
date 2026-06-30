// Regroupement de tous les POST //


import { Router } from 'express';
import { getRoomForTask } from '../services/taskRoomMap.js';
import { getRcsQueueCount } from '../services/rcsQueue.js';

export const apiRouter = Router();

// API MISE EN PAUSE STATUT //
// A correspond cisco 
// B correspond GreenBureau


apiRouter.post('/pause', async (req, res, next) => {
  const { action, aux_code_id } = req.body;
  // action   = "pause" ou "resume"
  // aux_code_id = les 34 caractères qui identifient l'agent côté A

  try {

    // ── Étape 1 : GET sur B pour récupérer l'id agent
    const getResponse = await fetch(`${process.env.URL_SERVICE_B}/agents`, {
      method: 'GET',
      headers: {
        'apikey': process.env.API_KEY_SERVICE_B,
      },
    });

    if (!getResponse.ok) {
      return res.status(502).json({ error: 'Impossible de récupérer les agents B' });
    }

    const agents = await getResponse.json();

    // Tu cherches l'agent qui correspond à ton aux_code_id
    // À adapter selon la structure exacte que renvoie le GET de B
    const agent = agents.find(a => a.aux_code_id === aux_code_id);

    if (!agent) {
      return res.status(404).json({ error: `Agent introuvable pour l'id ${aux_code_id}` });
    }

    const agentIdB = agent.id; // l'id côté B

    // ── Étapes 2 & 3 : POST sur A et B en parallèle
    const [resultA, resultB] = await Promise.allSettled([

      // Service A
      fetch(`${process.env.URL_SERVICE_A}/status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.API_KEY_SERVICE_A}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: action === 'pause' ? 'idle' : 'available',
          auxCodeId: aux_code_id,
        }),
      }),

      // Service B
      fetch(`${process.env.URL_SERVICE_B}/agents/pause`, {
        method: 'POST',
        headers: {
          'apikey': process.env.API_KEY_SERVICE_B,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent: agentIdB,
          pause: action === 'pause' ? true : false,
        }),
      }),

    ]);

    const echecA = resultA.status === 'rejected';
    const echecB = resultB.status === 'rejected';

    if (echecA || echecB) {
      return res.status(207).json({
        success: false,
        serviceA: echecA ? 'échec' : 'ok',
        serviceB: echecB ? 'échec' : 'ok',
      });
    }

    res.json({
      success: true,
      agent: agentIdB,
      auxCodeId: aux_code_id,
      status: action === 'pause' ? 'paused' : 'resumed',
    });

  } catch (err) {
    next(err);
  }
});

apiRouter.get('/rcs-queue-count', (req, res) => {
  res.json({ count: getRcsQueueCount() });
});

apiRouter.get('/room-for-task/:taskId', (req, res) => {
  const roomId = getRoomForTask(req.params.taskId);

  if (!roomId) {
    return res.status(404).json({ error: 'Aucune conversation trouvée pour ce taskId' });
  }

  res.json({ roomId });
});