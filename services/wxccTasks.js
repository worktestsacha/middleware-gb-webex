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

export async function createWxccTaskFromRcs(roomId, messageText) {
  const accessToken = process.env.WXCC_ACCESS_TOKEN;

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
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log('Réponse Create Task :', response.status, JSON.stringify(data));

  if (response.status !== 201) {
    throw new Error(`Create Task échoué : ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

export function extractRoomIdFromOrigin(origin) {
  const match = origin?.match(/^rcs-client-(.+)@greenbureau\.fr$/);
  return match ? match[1] : null;
}