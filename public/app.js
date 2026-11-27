'use strict';

let currentPlan = 'estates';
let billingPeriod = 'monthly';
const $=(selector)=>document.querySelector(selector);
const $$=(selector)=>Array.from(document.querySelectorAll(selector));
const naira=(value)=>new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(value);
$$('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}}));
// Keep keyboard focus cycling inside the dialog, including in embedded browsers.
$$('dialog').forEach(dialog=>dialog.addEventListener('keydown',event=>{
  if(event.key!=='Tab')return;
  const focusable=Array.from(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(element=>element.getClientRects().length>0);
  const first=focusable[0],last=focusable[focusable.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
}));

function setupTabKeyboard(selector,onSelect,vertical=false){
  const buttons=$$(selector);
  buttons.forEach(button=>button.addEventListener('keydown',event=>{
    const prev=vertical?'ArrowUp':'ArrowLeft';const next=vertical?'ArrowDown':'ArrowRight';
    if(![prev,next,'Home','End','ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();const index=buttons.indexOf(button);
    const target=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+([prev,'ArrowLeft'].includes(event.key)?-1:1)+buttons.length)%buttons.length;
    onSelect(buttons[target]);buttons[target].focus();
  }));
}
const planData={
  estates:{rate:2000,unit:'unit',plural:'units',defaultQuantity:40,context:'For estates, gated communities and multi-unit developments.',question:'How many units do you manage?',features:['Residents report and track issues free','Ticket dispatch and work orders','Contractor directory and site hierarchy','Branded purchase orders and service billing']},
  business:{rate:15000,unit:'user',plural:'users',defaultQuantity:5,context:'For developers, contractors, facilities firms, offices, hotels, hospitals and schools.',question:'How many people manage the work?',features:['Staff and occupants report issues free','Full asset register and service histories','Contractors, purchase orders and invoices','Role-based permissions and audit trail']},
};
function updateEstimate(){
  const value=Number($('#quantity').value);
  const valid=$('#quantity').value!==''&&Number.isInteger(value)&&value>=1&&value<=10000;
  $('#quantity').setAttribute('aria-invalid',String(!valid));
  $('#quantity-help').textContent=valid?'Enter 1–10,000 to estimate. Larger portfolio? Talk to us.':'Please enter a whole number between 1 and 10,000.';
  if(!valid){$('#base-total').textContent='—';$('#discount-total').textContent='—';return;}
  const total=value*planData[currentPlan].rate;
  $('#base-total').textContent=naira(total * (billingPeriod === 'annual' ? 12 : 1));
  $('#discount-total').innerHTML=`${naira(total*.8)}<span>/mo</span>`;
  $('#decrease').disabled=value===1;$('#increase').disabled=value===10000;
}
function changePlan(plan){
  currentPlan=plan;const data=planData[plan];
  $$('[data-plan]').forEach(button=>{const selected=button.dataset.plan===plan;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;});
  $('#price-panel').setAttribute('aria-labelledby',plan==='estates'?'price-estates':'price-business');
  $('#price-context').textContent=data.context;
  $('#price-features').innerHTML=data.features.map(feature=>`<li>${feature}</li>`).join('');
  $('#quantity-label').textContent=data.question;$('#quantity-unit').textContent=data.plural;$('#quantity').value=data.defaultQuantity;updateBilling();
}
$$('[data-plan]').forEach(button=>button.addEventListener('click',()=>changePlan(button.dataset.plan)));
setupTabKeyboard('[data-plan]',button=>changePlan(button.dataset.plan));
$('#quantity').addEventListener('input',updateEstimate);
for(const [id,delta] of [['decrease',-1],['increase',1]])$(`#${id}`).addEventListener('click',()=>{const value=Number($('#quantity').value);$('#quantity').value=Math.min(10000,Math.max(1,(Number.isFinite(value)?Math.trunc(value):1)+delta));updateEstimate();});

const menu=$('.menu-button');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');$('#nav-links').classList.remove('is-open');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-label',open?'Open navigation':'Close navigation');$('#nav-links').classList.toggle('is-open',!open);});
$$('#nav-links a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
document.addEventListener('click',event=>{if(!event.target.closest('.nav'))closeMenu();});
document.addEventListener('click', event => {
  if (!event.target.closest('[data-join]')) return;
  closeMenu();
  $('#join-dialog').showModal();
});
if (new URLSearchParams(window.location.search).get('join') === '1') {
  $('#join-dialog').showModal();
}
updateEstimate();

function updateBilling() {
  const plan = planData[currentPlan];
  const annual = billingPeriod === 'annual';
  $('#unit-price').textContent = naira(plan.rate * (annual ? 12 : 1));
  $('#price-unit').textContent = ` / ${plan.unit} / ${annual ? 'year' : 'month'}`;
  $('#monthly-equivalent').hidden = !annual;
  $('#monthly-equivalent').textContent = `Equivalent to ${naira(plan.rate)} per ${plan.unit} per month. Annual pricing is 12 monthly payments combined.`;
  $('#estimate-period').textContent = `Expected ${annual ? 'annual' : 'monthly'} total, from`;
  for (const button of $$('[data-billing]')) {
    button.setAttribute('aria-pressed', String(button.dataset.billing === billingPeriod));
  }
  updateEstimate();
}

for (const button of $$('[data-billing]')) {
  button.addEventListener('click', () => {
    billingPeriod = button.dataset.billing;
    updateBilling();
  });
}

const palmviewSteps = [
  {
    phase: 'Build', title: 'Project budget', caption: 'See where the money is going across the 12-home project.',
    rows: [['Project budget', naira(480000000)], ['Spent to date', naira(186400000)], ['Budget remaining', naira(293600000)]],
    note: 'Palmview Terrace · 12 terrace homes · Lekki, Lagos',
    meter: true,
  },
  {
    phase: 'Build', title: 'Purchase order PO-2041', caption: 'Raise a purchase order for the cement needed on site.',
    rows: [['Supplier', 'Redline Materials'], ['Portland cement', '500 bags'], ['Unit price', naira(9600)], ['Order subtotal', naira(4800000)]],
    note: 'Issued · Delivery to Palmview Terrace',
  },
  {
    phase: 'Build', title: 'Goods received', caption: 'Spot the 80-bag shortfall before approving the invoice.',
    rows: [['Purchase order', 'PO-2041'], ['Ordered', '500 bags'], ['Received on site', '420 bags'], ['Outstanding', '80 bags']],
    note: 'Short delivery flagged · 80 bags still due', warning: true,
  },
  {
    phase: 'Build', title: 'Stock and supplier invoice', caption: 'Update stock and match the invoice to what actually arrived.',
    rows: [['Stock received', '+420 bags'], ['Original order subtotal', naira(4800000)], ['Matched invoice subtotal', naira(4032000)], ['Value awaiting delivery', naira(768000)]],
    note: 'Illustrative subtotals before applicable tax and withholding.',
  },
  {
    phase: 'Hand over', title: '60 kVA standby generator', caption: 'Give the facility team the equipment record at handover.',
    rows: [['Asset ID', 'AS-0060'], ['Location', 'Block C · Generator room'], ['Supplier', 'Haven Power Supplies'], ['Installer', 'Terrace Electromech'], ['Purchased', '14 February 2027'], ['Warranty through', '14 February 2030']],
    note: 'Added to the asset register · Palmview Terrace',
  },
  {
    phase: 'Run · Two years later', title: 'Generator not starting, Block C', caption: 'Open a work ticket and use the asset record to find the installer.',
    rows: [['Ticket ID', 'TK-1042'], ['Priority', 'High'], ['Linked asset', 'AS-0060 · 60 kVA standby generator'], ['Reported', '18 February 2029 · 08:42 WAT'], ['Warranty', 'Active through 14 February 2030']],
    note: 'The installer is available in the sample asset history.',
    action: 'assign',
  },
  {
    phase: 'Run', title: 'Repair history', caption: 'Keep the purchase, handover and repair history together.',
    rows: [['14 February 2027', 'Generator purchased from Haven Power Supplies'], ['28 February 2027', 'Installed by Terrace Electromech and handed over'], ['18 February 2029', 'Generator fault reported under warranty']],
    note: 'The repair stays linked to asset AS-0060 and ticket TK-1042.',
    action: 'complete',
  },
];

let activeStep = 0;
let assigned = false;
let completed = false;
const stepTabs = $$('[data-step]');
const panel = $('#product-panel');
const nextButton = $('#journey-next');
const backButton = $('#journey-back');
const narrowTour = window.matchMedia('(max-width: 620px)');
const tourTabs = $('.journey-tabs');
function updateTourOrientation() {
  tourTabs.setAttribute('aria-orientation', narrowTour.matches ? 'horizontal' : 'vertical');
}
narrowTour.addEventListener('change', updateTourOrientation);
updateTourOrientation();

function renderJourney() {
  const step = palmviewSteps[activeStep];
  const ticketState = completed ? 'Done' : assigned ? 'Ongoing · Terrace Electromech' : 'Open';
  const rows = [...step.rows];
  if (step.action === 'complete' && completed) {
    rows.push(['Repair recorded', 'Starter relay replaced under warranty']);
  }
  if (step.action) rows.push(['Ticket status', ticketState]);
  const action = step.action === 'assign' && !assigned
    ? '<button class="journey-button journey-next" data-tour-action="assign">Assign installer </button>'
    : step.action === 'complete' && !completed
      ? '<button class="journey-button journey-next" data-tour-action="complete">Log repair and mark done </button>'
      : '';
  panel.innerHTML = `
    <p class="eyebrow">${step.phase} / Palmview Terrace</p>
    <h3>${step.title}</h3>
    <p class="journey-caption">${step.caption}</p>
    ${step.warning ? '<div class="delivery-visual" aria-hidden="true"><div><strong>500</strong>Ordered</div><div><strong>420</strong>Received</div><div><strong>80</strong>Still due</div></div>' : ''}
    <dl class="journey-records${step.meter ? ' budget-stats' : ''}">
      ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}
    </dl>
    ${step.meter ? '<div class="budget-visual"><div><span>Budget allocation</span><strong>39% used</strong></div><div class="budget-track" aria-hidden="true"><span></span><span></span></div><p><strong>₦293.6m</strong> available for the work ahead.</p></div>' : ''}
    <p class="journey-note${step.warning ? ' journey-warning' : ''}">${step.note}</p>
    ${action}
    ${activeStep === 6 ? '<div class="journey-end"><strong>Want this for your sites?</strong><button class="button button-light" data-join>Join early access </button></div>' : ''}
  `;
  panel.setAttribute('aria-labelledby', stepTabs[activeStep].id);
  for (const [index, tab] of stepTabs.entries()) {
    tab.setAttribute('aria-selected', String(index === activeStep));
    tab.tabIndex = index === activeStep ? 0 : -1;
  }
  backButton.disabled = activeStep === 0;
  nextButton.disabled = activeStep === palmviewSteps.length - 1;
  $('#journey-progress').textContent = `Step ${activeStep + 1} of ${palmviewSteps.length}: ${stepTabs[activeStep].querySelector('.journey-tab-label').textContent}`;
}

function goToStep(index, focusPanel = false) {
  activeStep = Math.max(0, Math.min(index, palmviewSteps.length - 1));
  renderJourney();
  if (focusPanel) {
    panel.focus({ preventScroll: true });
    if (narrowTour.matches) panel.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}

for (const tab of stepTabs) {
  tab.addEventListener('click', () => goToStep(Number(tab.dataset.step)));
}
setupTabKeyboard('[data-step]', tab => goToStep(Number(tab.dataset.step)), true);
nextButton.addEventListener('click', () => goToStep(activeStep + 1, true));
backButton.addEventListener('click', () => goToStep(activeStep - 1, true));
$('#reset-demo').addEventListener('click', () => {
  assigned = false;
  completed = false;
  goToStep(0, true);
});

panel.addEventListener('click', event => {
  const button = event.target.closest('[data-tour-action]');
  if (!button) return;
  assigned = true;
  if (button.dataset.tourAction === 'complete') completed = true;
  renderJourney();
  panel.focus({ preventScroll: true });
});

let touchStart;
panel.addEventListener('touchstart', event => {
  if (event.touches.length === 1) {
    touchStart = [event.touches[0].clientX, event.touches[0].clientY];
  }
}, { passive: true });
panel.addEventListener('touchcancel', () => { touchStart = undefined; });
panel.addEventListener('touchend', event => {
  const origin = touchStart;
  touchStart = undefined;
  if (!origin || !narrowTour.matches) return;
  const [startX, startY] = origin;
  const dx = event.changedTouches[0].clientX - startX;
  const dy = event.changedTouches[0].clientY - startY;
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    goToStep(activeStep + (dx < 0 ? 1 : -1));
  }
});

renderJourney();


for (const link of $$('[data-tour-jump]')) {
  link.addEventListener('click', () => {
    goToStep(Number(link.dataset.tourJump));
    panel.focus({ preventScroll: true });
  });
}
