// Early access sign-ups from kivo.africa.
// With BREVO_API_KEY set: adds the contact to the Brevo list "Website – early access"
// and emails the team. Without it: forwards to the kivoafrica.com lead service, as before.
'use strict';

const LIST_ID = Number(process.env.BREVO_EARLY_ACCESS_LIST_ID || 7);
const NOTIFY_TO = process.env.LEAD_NOTIFY_EMAIL || 'yemi@kivo.africa';
const SENDER = { name: 'Kivo website', email: process.env.LEAD_SENDER_EMAIL || 'hello@kivo.africa' };
const FALLBACK = 'https://www.kivoafrica.com/api/leads';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (value, max = 160) => String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const escapeHtml = (value) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function brevo(path, body) {
  const response = await fetch(`https://api.brevo.com/v3${path}`, {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok && response.status !== 204) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Brevo ${path} ${response.status} ${detail.slice(0, 200)}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ success: false, message: 'Method not allowed.' }); }
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});

  // Honeypot: real people never see or fill this field.
  if (clean(body.website)) return res.status(200).json({ success: true });

  const lead = {
    fullName: clean(body.fullName, 120),
    email: clean(body.email, 160).toLowerCase(),
    companyName: clean(body.companyName, 160),
    sitesCount: clean(body.sitesCount, 20),
    primaryModule: clean(body.primaryModule, 200),
    role: clean(body.role, 60),
    buildingType: clean(body.buildingType, 60),
    whatsapp: clean(body.whatsapp, 24).replace(/[^\d+ ]/g, ''),
    marketing: body.marketing === true,
    intent: 'trial',
  };
  if (!lead.fullName || !lead.companyName || !EMAIL.test(lead.email)) {
    return res.status(400).json({ success: false, message: 'Please add your name, a valid work email and your company.' });
  }

  try {
    if (!process.env.BREVO_API_KEY) {
      const forward = await fetch(FALLBACK, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fullName: lead.fullName, email: lead.email, companyName: lead.companyName, sitesCount: lead.sitesCount, primaryModule: lead.primaryModule.slice(0, 60), intent: 'trial' }) });
      const result = await forward.json().catch(() => ({}));
      return res.status(forward.ok && result.success ? 200 : 502).json(forward.ok && result.success ? { success: true } : { success: false, message: 'We couldn’t send that just now. Please try again, or WhatsApp us.' });
    }

    const [first, ...rest] = lead.fullName.split(/\s+/);
    await brevo('/contacts', {
      email: lead.email,
      attributes: { FIRSTNAME: first, LASTNAME: rest.join(' '), COMPANY: lead.companyName, OPT_IN: lead.marketing, ...(lead.role ? { JOB_TITLE: lead.role } : {}) },
      listIds: [LIST_ID],
      updateEnabled: true,
    });

    const rows = [['Name', lead.fullName], ['Email', lead.email], ['WhatsApp', lead.whatsapp || '—'], ['Company or estate', lead.companyName], ['Role', lead.role || '—'], ['Looks after', lead.buildingType || '—'], ['Sites', lead.sitesCount || '—'], ['Most interested in', lead.primaryModule || '—'], ['Product updates', lead.marketing ? 'Yes, consented' : 'No']];
    try {
      await brevo('/smtp/email', {
        sender: SENDER,
        to: [{ email: NOTIFY_TO }],
        replyTo: { email: lead.email, name: lead.fullName },
        subject: `Early access: ${lead.fullName}, ${lead.companyName}`,
        htmlContent: `<p>New early access sign-up from kivo.africa.</p><table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${rows.map(([k, v]) => `<tr><td style="color:#526573">${k}</td><td><strong>${escapeHtml(v)}</strong></td></tr>`).join('')}</table><p style="color:#526573;font-size:12px">Added to the Brevo list “Website – early access”. Reply to this email to answer them directly.</p>`,
        textContent: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
      });
    } catch (error) {
      console.error('Lead saved, notification email failed:', error.message);
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Early access sign-up failed:', error.message);
    return res.status(502).json({ success: false, message: 'We couldn’t send that just now. Please try again, or WhatsApp us.' });
  }
};
