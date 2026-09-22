/* Vercel serverless. Browser posts here; we mail through FormSubmit.
   Node's fetch() strips Origin (forbidden header). FormSubmit then
   answers success:false — "open this page through a web server" —
   and the site shows "didn't send". https.request keeps Origin. */

const https = require('https');

const TO = 'soumyadeepdas044@gmail.com';
const SITE = 'https://www.soumyadeep.space';

function parseBody(req) {
  const raw = req.body;
  if (raw && typeof raw === 'object' && !Buffer.isBuffer(raw)) return raw;
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw || '');
  const ct = String(req.headers['content-type'] || '');
  if (ct.includes('application/json')) {
    try { return JSON.parse(text || '{}'); } catch { return {}; }
  }
  return Object.fromEntries(new URLSearchParams(text));
}

function postFormSubmit(payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'formsubmit.co',
        path: '/ajax/' + TO,
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Origin: SITE,
          Referer: SITE + '/',
          'User-Agent': 'Mozilla/5.0 (compatible; soumyadeep.space/1.0)',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
      }
    );
    req.setTimeout(25000, () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function reply(res, wantsJson, code, payload) {
  if (wantsJson) {
    res.status(code).json(payload);
    return;
  }
  if (code === 200) {
    res.statusCode = 303;
    res.setHeader('Location', '/?sent=1#contact');
    res.end();
    return;
  }
  res.status(code).send(payload.message || 'Send failed');
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, message: 'POST only' });
    return;
  }

  const data = parseBody(req);
  const name = String(data.name || '').trim();
  const email = String(data.email || '').trim();
  const subject = String(data.subject || 'Portfolio enquiry').trim();
  const message = String(data.message || '').trim();
  const wantsJson = String(req.headers.accept || '').includes('application/json');

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10) {
    reply(res, wantsJson, 400, { ok: false, message: 'Please check the fields.' });
    return;
  }

  try {
    const r = await postFormSubmit({
      name,
      email,
      message,
      subject,
      _subject: `[Portfolio] ${subject} — ${name}`,
      _replyto: email,
      _template: 'table',
      _captcha: 'false',
    });
    let j = {};
    try { j = JSON.parse(r.body); } catch {}
    const sent = r.status >= 200 && r.status < 300 && String(j.success) !== 'false';
    if (!sent) {
      console.error('formsubmit', r.status, r.body);
      reply(res, wantsJson, 502, { ok: false, message: 'Send failed' });
      return;
    }
    reply(res, wantsJson, 200, { ok: true });
  } catch (err) {
    console.error('formsubmit error', err);
    reply(res, wantsJson, 502, { ok: false, message: 'Send failed' });
  }
};
