/* ----- clients ----- */

function ageFor(date){
  if (!date) return '—';
  const d = new Date(date+'T12:00:00'), now = new Date();
  let years = now.getFullYear()-d.getFullYear();
  if (now.getMonth()<d.getMonth() || (now.getMonth()===d.getMonth() && now.getDate()<d.getDate())) years--;
  return years>=0 && years<130 ? years : '—';
}
function coordinatorName(c){
  const p = D.profiles.find(p=>p.id===c.created_by);
  return p ? (p.id===me.id ? 'Coordinator 1 (you)' : pname(p)) : 'Not assigned';
}
function clientField(label,name,value,type,extra){
  return '<label>'+label+'<input name="'+name+'" type="'+(type||'text')+'" value="'+esc(value||'')+'" '+(extra||'')+'></label>';
}
function clientEditor(){
  const c = selectedClient==='new' ? null : D.clientRecords.find(x=>x.id===selectedClient);
  if (selectedClient!=='new' && !c) { selectedClient=null; return viewClients(); }
  return '<div class="bar"><h2>'+(c?'Client details: '+esc(c.full_name):'Add New Client')+'</h2><button class="ghost sm" data-act="client-back">Back to Clients</button></div>'+
  '<form id="client-form" class="client-form stack" data-client-id="'+esc(c?.id||'')+'">'+
  '<p class="hint">Coordinator-managed record. No login account or password is created.</p>'+
  '<div class="client-fields">'+
  clientField('Full name *','full_name',c?.full_name,'text','required maxlength="200" autocomplete="name"')+
  clientField('Date of birth','date_of_birth',c?.date_of_birth,'date','max="'+todayStr()+'"')+
  clientField('Email','email',c?.email,'email','maxlength="254" autocomplete="email"')+
  clientField('Phone','phone',c?.phone,'tel','maxlength="40" autocomplete="tel"')+
  clientField('Address','address',c?.address,'text','maxlength="500" autocomplete="street-address"')+
  clientField('Emergency contact name','emergency_contact_name',c?.emergency_contact_name,'text','maxlength="200"')+
  clientField('Emergency contact phone','emergency_contact_phone',c?.emergency_contact_phone,'tel','maxlength="40"')+
  '</div><label>Notes (optional)<textarea name="notes" class="client-notes" rows="4" maxlength="2000">'+esc(c?.notes||'')+'</textarea></label>'+
  '<p class="hint">Coordinator: '+esc(c?coordinatorName(c):'Coordinator 1 (you)')+'</p>'+
  '<div class="client-actions"><button type="submit" class="primary">'+(c?'Save changes':'Add Client')+'</button>'+
  (c?'<button type="button" class="ghost danger" data-act="delete-client" data-id="'+esc(c.id)+'">Delete client</button>':'')+
  '</div><div id="client-error" class="msg" role="alert"></div></form>';
}
function clientAvatar(c){
  const match=/^Client ([123])$/.exec(c.full_name||'');
  if (match && (c.notes||'').startsWith('Example client')) return '<img class="client-avatar" src="./assets/client-'+match[1]+'.svg" alt="Illustrated avatar for '+esc(c.full_name)+'" loading="lazy">';
  return '<span class="client-avatar client-initials" aria-hidden="true">'+esc((c.full_name||'?').trim().slice(0,1).toUpperCase())+'</span>';
}
function viewClients(){
  if (selectedClient) return clientEditor();
  if (location.pathname.endsWith('/client.html')) return viewClientProfile();
  const records=[...D.clientRecords].sort((a,b)=>a.full_name.localeCompare(b.full_name));
  const directory = records.length ?
    '<div class="scroll"><table><thead><tr><th>Client</th><th>Age</th><th>Contact</th><th>Coordinator</th><th></th></tr></thead><tbody>'+
      records.map(c=>'<tr><td><span class="client-identity">'+clientAvatar(c)+'<a class="link" href="./client.html?id='+encodeURIComponent(c.id)+'"><strong>'+esc(c.full_name)+'</strong></a></span></td><td>'+ageFor(c.date_of_birth)+'</td><td>'+esc(c.email||c.phone||'—')+'</td><td>'+esc(coordinatorName(c))+'</td><td class="act"><a class="ghost sm client-open" href="./client.html?id='+encodeURIComponent(c.id)+'">Open</a></td></tr>').join('')+
    '</tbody></table></div>' : '<div class="empty">No clients yet. Select Add Client to get started.</div>';
  const accountClients=byRole('client');
  const accounts = !accountClients.length ? '' :
    '<h3 class="sub">Clients with website logins</h3><p class="hint">These accounts are kept separate from the coordinator-managed client directory.</p><div class="scroll"><table><thead><tr><th>Name</th><th>Email</th><th></th></tr></thead><tbody>'+
    accountClients.map(c=>'<tr><td>'+esc(pname(c))+'</td><td>'+esc(c.email)+'</td><td class="act"><button class="ghost sm" data-act="add-appt" data-client="'+esc(c.id)+'">Add appointment</button></td></tr>').join('')+'</tbody></table></div>';
  return '<div class="bar"><h2>Clients</h2><div class="row-end">'+
    (me?.role==='admin'?'<button type="button" class="ghost sm" data-act="invite-role-logins">Set up role logins</button>':'')+
    '<button class="primary" data-act="new-client">Add Client</button></div></div>'+
  '<p class="hint">View, add, edit and delete client records.</p>'+directory+accounts;
}
async function saveClientRecord(form){
  if (!['admin','coordinator'].includes(me?.role)) return toast('Only coordinators and admins may manage clients.',true);
  const f=Object.fromEntries(new FormData(form));
  const fields=['full_name','date_of_birth','email','phone','address','emergency_contact_name','emergency_contact_phone','notes'];
  const values=Object.fromEntries(fields.map(k=>[k,(f[k]||'').trim()||null]));
  if (!values.full_name) return;
  if (values.date_of_birth && values.date_of_birth>todayStr()) return toast('Date of birth cannot be in the future.',true);
  const id=form.dataset.clientId;
  const query=id ? sb.from('client_records').update({...values,updated_at:new Date().toISOString()}).eq('id',id).select() :
    sb.from('client_records').insert({...values,created_by:me.id}).select();
  const {data,error}=await query;
  if (error||!data?.length) { form.querySelector('#client-error').textContent=error?.message||'Unable to save client.'; return; }
  selectedClient=id||data[0].id;
  await loadAll(); render(); toast(id?'Client updated.':'Client added.');
}


