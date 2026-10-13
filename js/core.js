/* ---------- connection (the anon key is public by design; Row Level Security protects the data) ---------- */
const SUPABASE_URL = 'https://fudujpxplvlrcwtdcaas.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZHVqcHhwbHZscmN3dGRjYWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODY0MDgsImV4cCI6MjEwNzQ2MjQwOH0.qyr2-Ji18qhYDDIe1kHeDntf6UR4kTjSnpdZucBhCo0';
const TABLE = {profiles:'profiles', companies:'companies', appts:'appointments', assigns:'provider_assignments', reqs:'change_requests', clientRecords:'client_records',recordAppts:'client_record_appointments',tasks:'work_tasks'};

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const ROLE_LABEL = {admin:'Admin',coordinator:'Provider',provider_company:'Provider company',provider_staff:'Provider staff',client:'Client',family:'Family'};
const ROLE_PLURAL = {admin:'Admins',coordinator:'Providers',provider_company:'Provider companies',provider_staff:'Provider staff',client:'Clients',family:'Family members'};
const ORDER = ['admin','coordinator','provider_company','provider_staff','client','family'];
const app = document.getElementById('app'), dlg = document.getElementById('dlg');
let me = null, view = null, tab = document.body.dataset.page || 'dashboard', authMode = 'signin', loadErrs = [];
const TAB_PATH = {equipment:'equipment.html',employees:'employees.html',transportAppointment:'transport-appointment.html',dashboard:'dashboard.html',appointments:'calendar.html',requests:'requests.html',clients:'clients.html',people:'people.html',companies:'companies.html',tasks:'tasks.html'};
let D = {profiles:[],companies:[],appts:[],assigns:[],reqs:[],clientRecords:[],recordAppts:[],tasks:[]};
let selectedClient = null;
let recovering = /type=recovery/.test(location.hash);

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : '';
const todayStr = () => new Date().toLocaleDateString('en-CA');
function toast(m, err){
  const t = document.getElementById('toast');
  t.textContent = m; t.className = 'show' + (err ? ' err' : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.className = '', 4500);
}
const prof = id => D.profiles.find(x => x.id === id);
const pname = p => p ? (p.full_name || p.email) : '—';
const nameOf = id => pname(prof(id));
const compName = id => id ? (D.companies.find(x => x.id === id)?.name || 'Provider') : '—';
const isCoord = () => ['admin','coordinator'].includes(view.role);
const byRole = r => D.profiles.filter(p => p.role === r);
const opts = (list, val, label, empty, sel) => (empty != null ? `<option value="">${esc(empty)}</option>` : '') + list.map(x => `<option value="${esc(x[val])}"${x[val] === sel ? ' selected' : ''}>${esc(label(x))}</option>`).join('');
const nul = v => v === '' || v == null ? null : v;

