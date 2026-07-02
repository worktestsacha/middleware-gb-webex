import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { getTokenB } from './authB.js';

function fetchWithProxy(url, options) {
  if (process.env.HTTPS_PROXY) {
    const dispatcher = new ProxyAgent(process.env.HTTPS_PROXY);
    return undiciFetch(url, { ...options, dispatcher });
  }
  return fetch(url, options);
}

// Récupère le vrai id de session à partir du session_group_id
async function getSessionId(sessionGroupId, tokenB) {
  const res = await fetchWithProxy(
    `https://guests.greenbureau.com/session-groups/${sessionGroupId}/guests/sessions`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.ok) {
    throw new Error(`Erreur récupération session : ${res.status}`);
  }

  const data = await res.json();
  // Retourne la session active (state: waiting, running, late)
  const activeStates = ['waiting', 'running', 'late'];
  const sessions = Array.isArray(data) ? data : [data];
  const active = sessions.find(s => activeStates.includes(s.state));

  if (!active) {
    throw new Error(`Aucune session active trouvée pour ${sessionGroupId}`);
  }

  console.log(`Session active trouvée : ${active.id} (state: ${active.state})`);
  return { sessionId: active.id, skillId: active.skill_id };
}

export async function sendMessageToGreenBureau(sessionGroupId, agentId, messageText) {
  // Récupère le token agent
  const tokenB = getTokenB(agentId);
  console.log('[DEBUG] tokenB pour agentId', agentId, ':', tokenB ? 'oui' : 'NON');
  if (!tokenB) {
    throw new Error(`Pas de token GreenBureau pour l'agent ${agentId}`);
  }

  // Récupère le vrai id de session
  const { sessionId, skillId } = await getSessionId(sessionGroupId, tokenB);

  const body = {
    date: new Date().toISOString(),
    message: messageText,
    skill: skillId || process.env.DEFAULT_SKILL_ID_B
  };

  console.log(`Envoi message GreenBureau vers session ${sessionId} :`, JSON.stringify(body));

  const res = await fetchWithProxy(
    `https://api.greenbureau.com/v1/console/rooms/${sessionId}/send`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }
  );

  console.log('Réponse envoi GreenBureau :', res.status);

  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Envoi GreenBureau échoué : ${res.status} ${JSON.stringify(err)}`);
  }

  return true;
}