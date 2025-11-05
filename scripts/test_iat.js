const crypto = require('crypto');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Load .env manually
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (m) {
        const key = m[1];
        const val = m[2];
        if (key && typeof process.env[key] === 'undefined') {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  // ignore
}

function buildIatWsUrl() {
  const host = 'iat-api.xfyun.cn';
  const date = new Date().toUTCString();
  const requestLine = 'GET /v2/iat HTTP/1.1';
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;
  const signatureSha = crypto
    .createHmac('sha256', process.env.SPEECH_API_SECRET)
    .update(signatureOrigin)
    .digest('base64');
  const authorizationOrigin = `api_key="${process.env.SPEECH_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');
  const url = `wss://${host}/v2/iat?authorization=${authorization}&date=${encodeURIComponent(date)}&host=${host}`;
  return url;
}

function makeSilentPcmBase64(seconds = 2, rate = 16000) {
  const samples = seconds * rate;
  const arr = new Int16Array(samples);
  const buf = Buffer.from(arr.buffer);
  return buf.toString('base64');
}

async function main() {
  const { APPID, SPEECH_API_KEY, SPEECH_API_SECRET } = process.env;
  if (!APPID || !SPEECH_API_KEY || !SPEECH_API_SECRET) {
    console.error('Missing env: APPID / SPEECH_API_KEY / SPEECH_API_SECRET');
    process.exit(1);
  }
  const wsUrl = buildIatWsUrl();
  console.log('Connecting:', wsUrl.replace(/authorization=[^&]+/, 'authorization=...'));
  const ws = new WebSocket(wsUrl);
  let finalText = '';

  ws.on('open', () => {
    const pcmBase64 = makeSilentPcmBase64(2, 16000);
    const frame0 = {
      common: { app_id: APPID },
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
    const frameEnd = { data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' } };
    ws.send(JSON.stringify(frameEnd));
  });

  ws.on('message', (msg) => {
    try {
      const payload = JSON.parse(msg.toString());
      if (payload.code !== 0) {
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
      console.error('parse message error', e);
    }
  });

  ws.on('unexpected-response', (request, response) => {
    const status = response?.statusCode || 0;
    const msg = response?.statusMessage || 'Unexpected response';
    console.error('Handshake failed:', status, msg);
    response.on('data', (chunk) => {
      try { console.error('Body:', chunk.toString()); } catch {}
    });
  });

  ws.on('close', () => {
    console.log('Final text:', finalText);
    process.exit(0);
  });

  ws.on('error', (err) => {
    console.error('WS error:', err.message);
    process.exit(2);
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