/* ---------- theme ---------- */
function themePref(){ try { return localStorage.getItem('gsc_theme') || 'auto'; } catch(e){ return 'auto'; } }
function applyTheme(){
  const p = themePref();
  const dark = p === 'dark' || (p === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
function setTheme(p){ try { localStorage.setItem('gsc_theme', p); } catch(e){} applyTheme(); syncThemeFooter(); }
function syncThemeFooter(){ document.querySelectorAll('[data-theme-choice]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.themeChoice === themePref()))); }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (themePref() === 'auto') applyTheme(); });

/* ---------- data ---------- */
async function loadAll(){
  loadErrs = [];
  await Promise.all(Object.keys(TABLE).map(async k => {
    const {data, error} = await sb.from(TABLE[k]).select('*');
    if (error) { loadErrs.push(TABLE[k] + ': ' + error.message); D[k] = []; } else D[k] = data || [];
  }));
  if(typeof transportLoad==='function') await transportLoad();
  if((tab==='dashboard' || location.pathname.endsWith('/client.html') || location.pathname.endsWith('/employee.html')) && typeof loadDashboardPrefs === 'function') await loadDashboardPrefs();
}
async function run(p, ok){
  const {data, error} = await p;
  if (error) { toast(error.message, true); return false; }
  if (Array.isArray(data) && !data.length) { toast('Nothing changed. You may not have permission.', true); return false; }
  await loadAll(); render(); if (ok) toast(ok); return true;
}

/* ---------- boot & auth ---------- */
const logo = `<svg class="logo" width="44" height="44" viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19" fill="none" stroke="#c8236f" stroke-width="3" stroke-dasharray="5 4"/><circle cx="22" cy="22" r="11" fill="#1f56b8"/></svg>`;
const brand = big => `<div class="brand${big ? ' big' : ''}">${logo}<div><h1>Provider</h1><p class="tag">Ground Support Crew</p></div></div>`;
const notice = (title, text, extra) => `<div class="authwrap"><div class="card auth">${brand(true)}<h2>${title}</h2><p>${text}</p>${extra || ''}<button class="ghost" data-act="signout">Sign out</button></div></div>`;

async function boot(session){
  if (recovering) return renderRecovery();
  if (!session) { me = view = null; return renderAuth(); }
  await loadAll();
  me = prof(session.user.id);
  const errs = loadErrs.length ? `<div class="errbox">${loadErrs.map(esc).join('<br>')}</div>` : '';
  if (!me) { app.innerHTML = notice('Account not set up yet', `You are signed in as ${esc(session.user.email)}, but there is no profile for this account. Ask a provider administrator to add you.`, errs); return; }
  if (me.approved === false && !['admin','coordinator'].includes(me.role)) { app.innerHTML = notice('Waiting for approval', 'A provider administrator needs to approve your account before you can use the app. Check back soon.'); return; }
  view = me; render();
}

function renderAuth(){
  const t = {signin:'Sign in', signup:'Create account', forgot:'Reset password'}[authMode];
  app.innerHTML = `<div class="authwrap"><div class="card auth">${brand(true)}<h2>${t}</h2>
  <form id="af" class="stack">
  ${authMode === 'signup' ? '<label>Full name<input name="name" required autocomplete="name"></label>' : ''}
  <label>Email<input name="email" type="email" required autocomplete="email"></label>
  ${authMode !== 'forgot' ? `<label>Password<input name="pw" type="password" required minlength="8" autocomplete="${authMode==='signup'?'new-password':'current-password'}"></label>` : ''}
  <div class="msg" id="amsg" role="alert"></div><button class="primary" id="abtn">${t}</button></form>
  <div class="links">${authMode !== 'signin' ? '<button class="link" data-mode="signin">Back to sign in</button>' : '<button class="link" data-mode="signup">Create account</button><button class="link" data-mode="forgot">Forgot password?</button>'}</div></div></div>`;
  document.getElementById('af').onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)), msg = document.getElementById('amsg'), btn = document.getElementById('abtn');
    btn.disabled = true; msg.textContent = '';
    let r;
    if (authMode === 'signin') r = await sb.auth.signInWithPassword({email:f.email, password:f.pw});
    else if (authMode === 'signup') r = await sb.auth.signUp({email:f.email, password:f.pw, options:{data:{full_name:f.name}, emailRedirectTo:location.origin + location.pathname}});
    else r = await sb.auth.resetPasswordForEmail(f.email, {redirectTo:location.origin + location.pathname});
    btn.disabled = false;
    if (r.error) { msg.textContent = r.error.message; return; }
    if (authMode === 'forgot') { msg.style.color = 'var(--ok-fg)'; msg.textContent = 'Check your email for a reset link.'; }
    else if (authMode === 'signup' && !r.data.session) { msg.style.color = 'var(--ok-fg)'; msg.textContent = 'Account created. Check your email to confirm it, then sign in.'; }
  };
}

function renderRecovery(){
  app.innerHTML = `<div class="authwrap"><div class="card auth">${brand(true)}<h2>Choose a new password</h2><form id="rf" class="stack"><label>New password<input name="pw" type="password" required minlength="8" autocomplete="new-password"></label><div class="msg" id="amsg" role="alert"></div><button class="primary">Save password</button></form></div></div>`;
  document.getElementById('rf').onsubmit = async e => {
    e.preventDefault();
    const {error} = await sb.auth.updateUser({password:new FormData(e.target).get('pw')});
    if (error) { document.getElementById('amsg').textContent = error.message; return; }
    recovering = false; history.replaceState(null, '', location.pathname);
    toast('Password updated.'); boot((await sb.auth.getSession()).data.session);
  };
}

/* ---------- main view ---------- */
const pendReqs = () => D.reqs.filter(r => r.status === 'pending').length;
const pendUsers = () => D.profiles.filter(p => !p.approved).length;
function tabsFor(){
  const t = [['dashboard','Dashboard'],['employees','Employees'],['equipment','Equipment'],['clients','Clients'],['tasks','Tasks']];
  return t;
}
function render(){
  if (!me) return;
  if (!tabsFor().some(t => t[0] === tab) && !['transportAppointment'].includes(tab)) tab = 'dashboard';
  if(tab==='equipment') equipmentSelected=new URLSearchParams(location.search).get('id');
  const pr = pendReqs(), pu = pendUsers();
  app.innerHTML = `<header class="top"><div class="who">
    ${me.role === 'admin' ? `<label class="as">View as <select data-viewas>${D.profiles.map(p => `<option value="${esc(p.id)}"${p.id===view.id?' selected':''}>${esc(pname(p))} (${ROLE_LABEL[p.role]||p.role})</option>`).join('')}</select></label>` : ''}
    <div class="me"><strong>${esc(pname(view))}</strong><small>${esc(ROLE_LABEL[view.role] || view.role)}</small></div>
    <button class="ghost sm" data-act="signout">Sign out</button></div></header>
    ${isCoord() && (pr || pu) ? `<div class="banner">${pr ? `<button class="link" data-tab="requests"><strong>${pr} request${pr>1?'s':''} to review</strong></button>` : ''}${pu ? `<button class="link" data-tab="people"><strong>${pu} ${pu>1?'people':'person'} waiting for approval</strong></button>` : ''}</div>` : ''}
    <nav class="tabs" aria-label="Sections">${tabsFor().map(([k,l,c]) => `<a href="./${TAB_PATH[k]}"${k===tab?' aria-current="page"':''}>${l}${c ? `<span class="count">${c}</span>` : ''}</a>`).join('')}</nav>
    <main>${loadErrs.length ? `<div class="errbox">Some data could not be loaded:<br>${loadErrs.map(esc).join('<br>')}</div>` : ''}${location.pathname.endsWith("/appointment.html") ? viewAppointmentDetail() : tab === 'tasks' ? viewTasks() : {transportAppointment:viewTransportAppointment,equipment:viewEquipment,employees:viewEmployees,dashboard:viewDashboard, appointments:viewAppts, requests:viewReqs, clients:viewClients, people:viewPeople, companies:viewCompanies}[tab]()}</main>`;
}

/* ----- which clients can the current view see? ----- */
function myClientIds(){
  const v = view;
  if (v.role === 'client') return [v.id];
  if (v.role === 'family') return v.linked_client ? [v.linked_client] : [];
  if (v.role === 'provider_staff') return D.assigns.filter(a => a.staff_id === v.id).map(a => a.client_id);
  if (v.role === 'provider_company') return D.assigns.filter(a => a.company_id === v.company_id).map(a => a.client_id);
  return [];
}
function myAppts(){
  let a = D.appts;
  if (!isCoord()) { const ids = myClientIds(); a = a.filter(x => ids.includes(x.client_id) || (view.role === 'provider_company' && x.company_id === view.company_id)); }
  return [...a].sort((x, y) => (x.appt_date || '').localeCompare(y.appt_date || ''));
}

