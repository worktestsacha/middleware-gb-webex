import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { agentsMap } from '../config/agents.js';
import { getTokenB } from './authB.js';

export async function pauseAgentB(agentId, currentState, idleCodeId) {

  const mapping = agentsMap.find(a => a.agentIdA === agentId);
  if (!mapping) {
    throw new Error(`Aucun mapping pour l'agent ${agentId}`);
  }
  console.log('Mapping trouvé :', mapping.emailB);

  let dispatcher = undefined;
  if (process.env.HTTPS_PROXY) {
    dispatcher = new ProxyAgent(process.env.HTTPS_PROXY);
  }

  const fetchWithProxy = (url, options) => {
    if (dispatcher) {
      return undiciFetch(url, { ...options, dispatcher });
    }
    return fetch(url, options);
  };

  console.log('GET users URL :', `${process.env.URL_API_B}/v1/users`);

  const usersResponse = await fetchWithProxy(
    `${process.env.URL_API_B}/v1/users`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Apikey ${process.env.APIKEY_ADMIN_B}`,
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('Status GET users :', usersResponse.status);
  const usersData = await usersResponse.json();

  const users = Array.isArray(usersData) ? usersData :
                usersData.data ? usersData.data :
                usersData.users ? usersData.users :
                usersData.items ? usersData.items : [];

  console.log('Email cherché :', mapping.emailB);
  console.log('Emails disponibles :', users.map(u => u.email));

  const agentB = users.find(u => u.email === mapping.emailB);

  if (!agentB) {
    throw new Error(`Agent B introuvable pour l'email ${mapping.emailB}`);
  }
  console.log('Agent B trouvé :', agentB.id);

  const tokenB = getTokenB(agentId);
  console.log('Token B disponible :', tokenB ? 'oui' : 'non');

  const pause = currentState === 'idle';
  console.log('POST pause URL :', `${process.env.URL_SERVICE_B_WS}/agents/pause`);

  const pauseResponse = await fetchWithProxy(
    `${process.env.URL_SERVICE_B_WS}/agents/pause`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenB}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent: agentB.id,
        pause: pause,
      }),
    }
  );

  console.log('Status pause :', pauseResponse.status);
  const text = await pauseResponse.text();
  console.log('Réponse pause B :', text || 'OK (réponse vide)');
  return text || 'ok';
}