'use strict';

const NEWS = [
  {
    id: 'launch', type: 'company', title: 'Kivo launches on 1 January 2027',
    summary: 'Early access is open for teams building and running properties across Nigeria.',
    body: [
      'Kivo is scheduled to launch on 1 January 2027. The platform brings budgets, orders, deliveries and asset records together so the people building a property can hand over a record the facilities team can use.',
      'Early access is open to Nigerian developers, contractors and property operators. Joining gives you a chance to speak directly with the team as Kivo rolls out.',
    ],
  },
  {
    id: 'founding', type: 'company', title: 'Early access is open: founding members save 20%',
    summary: 'Founding members receive a discount for the first six months and help moving their records over from Excel.',
    body: [
      'Founding members save 20% for their first six months when Kivo launches. There is no charge to join the early access list.',
      'If you keep site, asset and contractor details in spreadsheets, Kivo will help import them for free. You can reach the founders on WhatsApp and share what your team needs.',
    ],
  },
  {
    id: 'lagos-pilot', type: 'company', title: 'Piloting with facility teams across Lagos',
    summary: 'Facility teams are helping Kivo test how building records fit into their everyday work.',
    body: [
      'Kivo is piloting with facility teams across Lagos. The team is learning how site staff capture deliveries, how contractors receive maintenance jobs and what records go missing at handover.',
      'If your team manages sites, suppliers or maintenance across several properties, join early access to tell Kivo how you work.',
    ],
  },
  {
    id: 'accounting', type: 'product', title: 'Accounting integrations are on the 2027 roadmap',
    summary: 'Kivo plans integrations with Xero, QuickBooks, Sage and Microsoft Dynamics.',
    body: [
      'Kivo plans to connect to Xero, QuickBooks, Sage and Microsoft Dynamics in future releases. These integrations are on the roadmap for 2027.',
      'Early access gives finance and site teams a chance to show Kivo where data currently gets re-entered, including purchases, deliveries and supplier invoices.',
    ],
  },
  {
    id: 'building-record', type: 'product', title: 'Moving from Excel and WhatsApp to one building record',
    summary: 'Bring site records together so the next person can see what was ordered, delivered, installed and repaired.',
    body: [
      'A spreadsheet can hold a budget and a WhatsApp message can confirm a delivery. When they sit apart, it takes extra work to match a delivery to a purchase order or answer a supplier’s invoice query.',
      'Kivo keeps those records with the building. At handover, the facilities team can see which equipment was installed, who supplied it and whether it is still under warranty. Try the Palmview Terrace tour from the homepage to see how that works.',
    ],
  },
  {
    type: 'press', date: '2026-11-05', source: 'TechCabal', title: 'One app for construction and maintenance',
    summary: 'TechCabal on Kivo’s plan to follow a building from the construction site to the maintenance ticket.',
    url: 'https://techcabal.com/2026/11/05/lagos-startup-kivo-wants-one-app-to-follow-a-building-from-the-construction-site-to-the-maintenance-ticket/',
  },
  {
    type: 'press', date: '2026-11-05', source: 'TechCabal Press Room on X', title: 'TechCabal Press Room shares the Kivo story',
    summary: 'The press-release account shared TechCabal’s piece about Kivo.',
    url: 'https://x.com/techcabal_pr/status/2118257956802482284',
  },
  {
    type: 'press', date: '2026-11-05', source: 'Daily Trust', title: 'A Lagos firm tracks buildings from construction to maintenance',
    summary: 'Daily Trust reports on Kivo’s building operations platform.',
    url: 'https://dailytrust.com/lagos-firm-develops-app-to-track-buildings-from-construction-to-maintenance/',
  },
  {
    type: 'press', date: '2026-11-03', source: 'Techpoint Africa · Brand Press', title: 'Building management for construction and maintenance',
    summary: 'A sponsored Brand Press story on Kivo’s early access and its plans for building operations.',
    url: 'https://techpoint.africa/brandpress/lagos-startup-kivo-develops-all-in-one-building-management-app-for-construction-and-maintenance/',
  },
  {
    type: 'press', date: '2026-10-31', source: 'Daily News', title: 'Where did the cement go?',
    summary: 'Daily News covers the gaps between what a team orders, receives and pays for on site.',
    url: 'https://www.dailynews.com.ng/2026/10/where-did-cement-go-lagos-firm-develops.html',
  },
  {
    type: 'press', date: '2026-10-31', source: 'Technews', title: 'Tracking one building from site to service',
    summary: 'Technews on Kivo’s construction and facility management plans.',
    url: 'https://www.technews.com.ng/2026/10/lagos-startup-kivo-wants-one-app-to.html',
  },
  {
    type: 'press', date: '2026-10-31', source: 'Startup Insights', title: 'A platform for construction and facility operations',
    summary: 'Startup Insights introduces Kivo’s approach to managing building records.',
    url: 'https://www.startupinsights.com.ng/2026/10/kivo-launches-building-management.html',
  },
];