/* Dedicated per-client page. Today's date is shown in the account's local state timezone. */
function clientDayISO(d){return d.toISOString().slice(0,10);}
function clientWeekDates(today){
  const date=new Date(Date.UTC(today.year,today.month-1,today.day));
  const monday=new Date(date.getTime()-((date.getUTCDay()+6)%7)*86400000);
  return Array.from({length:7},(_,i)=>new Date(monday.getTime()+86400000*i));
}
function clientAppointmentTime(t){
  if(!t)return 'Not set';
  const [hours,minutes]=t.split(':').map(Number);
  const hh=(hours%12)||12;
  return hh+':'+String(minutes).padStart(2,'0')+(hours>=12?' pm':' am');
}
function viewClientProfile(){
  const params=new URLSearchParams(location.search);
  const id=params.get('id');
  const rawDate=params.get('date');
  const selectedDate=rawDate && /^\d{4}-\d{2}-\d{2}$/.test(rawDate) &&
    !Number.isNaN(Date.parse(rawDate+'T12:00:00Z')) &&
    new Date(rawDate+'T12:00:00Z').toISOString().slice(0,10)===rawDate ? rawDate : null;
  const client=D.clientRecords.find(c=>c.id===id);
  if(!client) return `<div class="bar"><h2>Client not found</h2><a class="ghost sm client-open" href="./clients.html">Back to Clients</a></div><div class="empty">Select a client from the client directory.</div>`;
  const today=localToday(STATE_TIMEZONES[dashboardPrefs?.state]||'Australia/Brisbane');
  const dates=clientWeekDates(today);
  const start=clientDayISO(dates[0]),end=clientDayISO(dates[6]);
  const activeDate=selectedDate && selectedDate>=start && selectedDate<=end ? selectedDate : null;
  const todayISO=[today.year,String(today.month).padStart(2,'0'),String(today.day).padStart(2,'0')].join('-');
  const weekAppointments=(D.recordAppts||[]).filter(a=>a.client_record_id===id&&a.appt_date>=start&&a.appt_date<=end);
  const appointments=weekAppointments.filter(a=>!activeDate||a.appt_date===activeDate)
    .sort((a,b)=>a.appt_date.localeCompare(b.appt_date)||String(a.appt_time||'').localeCompare(String(b.appt_time||'')));
  const label=d=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d);
  const dateLabel=iso=>new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(iso+'T12:00:00Z'));
  const weekCells=dates.map(d=>{
    const iso=clientDayISO(d),current=iso===todayISO,chosen=iso===activeDate;
    const count=weekAppointments.filter(a=>a.appt_date===iso).length;
    return `<button type="button" data-client-profile-date="${iso}"
      class="client-week-day dash-selectable-day${current?' client-week-today':''}${chosen?' dash-day-selected':''}"
      ${current?'aria-current="date"':''} aria-pressed="${chosen}"
      aria-label="${esc(new Intl.DateTimeFormat('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d))}, ${count} appointments">
      <small>${new Intl.DateTimeFormat('en-AU',{weekday:'short',timeZone:'UTC'}).format(d)}</small>
      <strong>${d.getUTCDate()}</strong><span class="client-week-count">${count?count+' appt'+(count===1?'':'s'):'—'}</span>
    </button>`;
  }).join('');
  const rows=appointments.map(a=>`<tr class="client-appointment-row" role="link" tabindex="0"
    data-client-appointment-href="./appointment.html?kind=record&amp;id=${encodeURIComponent(a.id)}&amp;from=client"
    aria-label="View ${esc(a.title)} on ${esc(dateLabel(a.appt_date))}">
    <td>${esc(dateLabel(a.appt_date))}</td><td>${esc(clientAppointmentTime(a.appt_time))}</td>
    <td><strong>${esc(a.title)}</strong>${a.notes?'<small>'+esc(a.notes)+'</small>':''}</td>
    <td>${a.is_example?'<span class="chip pending">Example</span>':'<span class="chip approved">Scheduled</span>'}</td>
  </tr>`).join('');
  return `<div class="bar"><h2>Client details</h2><a href="./clients.html" class="ghost sm client-open">Back to Clients</a></div>
  <section class="client-profile-heading">${clientAvatar(client)}<div><h3>${esc(client.full_name)}</h3><p class="hint">Coordinator: ${esc(coordinatorName(client))}</p></div>
  <button class="ghost sm" data-act="open-client" data-id="${esc(client.id)}">Edit details</button></section>
  <section class="client-week-card">
   <div class="client-week-heading"><div><h3>This week</h3><p class="hint">${esc(label(dates[0]))} – ${esc(label(dates[6]))}</p></div>
     <span class="chip approved">Today: ${esc(dateLabel(todayISO))}</span></div>
   <div class="client-week-grid" aria-label="Current week">${weekCells}</div>
   <div class="client-appointments-heading"><h3>${activeDate?'Appointments — '+esc(dateLabel(activeDate)):'Appointments this week'}</h3>
      <div class="client-appointment-actions">
       ${activeDate?'<button type="button" class="ghost sm" data-client-profile-all-week>All week</button>':''}
       <span class="chip approved">${appointments.length} appointment${appointments.length===1?'':'s'}</span>
      </div></div>
   ${appointments.length?`<div class="scroll"><table class="client-appointments-table"><thead><tr><th>Date</th><th>Time</th><th>Appointment</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="empty">No appointments for '+(activeDate?'this day':'this week')+'.</div>'}
  </section>`;
}

/* Selecting a weekday on a client's page filters the list without leaving the page. */
document.addEventListener('click',e=>{
  if(!location.pathname.endsWith('/client.html'))return;
  const appointmentRow=e.target.closest('[data-client-appointment-href]');
  if(appointmentRow){location.assign(appointmentRow.dataset.clientAppointmentHref);return;}
  const day=e.target.closest('[data-client-profile-date]');
  if(day){
    const value=day.dataset.clientProfileDate;
    const url=new URL(location.href);
    url.searchParams.set('date',value);
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    render();
    document.querySelector('[data-client-profile-date="'+value+'"]')?.focus({preventScroll:true});
    return;
  }
  if(e.target.closest('[data-client-profile-all-week]')){
    const url=new URL(location.href);
    url.searchParams.delete('date');
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    render();
  }
});


/* Make appointment table rows keyboard-accessible as well as clickable. */
document.addEventListener('keydown',e=>{
  if(!location.pathname.endsWith('/client.html'))return;
  const row=e.target.closest('[data-client-appointment-href]');
  if(row && (e.key==='Enter'||e.key===' ')){
    e.preventDefault();
    location.assign(row.dataset.clientAppointmentHref);
  }
});
