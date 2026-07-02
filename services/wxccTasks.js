import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { randomUUID } from 'crypto';

const ORIGIN_PREFIX = 'rcs-client-';
const DESTINATION = process.env.WXCC_DESTINATION;
const CHANNEL = process.env.WXCC_CHANNEL;

function fetchWithProxy(url, options) {
  if (process.env.HTTPS_PROXY) {
    const dispatcher = new ProxyAgent(process.env.HTTPS_PROXY);
    return undiciFetch(url, { ...options, dispatcher });
  }
  return fetch(url, options);
}

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.WXCC_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

export async function createWxccTaskFromRcs(roomId, messageText) {
  const body = {
    origin: {
      id: `${ORIGIN_PREFIX}${roomId}@greenbureau.fr`,
      name: 'Client RCS'
    },
    destination: {
      id: DESTINATION,
      type: 'businessAddress'
    },
    channelType: 'customMessaging',
    channel: CHANNEL,
    channelParams: {
      type: 'text',
      message: {
        aliasId: randomUUID(),
        text: messageText || '(message vide)',
        timestamp: Date.now()
      }
    }
  };

  console.log('Create Task body :', JSON.stringify(body));

  const response = await fetchWithProxy('https://api.wxcc-eu2.cisco.com/v2/tasks', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log('Réponse Create Task :', response.status, JSON.stringify(data));

  if (response.status !== 201) {
    throw new Error(`Create Task échoué : ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export async function appendMessageToWxccTask(taskId, messageText) {
  const body = {
    mediaType: 'customMessaging',
    channelParams: {
      type: 'text',
      message: {
        aliasId: randomUUID(),
        text: messageText || '(message vide)',
        timestamp: Date.now()
      }
    }
  };

  console.log(`Append message to task ${taskId} :`, JSON.stringify(body));

  const response = await fetchWithProxy(`https://api.wxcc-eu2.cisco.com/v2/tasks/${taskId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log('Réponse Append Message :', response.status, JSON.stringify(data));

if (response.status !== 200 && response.status !== 201 && response.status !== 202) {
        throw new Error(`Append Message échoué : ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export function extractRoomIdFromOrigin(origin) {
  const match = origin?.match(/^rcs-client-(.+)@greenbureau\.fr$/);
  return match ? match[1] : null;
}

export async function endWxccTask(taskId) {
  const response = await fetchWithProxy(`https://api.wxcc-eu2.cisco.com/v1/tasks/${taskId}/end`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({})
  });

  console.log('Réponse End Task :', response.status);

  if (response.status !== 202) {
    const data = await response.json();
    throw new Error(`End Task échoué : ${response.status} ${JSON.stringify(data)}`);
  }

  return true;
}