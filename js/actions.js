/* ---------- dialogs & actions ---------- */
function openDlg(title, body, submit, btns){
  dlg.innerHTML = `<h2 id="dlgTitle">${esc(title)}</h2><form id="df" class="stack">${body}<div class="row-end"><button type="button" class="ghost" data-act="close">Cancel</button>${btns || '<button class="primary">Save</button>'}</div></form>`;
  document.getElementById('df').onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target)); f._s = e.submitter?.value;
    if (await submit(f)) dlg.close();
  };
  dlg.showModal();
}
async function review(r, status, note){
  if (status === 'approved') {
    const A = sb.from(TABLE.appts); let q;
    if (r.action === 'add') q = A.insert({client_id:r.client_id, title:r.title, appt_date:r.appt_date, company_id:r.company_id, created_by:me.id});
    else if (r.action === 'edit') { const u = {title:r.title, appt_date:r.appt_date}; if (r.company_id) u.company_id = r.company_id; q = A.update(u).eq('id', r.appointment_id).select(); }
    else q = A.delete().eq('id', r.appointment_id).select();
    const {data, error} = await q;
    if (error) { toast(error.message, true); return false; }
    if (Array.isArray(data) && !data.length) { toast('The appointment was not changed. You may not have permission.', true); return false; }
  }
  return run(sb.from(TABLE.reqs).update({status, review_note:nul(note), reviewed_by:me.id, reviewed_at:new Date().toISOString()}).eq('id', r.id).select(), 'Request ' + status + '.');
}
const clientOpts = sel => opts(byRole('client'), 'id', pname, 'Choose a client', sel);
const ACT = {
  'invite-role-logins': () => {
    if (me?.role !== 'admin') return;
    const body='<p class="hint">Create separate Coordinator and Client accounts. Each email receives an invitation to set a password. The accounts can share a display name but must have different email addresses.</p>'+
      '<label>Display name<input name="full_name" maxlength="100" required value="'+esc(pname(me))+'" autocomplete="name"></label>'+
      '<label>Coordinator email<input name="coordinator_email" type="email" maxlength="254" required placeholder="Coordinator email address" autocomplete="off"></label>'+
      '<label>Client email<input name="client_email" type="email" maxlength="254" required placeholder="Client email address" autocomplete="off"></label>';
    openDlg('Set up two sign-in accounts', body, async f => {
      const coordinatorEmail=String(f.coordinator_email||'').trim().toLowerCase();
      const clientEmail=String(f.client_email||'').trim().toLowerCase();
      if (coordinatorEmail === clientEmail || !coordinatorEmail || !clientEmail ||
          coordinatorEmail === String(me.email||'').toLowerCase() ||
          clientEmail === String(me.email||'').toLowerCase()) {
        toast('Use two different email addresses, neither of which is the Admin address.',true);
        return false;
      }
      const {data,error}=await sb.functions.invoke('invite-role-logins',{
        body:{coordinator_email:coordinatorEmail,client_email:clientEmail,full_name:String(f.full_name||'').trim()}
      });
      if(error){
        let message=error.message||'Invitations could not be sent.';
        try {const details=await error.context?.json(); if(details?.error) message=details.error;}catch(_){}
        toast(message,true); return false;
      }
      if(!data?.success){
        const failed=(data?.results||[]).filter(r=>!r.invited||!r.approved);
        const ok=(data?.results||[]).filter(r=>r.invited&&r.approved);
        toast((ok.length?ok.map(r=>r.role+' invited').join(', ')+'. ':'')+
          (failed.map(r=>r.role+': '+(r.error||'Failed')).join('; ')||data?.error||'Invitations could not be completed.'),true);
        return false;
      }
      await loadAll();render();
      toast('Coordinator and Client invitations sent. Check both inboxes to activate the accounts.');
      return true;
    }, '<button class="primary" type="submit">Send invitations</button>');
  },
  signout: async () => { await sb.auth.signOut(); },
  'new-client': () => { selectedClient='new'; render(); },
  'open-client': d => { selectedClient=d.id; render(); },
  'client-back': () => { selectedClient=null; render(); },
  'delete-client': async d => {
    if (!['admin','coordinator'].includes(me?.role)) return;
    const c=D.clientRecords.find(x=>x.id===d.id); if (!c) return;
    if (!confirm('Do you really want to delete '+c.full_name+'? This permanently removes the client record and cannot be undone.')) return;
    const {data,error}=await sb.from('client_records').delete().eq('id',c.id).select();
    if (error||!data?.length) return toast(error?.message||'Client was not deleted.',true);
    selectedClient=null;await loadAll();render();toast('Client deleted.');
  },
  close: () => dlg.close(),
  'add-appt': d => openDlg('Add appointment', `
    <label>Client<select name="client_id" required>${clientOpts(d.client)}</select></label>
    <label>Title<input name="title" required maxlength="200"></label>
    <label>Date<input name="appt_date" type="date" required value="${todayStr()}"></label>
    <label>Provider company<select name="company_id">${opts(D.companies, 'id', c => c.name, 'None')}</select></label>`,
    f => run(sb.from(TABLE.appts).insert({client_id:f.client_id, title:f.title, appt_date:f.appt_date, company_id:nul(f.company_id), created_by:me.id}), 'Appointment added.')),
  'edit-appt': d => { const a = D.appts.find(x => x.id === d.id); openDlg('Edit appointment', `
    <label>Title<input name="title" required maxlength="200" value="${esc(a.title)}"></label>
    <label>Date<input name="appt_date" type="date" required value="${esc(a.appt_date)}"></label>
    <label>Provider company<select name="company_id">${opts(D.companies, 'id', c => c.name, 'None', a.company_id)}</select></label>`,
    f => run(sb.from(TABLE.appts).update({title:f.title, appt_date:f.appt_date, company_id:nul(f.company_id)}).eq('id', a.id).select(), 'Appointment updated.')); },
  'del-appt': d => confirm('Delete this appointment?') && run(sb.from(TABLE.appts).delete().eq('id', d.id).select(), 'Appointment deleted.'),
  'add-req': () => {
    const cid = view.role === 'client' ? view.id : view.linked_client;
    if (!cid) return toast('Ask a coordinator to link your account to a client first.', true);
    const mine = D.appts.filter(a => a.client_id === cid);
    openDlg('New request', `
      <label>What do you need?<select name="action" data-reqaction><option value="add">Add an appointment</option><option value="edit">Change an appointment</option><option value="remove">Remove an appointment</option></select></label>
      <label data-needappt hidden>Which appointment<select name="appointment_id">${opts(mine, 'id', a => fmtDate(a.appt_date) + ' · ' + a.title, 'Choose one')}</select></label>
      <div class="stack" data-needdetails>
        <label>Title<input name="title" required maxlength="200"></label>
        <label>Date<input name="appt_date" type="date" required value="${todayStr()}"></label>
        <label>Provider company<select name="company_id">${opts(D.companies, 'id', c => c.name, 'No preference')}</select></label>
      </div>
      <label>Note<textarea name="note" maxlength="1000"></textarea></label>`,
      f => { const rm = f.action === 'remove'; return run(sb.from(TABLE.reqs).insert({client_id:cid, appointment_id:f.action === 'add' ? null : nul(f.appointment_id), action:f.action, title:rm ? null : f.title, appt_date:rm ? null : f.appt_date, company_id:rm ? null : nul(f.company_id), note:nul(f.note), requested_by:me.id, requester_name:pname(me), requester_role:me.role, status:'pending'}), 'Request sent.'); });
  },
  review: d => { const r = D.reqs.find(x => x.id === d.id); openDlg('Review request', `<p><strong>${esc(reqSummary(r))}</strong></p><p class="hint">For ${esc(nameOf(r.client_id))}, asked by ${esc(r.requester_name || nameOf(r.requested_by))}.${r.note ? ' Note: ' + esc(r.note) : ''}</p><label>Note to requester (optional)<textarea name="review_note"></textarea></label>`,
    f => review(r, f._s, f.review_note), '<button type="submit" value="declined" class="ghost">Decline</button><button type="submit" value="approved" class="primary">Approve</button>'); },
  'approve-user': d => run(sb.from(TABLE.profiles).update({approved:true}).eq('id', d.id).select(), 'Approved.'),
  'add-prov': d => openDlg('Add provider for ' + nameOf(d.client), `
    <label>Service<input name="service" required maxlength="100"></label>
    <label>Company<select name="company_id" required>${opts(D.companies, 'id', c => c.name, 'Choose a company')}</select></label>
    <label>Staff member<select name="staff_id" required>${opts(byRole('provider_staff'), 'id', p => pname(p) + ' (' + compName(p.company_id) + ')', 'Choose staff')}</select></label>`,
    f => run(sb.from(TABLE.assigns).insert({client_id:d.client, service:f.service, company_id:f.company_id, staff_id:f.staff_id}), 'Provider added.')),
  'del-prov': d => confirm('Remove this provider from the client?') && run(sb.from(TABLE.assigns).delete().eq('id', d.id).select(), 'Provider removed.'),
  'add-comp': () => openDlg('Add provider company', '<label>Company name<input name="name" required maxlength="200"></label>',
    f => run(sb.from(TABLE.companies).insert({name:f.name}), 'Company added.')),
  'del-comp': d => confirm('Delete this company?') && run(sb.from(TABLE.companies).delete().eq('id', d.id).select(), 'Company deleted.')
};
document.addEventListener('click', e => {
  const choice = e.target.closest('[data-theme-choice]'); if (choice) { setTheme(choice.dataset.themeChoice); return; }
  const a = e.target.closest('[data-act]'); if (a) return ACT[a.dataset.act]?.(a.dataset);
  const t = e.target.closest('[data-tab]'); if (t) { location.href = './'+TAB_PATH[t.dataset.tab]; return; }
  const m = e.target.closest('[data-mode]'); if (m) { authMode = m.dataset.mode; renderAuth(); }
});
document.addEventListener('submit', e => {
  if (e.target.id==='client-form') {e.preventDefault();saveClientRecord(e.target);}
});
document.addEventListener('change', e => {
  const s = e.target, P = TABLE.profiles;
  if (s.matches('[data-viewas]')) { view = prof(s.value) || me; render(); }
  else if (s.matches('[data-reqaction]')) {
    const f = s.form, v = s.value;
    f.querySelector('[data-needappt]').hidden = v === 'add';
    f.querySelector('[name=appointment_id]').required = v !== 'add';
    f.querySelector('[data-needdetails]').hidden = v === 'remove';
    f.querySelector('[name=title]').required = v !== 'remove';
    f.querySelector('[name=appt_date]').required = v !== 'remove';
  }
  else if (s.dataset.prole) run(sb.from(P).update({role:s.value}).eq('id', s.dataset.prole).select(), 'Role updated.');
  else if (s.dataset.pcomp) run(sb.from(P).update({company_id:nul(s.value)}).eq('id', s.dataset.pcomp).select(), 'Company updated.');
  else if (s.dataset.plink) run(sb.from(P).update({linked_client:nul(s.value)}).eq('id', s.dataset.plink).select(), 'Linked.');
  else if (s.dataset.prep) run(sb.from(P).update({is_representative:s.checked}).eq('id', s.dataset.prep).select(), 'Updated.');
});

/* ---------- never a blank page: show any error on screen ---------- */
function fatal(msg){
  if (!/Loading/.test(app.textContent)) { toast(msg, true); return; }
  app.innerHTML = `<div class="authwrap"><div class="card auth"><h2>Something went wrong</h2><div class="errbox">${esc(msg)}</div><button class="ghost" onclick="location.reload()">Reload</button></div></div>`;
}
addEventListener('error', e => fatal(e.message));
addEventListener('unhandledrejection', e => fatal(e.reason?.message || String(e.reason)));

/* ---------- start ---------- */
applyTheme();
syncThemeFooter();
sb.auth.onAuthStateChange((ev, session) => {
  if (ev === 'PASSWORD_RECOVERY') recovering = true;
  if (ev === 'INITIAL_SESSION' || ev === 'SIGNED_IN' || ev === 'SIGNED_OUT' || ev === 'PASSWORD_RECOVERY') setTimeout(() => boot(session), 0);
});
