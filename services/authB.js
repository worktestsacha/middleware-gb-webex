import { ProxyAgent, fetch as undiciFetch } from 'undici';

const tokenStore = new Map();

export async function loginB(agentId) {
  const credentials = getCredentials(agentId);

  if (!credentials) {
    throw new Error(`Aucun credentials trouvé pour l'agent ${agentId}`);
  }

  const url = `${process.env.URL_SERVICE_B}/api/user/login`;

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer null',
    },
    body: JSON.stringify({
      email:    credentials.email,
      password: credentials.password,
    }),
  };

  if (process.env.HTTPS_PROXY) {
    const proxyAgent = new ProxyAgent(process.env.HTTPS_PROXY);
    fetchOptions.dispatcher = proxyAgent;
  }

  const response = process.env.HTTPS_PROXY
    ? await undiciFetch(url, fetchOptions)
    : await fetch(url, fetchOptions);

  const text = await response.text();
  console.log('Réponse brute B :', text);

  if (!response.ok) {
    throw new Error(`Login B échoué : ${response.status}`);
  }

  const data = JSON.parse(text);
  const token = data.token;

  tokenStore.set(agentId, token);
  console.log(`Token B stocké pour l'agent ${agentId}`);

  return token;
}

export function getTokenB(agentId) {
  return tokenStore.get(agentId) || null;
}

function getCredentials(agentId) {
  const map = {
    [process.env.AGENT_ID_TEST]: {
      email:    process.env.EMAIL_AGENT_TEST,
      password: process.env.PASSWORD_AGENT_TEST,
    },
  };

  return map[agentId] || null;
}