const categories = { all: 'All', company: 'Company news', product: 'Product updates', press: 'In the press' };
const formatDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const filters = document.querySelector('#news-filters');
const list = document.querySelector('#news-list');
const dialog = document.querySelector('#news-article');
let selected = 'all';

function renderNews() {
  const entries = selected === 'all' ? NEWS : NEWS.filter(entry => entry.type === selected);
  for (const button of filters.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === selected));
  }
  list.replaceChildren(...entries.map(entry => {
    const card = document.createElement('article');
    const meta = document.createElement('p');
    meta.className = 'news-card-meta';
    meta.textContent = entry.source || categories[entry.type];
    if (entry.date) {
      const date = document.createElement('time');
      date.dateTime = entry.date;
      date.textContent = formatDate.format(new Date(entry.date));
      meta.append(' · ', date);
    }
    const heading = document.createElement('h3');
    const link = document.createElement('a');
    link.textContent = entry.title;
    link.href = entry.url || `#story-${entry.id}`;
    if (entry.url) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    heading.append(link);
    const summary = document.createElement('p');
    summary.textContent = entry.summary;
    card.append(meta, heading, summary);
    return card;
  }));
  document.querySelector('#news-results').textContent = `${entries.length} stories shown.`;
}

for (const [key, label] of Object.entries(categories)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.filter = key;
  const count = key === 'all' ? NEWS.length : NEWS.filter(entry => entry.type === key).length;
  button.textContent = `${label} (${count})`;
  button.addEventListener('click', () => {
    selected = key;
    renderNews();
  });
  filters.append(button);
}

function openStory() {
  const story = NEWS.find(entry => entry.id && location.hash === `#story-${entry.id}`);
  if (!story) {
    if (dialog.open) dialog.close();
    return;
  }
  document.querySelector('#article-type').textContent = categories[story.type];
  document.querySelector('#article-title').textContent = story.title;
  document.querySelector('#article-body').replaceChildren(...story.body.map(copy => {
    const paragraph = document.createElement('p');
    paragraph.textContent = copy;
    return paragraph;
  }));
  if (!dialog.open) dialog.showModal();
}

document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#story-"]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.pushState(null, '', link.hash);
  openStory();
});

dialog.querySelector('button').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  if (location.hash.startsWith('#story-')) {
    history.replaceState(null, '', location.pathname + location.search);
  }
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#press') {
    selected = 'press';
    renderNews();
  }
  openStory();
});

const menu = document.querySelector('.menu-button');
const navigation = document.querySelector('#nav-links');
menu.addEventListener('click', () => {
  const expanded = navigation.classList.toggle('is-open');
  menu.setAttribute('aria-expanded', String(expanded));
  menu.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    menu.click();
    menu.focus();
  }
});
if (location.hash === '#press') selected = 'press';
renderNews();
openStory();
