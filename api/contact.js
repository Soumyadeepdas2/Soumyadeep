/* Vercel serverless: the browser never talks to FormSubmit.
   FormSubmit's own page sometimes skips hCaptcha, says "success",
   and never mails. This path is the same server POST that did deliver. */

const TO = 'soumyadeepdas044@gmail.com';
const ENDPOINT = 'https://formsubmit.co/ajax/' + TO;
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

function siteOrigin(req) {
  const origin = String(req.headers.origin || '');
  const referer = String(req.headers.referer || '');
  if (/^https:\/\/(www\.)?soumyadeep\.space$/i.test(origin)) return origin;
  try {
    const u = new URL(referer);
    if (/^(www\.)?soumyadeep\.space$/i.test(u.hostname)) return u.origin;
  } catch {}
  return SITE;
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
    if (wantsJson) {
      res.status(400).json({ ok: false, message: 'Please check the fields.' });
    } else {
      res.status(400).send('Please check the fields.');
    }
    return;
  }

  const origin = siteOrigin(req);

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: origin,
        Referer: origin + '/',
      },
      body: JSON.stringify({
        name,
        email,
        message,
        subject,
        _subject: `[Portfolio] ${subject} — ${name}`,
        _replyto: email,
        _template: 'table',
        _captcha: 'false',
      }),
    });
    let j = {};
    try { j = await r.json(); } catch {}
    const sent = r.ok && String(j.success) !== 'false';
    if (!sent) {
      if (wantsJson) {
        res.status(502).json({ ok: false, message: 'Send failed' });
      } else {
        res.status(502).send('Send failed');
      }
      return;
    }
    if (wantsJson) {
      res.status(200).json({ ok: true });
      return;
    }
    res.statusCode = 303;
    res.setHeader('Location', '/?sent=1#contact');
    res.end();
  } catch {
    if (wantsJson) {
      res.status(502).json({ ok: false, message: 'Send failed' });
    } else {
      res.status(502).send('Send failed');
    }
  }
};
