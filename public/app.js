'use strict';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
const naira = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Math.round(value));

/* ---------- Dialogs ---------- */
$$('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
}));
// Keep keyboard focus cycling inside the dialog, including in embedded browsers.
$$('dialog').forEach(dialog => dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = Array.from(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(element => element.getClientRects().length > 0);
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
}));

function setupTabKeyboard(selector, onSelect, vertical = false) {
  const buttons = $$(selector);
  buttons.forEach(button => button.addEventListener('keydown', event => {
    const prev = vertical ? 'ArrowUp' : 'ArrowLeft';
    const next = vertical ? 'ArrowDown' : 'ArrowRight';
    if (![prev, next, 'Home', 'End', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const index = buttons.indexOf(button);
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + ([prev, 'ArrowLeft'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
    onSelect(buttons[target]);
    buttons[target].focus();
  }));
}

/* ---------- Navigation ---------- */
const menu = $('.menu-button');
function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open navigation'); $('#nav-links').classList.remove('is-open'); }
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  menu.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
  $('#nav-links').classList.toggle('is-open', !open);
});
$$('#nav-links a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
document.addEventListener('click', event => { if (!event.target.closest('.nav')) closeMenu(); });
document.addEventListener('click', event => {
  if (!event.target.closest('[data-join]')) return;
  closeMenu();
  if (window.openJoin) window.openJoin(($('#capture-email') && $('#capture-email').value.trim()) || '');
  else $('#join-dialog').showModal();
});
if (new URLSearchParams(window.location.search).get('join') === '1') window.addEventListener('load', () => (window.openJoin ? window.openJoin() : $('#join-dialog').showModal()));

if (document.getElementById('price-panel')) {
/* ---------- Pricing ---------- */
// Agreed price list, 23 November 2026. Monthly rates in naira, before VAT.
const FOUNDING = { label: 'As a founding member', detail: '20% off your first 6 months · sign by 31 March 2027', factor: 0.8 };
const PILOT = { label: '60-day pilot', detail: 'Half price for 60 days, credited to your first annual invoice', factor: 0.5 };
const plans = {
  business: {
    context: 'For offices, schools, hospitals and single-site businesses with an in-house team.',
    rate: 15000, unit: 'paid user', plural: 'paid users', minimum: 75000, quantity: 8,
    question: 'How many technicians, storekeepers and admins use Kivo?',
    features: ['Staff report issues free, with photos and offline', 'Technician app with parts from the store', 'Contractor links, LPOs, waybills and bill matching', 'Approvals, budgets and live reports'],
    offer: FOUNDING,
  },
  estates: {
    context: 'For gated estates, residential developers and multi-unit blocks.',
    rate: 2000, unit: 'unit', plural: 'units', minimum: 100000, quantity: 150,
    question: 'How many units do you manage?',
    features: ['Residents report and track issues free', 'Your team and any number of staff', 'Contractors, diesel and generator logs', 'Service charge items on client bills'],
    offer: FOUNDING,
  },
  hotels: {
    context: 'For hotels and serviced apartments. Housekeeping and engineering staff are included.',
    rate: 1500, unit: 'room', plural: 'rooms', minimum: 150000, quantity: 120,
    question: 'How many rooms does the property have?',
    features: ['Any number of staff, no seat counting', 'Room and area faults logged in seconds', 'Stores, diesel and contractor jobs', 'Asset service history for every room'],
    offer: FOUNDING,
  },
  multisite: {
    context: 'For banks, telecoms, fuel stations and retail chains. Every branch manager, custodian and contractor is included.',
    tiers: [[50, 25000], [200, 18000], [Infinity, 12000]], unit: 'site', plural: 'sites', minQuantity: 10, quantity: 40,
    question: 'How many branches or sites?',
    features: ['Unlimited users at every site', 'Branch, region and head-office views', 'One contractor and supplier list across sites', 'Bill matching and audit trail for procurement'],
    offer: PILOT, setup: true,
  },
  fm: {
    context: 'For facility management companies. Your clients get their own portal free.',
    tiers: [[25, 15000], [100, 12000], [Infinity, 9000]], unit: 'technician', plural: 'technicians', minimum: 250000, quantity: 30,
    question: 'How many technicians do you field?',
    features: ['Free client portals with a live job record', 'Your markup per client, fixed-fee workmanship', 'Client bills with VAT and withholding tax', 'Contractors and suppliers across every client'],
    offer: PILOT, setup: true,
  },
  city: {
    context: 'For master-planned developments with homes, office towers and shared infrastructure.',
    custom: true, minimum: 1500000,
    features: ['Homes, towers and common areas in one workspace', 'Resident and tenant portals', 'Utilities, diesel and estate-wide contractors', 'Dedicated onboarding team'],
    setup: true,
  },
};
let currentPlan = 'business';
let billingPeriod = 'monthly';
const ordinal = (n) => n === Infinity ? 'and above' : `up to ${n}`;

function tieredTotal(plan, quantity) {
  if (!plan.tiers) return quantity * plan.rate;
  let remaining = quantity, from = 0, total = 0;
  for (const [upTo, rate] of plan.tiers) {
    const inTier = Math.min(remaining, upTo - from);
    if (inTier <= 0) break;
    total += inTier * rate; remaining -= inTier; from = upTo;
  }
  return total;
}
function monthlyCharge(plan, quantity) {
  const billedQuantity = plan.minQuantity ? Math.max(quantity, plan.minQuantity) : quantity;
  const usage = tieredTotal(plan, billedQuantity);
  const minimum = plan.minimum || 0;
  return { total: Math.max(usage, minimum), minimumApplied: usage < minimum || (plan.minQuantity && quantity < plan.minQuantity) };
}

function renderPlan() {
  const plan = plans[currentPlan];
  const yearly = billingPeriod === 'annual';
  $$('[data-plan]').forEach(button => {
    const selected = button.dataset.plan === currentPlan;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  $('#price-panel').setAttribute('aria-labelledby', `price-${currentPlan}`);
  $('#price-context').textContent = plan.context;
  $('#price-features').innerHTML = plan.features.map(feature => `<li>${feature}</li>`).join('');

  const tiers = $('#price-tiers');
  if (plan.custom) {
    $('#price-from').textContent = 'CUSTOM PRICING · FROM';
    $('#unit-price').textContent = naira(plan.minimum);
    $('#price-unit').textContent = ' / month';
    tiers.hidden = true;
    $('#price-minimum').textContent = 'Priced on homes, buildings and a platform fee for the shared estate.';
  } else {
    const firstRate = plan.tiers ? plan.tiers[0][1] : plan.rate;
    const shown = yearly ? firstRate * 10 : firstRate;
    $('#price-from').textContent = 'FROM';
    $('#unit-price').textContent = naira(shown);
    $('#price-unit').textContent = ` / ${plan.unit} / ${yearly ? 'year' : 'month'}`;
    tiers.hidden = !plan.tiers;
    if (plan.tiers) {
      let from = 1;
      tiers.innerHTML = plan.tiers.map(([upTo, rate]) => {
        const label = upTo === Infinity ? `Above ${from - 1}` : `${from}–${upTo}`;
        from = upTo + 1;
        return `<li><span>${label} ${plan.plural}</span><strong>${naira(rate)} a month</strong></li>`;
      }).join('');
    }
    const minimumText = plan.minQuantity ? `Minimum ${plan.minQuantity} ${plan.plural}` : `Minimum ${naira(plan.minimum)} a month`;
    $('#price-minimum').textContent = yearly ? `${minimumText}. Yearly: 12 months for the price of 10.` : minimumText;
  }

  $('#estimate-title').textContent = plan.custom ? 'How City pricing works' : 'Estimate your costs';
  $('#estimate-body').hidden = Boolean(plan.custom);
  $('#city-body').hidden = !plan.custom;
  $('#estimate-note').textContent = plan.setup
    ? 'Before VAT at 7.5%. Includes a one-off setup fee of ₦500,000 to ₦5,000,000 for data import, training and site visits, quoted after a site survey.'
    : 'Before VAT at 7.5%. Corporate clients can deduct 5% withholding tax; send us the credit note.';
  if (!plan.custom) {
    $('#quantity-label').textContent = plan.question;
    $('#quantity-unit').textContent = plan.plural;
  }
  for (const button of $$('[data-billing]')) button.setAttribute('aria-pressed', String(button.dataset.billing === billingPeriod));
  updateEstimate();
}

function updateEstimate() {
  const plan = plans[currentPlan];
  if (plan.custom) return;
  const input = $('#quantity');
  const value = Number(input.value);
  const valid = input.value !== '' && Number.isInteger(value) && value >= 1 && value <= 10000;
  input.setAttribute('aria-invalid', String(!valid));
  $('#decrease').disabled = valid && value === 1;
  $('#increase').disabled = valid && value === 10000;
  if (!valid) {
    $('#quantity-help').textContent = 'Please enter a whole number between 1 and 10,000.';
    $('#base-total').textContent = '—'; $('#discount-total').textContent = '—';
    return;
  }
  const { total, minimumApplied } = monthlyCharge(plan, value);
  const yearly = billingPeriod === 'annual';
  $('#quantity-help').textContent = minimumApplied
    ? `Below the plan minimum, so the minimum applies.`
    : 'Enter 1–10,000. Larger portfolio? Talk to us.';
  $('#estimate-period').innerHTML = yearly
    ? `Yearly, before VAT<small>Works out to ${naira(total * 10 / 12)} a month</small>`
    : 'Monthly, before VAT';
  $('#base-total').textContent = naira(yearly ? total * 10 : total);
  const offer = plan.offer;
  $('#offer-line').hidden = !offer;
  if (offer) {
    $('#offer-label').firstChild.textContent = offer.label;
    $('#offer-detail').textContent = offer.detail;
    $('#discount-total').innerHTML = `${naira(total * offer.factor)}<span>/mo</span>`;
  }
}

function changePlan(planKey) {
  currentPlan = planKey;
  const plan = plans[planKey];
  if (!plan.custom) $('#quantity').value = plan.quantity;
  renderPlan();
}
$$('[data-plan]').forEach(button => button.addEventListener('click', () => changePlan(button.dataset.plan)));
setupTabKeyboard('[data-plan]', button => changePlan(button.dataset.plan));
$$('[data-billing]').forEach(button => button.addEventListener('click', () => { billingPeriod = button.dataset.billing; renderPlan(); }));
$('#quantity').addEventListener('input', updateEstimate);
for (const [id, delta] of [['decrease', -1], ['increase', 1]]) {
  $(`#${id}`).addEventListener('click', () => {
    const value = Number($('#quantity').value);
    $('#quantity').value = Math.min(10000, Math.max(1, (Number.isFinite(value) ? Math.trunc(value) : 1) + delta));
    updateEstimate();
  });
}
changePlan('business');

}

if (document.getElementById('product-panel')) {
/* ---------- Product tour: one job at Meridian Bank ---------- */
// Figures: parts at cost ₦16,600, 15% markup for this client, fixed-fee workmanship ₦15,000.
const tourState = { assigned: false, confirmed: false, fixed: false };
const steps = [
  {
    phase: 'Report', title: 'Sockets sparking, staff canteen',
    caption: 'Kemi reports the fault from her phone with a photo. Reporting is free for staff.',
    rows: [['Request', 'WT-0152'], ['Location', 'Head Office › Floor 1 › Canteen'], ['Reported by', 'Kemi Adeyemi · 10:41'], ['Photos', '1'], ['Seen by', 'Ada Okafor, facility manager · 10:45']],
    note: 'Kemi sees a double tick when the facility team has opened her request. No more “did anyone see my message?”',
  },
  {
    phase: 'Assign', title: 'Send it to the right person',
    caption: 'Ada assigns the job to Tunde from Northgate’s own team. A contractor would get it by email instead, no app needed.',
    rows: () => [['Priority', 'High · due today, 17:00'], ['Asset', 'Canteen power ring'], ['Assigned to', tourState.assigned ? 'Tunde Bello, electrician · 10:48' : 'Not assigned yet'], ['Kemi sees', tourState.assigned ? 'Assigned to Tunde Bello' : 'Seen by facility team']],
    note: 'Urgent contractor jobs can also be sent on WhatsApp in one tap.',
    action: () => tourState.assigned ? null : { key: 'assigned', label: 'Assign to Tunde' },
  },
  {
    phase: 'Fix', title: 'Fix it, with parts from the store',
    caption: 'Tunde takes the parts out of the Head Office store against the job and adds photos of the finished work.',
    rows: [['13 A double socket', '2 · from Head Office store'], ['2.5 mm cable', '3 metres'], ['Photos', '2 before, 2 after'], ['Store left', '2 sockets · below reorder level']],
    note: 'Stock comes off the moment the update is sent. Low stock is flagged to the storekeeper.',
  },
  {
    phase: 'Confirm', title: 'Done, confirmed and rated',
    caption: 'Ada confirms the job is done. Kemi gets a prompt to rate it.',
    rows: () => [['Status', tourState.confirmed ? 'Done · confirmed by Ada 12:05' : 'Awaiting confirmation'], ['Kemi’s rating', tourState.confirmed ? '4 of 5 · “Fixed before lunch.”' : 'Waiting for Done'], ['Time to fix', '1 h 24 min']],
    note: 'Ratings feed each technician’s and contractor’s scorecard.',
    action: () => tourState.confirmed ? null : { key: 'confirmed', label: 'Confirm done' },
  },
  {
    phase: 'Restock', title: 'LPO and waybill',
    caption: 'The store reorders 20 sockets. The waybill shows only 16 arrived.',
    rows: [['LPO', 'LPO-000415 · Adebola Electricals'], ['Ordered', '20 × 13 A double socket at ₦6,500'], ['Waybill', 'WB-000093 · received by the storekeeper'], ['Received', '16']],
    note: 'Short delivery flagged · 4 sockets still due.',
    warning: { ordered: 20, received: 16, unit: 'sockets' },
  },
  {
    phase: 'Pay', title: 'Supplier bill check',
    caption: 'Adebola bills for all 20. Kivo checks the bill against the LPO and the waybill.',
    rows: () => [['Billed', tourState.fixed ? `${naira(104000)} · corrected bill` : `${naira(130000)} for 20 sockets`], ['Arrived', `16 sockets · ${naira(104000)}`], ['Result', tourState.fixed ? 'Matches the LPO and waybill · ready to pay' : 'Doesn’t match · can’t be paid']],
    note: 'A bill must match exactly before anyone can pay it. No overrides, for compliance.',
    warnRows: () => !tourState.fixed,
    action: () => tourState.fixed ? null : { key: 'fixed', label: 'Ask Adebola to fix the bill' },
  },
  {
    phase: 'Bill', title: 'Bill Meridian Bank for the job',
    caption: 'The client bill builds itself from the job, with Meridian Bank’s markup on parts and a fixed workmanship fee.',
    rows: [['Parts at cost', naira(16600)], ['Parts with 15% markup', naira(19090)], ['Workmanship, fixed fee', naira(15000)], ['Subtotal', naira(34090)], ['VAT 7.5%', naira(2557)], ['Total to Meridian Bank', naira(36647)], ['You make', naira(17490)]],
    note: 'If the bank deducts 5% withholding tax, the bill is still marked paid and Kivo tracks the credit note.',
    end: true,
  },
];

let activeStep = 0;
const stepTabs = $$('[data-step]');
const panel = $('#product-panel');
const nextButton = $('#journey-next');
const backButton = $('#journey-back');
const narrowTour = window.matchMedia('(max-width: 620px)');
const tourTabs = $('.journey-tabs');
function updateTourOrientation() { tourTabs.setAttribute('aria-orientation', narrowTour.matches ? 'horizontal' : 'vertical'); }
narrowTour.addEventListener('change', updateTourOrientation);
updateTourOrientation();

function renderJourney() {
  const step = steps[activeStep];
  const rows = typeof step.rows === 'function' ? step.rows() : step.rows;
  const action = step.action ? step.action() : null;
  const warnRows = step.warnRows ? step.warnRows() : false;
  const visual = step.warning
    ? `<div class="delivery-visual" aria-hidden="true"><div><strong>${step.warning.ordered}</strong>Ordered</div><div><strong>${step.warning.received}</strong>Received</div><div><strong>${step.warning.ordered - step.warning.received}</strong>Still due</div></div>`
    : '';
  panel.innerHTML = `
    <p class="eyebrow">${step.phase} / Meridian Bank · WT-0152</p>
    <h3>${step.title}</h3>
    <p class="journey-caption">${step.caption}</p>
    ${visual}
    <dl class="journey-records${step.end ? ' bill-records' : ''}${warnRows ? ' records-warning' : ''}">
      ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
    </dl>
    <p class="journey-note${step.warning || warnRows ? ' journey-warning' : ''}">${step.note}</p>
    ${action ? `<button class="journey-button journey-next" data-tour-action="${action.key}">${action.label} </button>` : ''}
    ${step.end ? '<div class="journey-end"><strong>Want this for your buildings?</strong><a class="button button-light" href="https://zoho183.zohobookings.eu/273883000000035071" target="_blank" rel="noopener noreferrer">Book a demo </a></div>' : ''}
  `;
  panel.setAttribute('aria-labelledby', stepTabs[activeStep].id);
  for (const [index, tab] of stepTabs.entries()) {
    tab.setAttribute('aria-selected', String(index === activeStep));
    tab.tabIndex = index === activeStep ? 0 : -1;
  }
  backButton.disabled = activeStep === 0;
  nextButton.disabled = activeStep === steps.length - 1;
  $('#journey-progress').textContent = `Step ${activeStep + 1} of ${steps.length}: ${stepTabs[activeStep].querySelector('.journey-tab-label').textContent}`;
}

function goToStep(index, focusPanel = false) {
  activeStep = Math.max(0, Math.min(index, steps.length - 1));
  renderJourney();
  if (focusPanel) {
    panel.focus({ preventScroll: true });
    if (narrowTour.matches) panel.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

for (const tab of stepTabs) tab.addEventListener('click', () => goToStep(Number(tab.dataset.step)));
setupTabKeyboard('[data-step]', tab => goToStep(Number(tab.dataset.step)), true);
nextButton.addEventListener('click', () => goToStep(activeStep + 1, true));
backButton.addEventListener('click', () => goToStep(activeStep - 1, true));
$('#reset-demo').addEventListener('click', () => {
  tourState.assigned = false; tourState.confirmed = false; tourState.fixed = false;
  goToStep(0, true);
});
panel.addEventListener('click', event => {
  const button = event.target.closest('[data-tour-action]');
  if (!button) return;
  tourState[button.dataset.tourAction] = true;
  renderJourney();
  panel.focus({ preventScroll: true });
});

let touchStart;
panel.addEventListener('touchstart', event => { if (event.touches.length === 1) touchStart = [event.touches[0].clientX, event.touches[0].clientY]; }, { passive: true });
panel.addEventListener('touchcancel', () => { touchStart = undefined; });
panel.addEventListener('touchend', event => {
  const origin = touchStart; touchStart = undefined;
  if (!origin || !narrowTour.matches) return;
  const dx = event.changedTouches[0].clientX - origin[0];
  const dy = event.changedTouches[0].clientY - origin[1];
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) goToStep(activeStep + (dx < 0 ? 1 : -1));
});
renderJourney();

for (const link of $$('[data-tour-jump]')) {
  link.addEventListener('click', () => { goToStep(Number(link.dataset.tourJump)); panel.focus({ preventScroll: true }); });
}


}

/* ---------- Early access: hero capture + two-step form → /api/early-access ---------- */
const LEADS_ENDPOINT = '/api/early-access';
const joinDialog = $('#join-dialog');
const joinForm = $('#join-form');
if (joinForm && joinDialog) {
  const steps = $$('.join-step', joinForm);
  const errorBox = $('#join-error');
  const submit = $('#join-submit');
  const back = $('#join-back');
  const progress = $('#join-progress');
  const fill = $('#join-progress-fill');
  const labels = ['About you', 'Your buildings'];
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  let step = 1;

  const showError = (message, field) => {
    errorBox.textContent = message; errorBox.hidden = !message;
    if (field) field.focus();
  };
  const setStep = (next) => {
    step = next;
    steps.forEach(fieldset => { fieldset.hidden = Number(fieldset.dataset.step) !== step; });
    progress.textContent = `Step ${step} of 2 · ${labels[step - 1]}`;
    fill.style.width = step === 1 ? '50%' : '100%';
    back.hidden = step === 1;
    submit.textContent = step === 1 ? 'Continue' : 'Join early access';
    showError('');
  };
  const validateStep = () => {
    if (step === 1) {
      const email = $('#lead-email'), name = $('#lead-name'), company = $('#lead-company');
      const checks = [[email, EMAIL.test(email.value.trim()), 'Please enter a valid work email.'], [name, name.value.trim().length > 1, 'Please add your full name.'], [company, company.value.trim().length > 1, 'Please add your company or estate.']];
      for (const [input, ok] of checks) input.setAttribute('aria-invalid', String(!ok));
      const failed = checks.find(([, ok]) => !ok);
      if (failed) { showError(failed[2], failed[0]); return false; }
      return true;
    }
    if (!joinForm.querySelector('input[name="buildingType"]:checked')) { showError('Tell us what you look after.', joinForm.querySelector('input[name="buildingType"]')); return false; }
    if (!joinForm.querySelector('input[name="sitesCount"]:checked')) { showError('Pick roughly how many sites.', joinForm.querySelector('input[name="sitesCount"]')); return false; }
    return true;
  };
  const resetDialog = () => {
    if (!$('#join-done').hidden) { joinForm.reset(); $('#join-done').hidden = true; $('#join-form-view').hidden = false; }
    setStep(1);
  };
  window.openJoin = (email = '') => {
    resetDialog();
    if (email) $('#lead-email').value = email;
    if (!joinDialog.open) joinDialog.showModal();
    (email ? $('#lead-name') : $('#lead-email')).focus();
  };

  back.addEventListener('click', () => { setStep(1); $('#lead-name').focus(); });
  joinForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!validateStep()) return;
    if (step === 1) { setStep(2); joinForm.querySelector('input[name="buildingType"]').focus(); return; }
    const formData = new FormData(joinForm);
    const data = {
      email: String(formData.get('email') || '').trim(),
      fullName: String(formData.get('fullName') || '').trim(),
      companyName: String(formData.get('companyName') || '').trim(),
      role: String(formData.get('role') || ''),
      buildingType: String(formData.get('buildingType') || ''),
      sitesCount: String(formData.get('sitesCount') || ''),
      primaryModule: formData.getAll('interests').join(', ') || 'Full facility platform',
      whatsapp: String(formData.get('whatsapp') || '').trim(),
      website: String(formData.get('website') || ''),
      marketing: formData.get('marketing') === 'yes',
    };
    submit.disabled = true; back.disabled = true; submit.setAttribute('aria-busy', 'true'); submit.textContent = 'Sending…';
    try {
      const response = await fetch(LEADS_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || 'We couldn’t send that just now. Please try again, or WhatsApp us.');
      $('#join-done-name').textContent = data.fullName.split(/\s+/)[0];
      $('#join-form-view').hidden = true;
      $('#join-done').hidden = false;
      $('#join-done').focus();
    } catch (error) {
      const offline = error instanceof TypeError;
      showError(offline || !error.message ? 'We couldn’t reach Kivo just now. Check your connection and try again, or WhatsApp us.' : error.message);
      submit.textContent = 'Join early access';
    } finally {
      submit.disabled = false; back.disabled = false; submit.removeAttribute('aria-busy');
    }
  });
  joinDialog.addEventListener('close', () => { if (!$('#join-done').hidden) resetDialog(); });

  const capture = $('#hero-capture');
  if (capture) capture.addEventListener('submit', event => {
    event.preventDefault();
    window.openJoin($('#capture-email').value.trim());
  });
  setStep(1);
}
