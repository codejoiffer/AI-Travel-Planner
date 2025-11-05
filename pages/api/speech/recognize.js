import crypto from 'crypto';
import WebSocket from 'ws';

function buildIatWsUrl() {
  const host = 'iat-api.xfyun.cn';
  const date = new Date().toUTCString();
  const requestLine = 'GET /v2/iat HTTP/1.1';
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;
  const signatureSha = crypto
    .createHmac('sha256', process.env.SPEECH_API_SECRET)
    .update(signatureOrigin)
    .digest('base64');
  // According to iFlytek docs, authorization should be comma-separated KV pairs with quoted values
  const authorizationOrigin = `api_key="${process.env.SPEECH_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  const url = `wss://${host}/v2/iat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  return url;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  const { pcmBase64 } = req.body || {};

  const hasKeys = !!(process.env.APPID && process.env.SPEECH_API_KEY && process.env.SPEECH_API_SECRET);
  if (!hasKeys) {
    return res.status(400).json({ error: 'Speech keys missing' });
  }
  if (!pcmBase64) {
    return res.status(400).json({ error: 'pcmBase64 required (16k, 16bit PCM)' });
  }

  const wsUrl = buildIatWsUrl();
  let finalText = '';
  let responded = false;
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    const frame0 = {
      common: { app_id: process.env.APPID },
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        dwa: 'wpgs',
      },
      data: {
        status: 0,
        format: 'audio/L16;rate=16000',
        encoding: 'raw',
        audio: pcmBase64,
      },
    };
    ws.send(JSON.stringify(frame0));
    const frameEnd = {
      data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' },
    };
    ws.send(JSON.stringify(frameEnd));
  });

  ws.on('message', (msg) => {
    try {
      const payload = JSON.parse(msg.toString());
      if (payload.code !== 0) {
        // iFlytek returns error
        // eslint-disable-next-line no-console
        console.error('iFlytek error:', payload);
        return;
      }
      const resultWs = payload?.data?.result?.ws;
      if (Array.isArray(resultWs)) {
        finalText += resultWs.map((w) => w.cw.map((c) => c.w).join('')).join('');
      }
      if (payload?.data?.status === 2) {
        try { ws.close(); } catch {}
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('parse message error', e);
    }
  });

  ws.on('close', () => {
    if (!responded) {
      responded = true;
      res.status(200).json({ text: finalText });
    }
  });

  ws.on('error', (err) => {
    if (!responded) {
      responded = true;
      res.status(502).json({ error: err.message });
    }
  });

  // Provide clearer diagnostics on handshake failures (e.g., 401 Unauthorized)
  ws.on('unexpected-response', (request, response) => {
    try {
      const status = response?.statusCode || 0;
      const msg = response?.statusMessage || 'Unexpected response';
      const headers = Object.fromEntries(Object.entries(response?.headers || {}).slice(0, 10));
      // Avoid leaking sensitive info; return minimal diagnostics
      if (!responded) {
        responded = true;
        res.status(status || 502).json({ error: `${status} ${msg}`, hint: 'Check APPID/API Key/API Secret and service enablement', code: 'xfyun_handshake' });
      }
    } catch {
      if (!responded) {
        responded = true;
        res.status(502).json({ error: 'Handshake failed', code: 'xfyun_handshake' });
      }
    }
  });

  setTimeout(() => {
    if (!responded) {
      responded = true;
      try { ws.close(); } catch {}
      res.status(504).json({ error: 'iFlytek ASR timeout' });
    }
  }, 15000);
}
