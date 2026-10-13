/* Employee directory, portraits, records and appointment schedules. */
const EMPLOYEE_AVATAR_STYLES = ['driver-1','driver-2','driver-3'];

function employeeAvatar(employee) {
  const choice = EMPLOYEE_AVATAR_STYLES.includes(employee?.avatar_style) ? employee.avatar_style : 'driver-1';
  return '<img class="client-avatar employee-avatar" src="./assets/'+choice+'.svg" alt="Illustrated portrait of '+esc(employee?.full_name||'employee')+'" loading="lazy">';
}

function employeeIdentity(employee) {
  return '<span class="client-identity employee-identity">'+employeeAvatar(employee)+
    '<a class="link" href="./employee.html?id='+encodeURIComponent(employee.id)+'"><strong>'+esc(employee.full_name)+'</strong></a></span>';
}

function employeeDirectory() {
  const entries = [...transport.employees].sort((a,b)=>a.full_name.localeCompare(b.full_name));
  const rows = entries.map(employee=>{
    const assigned = transport.trips.filter(t=>t.employee_id===employee.id);
    const next = assigned.filter(t=>t.trip_date>=todayStr()).sort((a,b)=>(a.trip_date+' '+(a.trip_time||'')).localeCompare(b.trip_date+' '+(b.trip_time||'')))[0];
    const upcoming = next ? '<a href="./transport-appointment.html?id='+encodeURIComponent(next.id)+'">'+esc(next.trip_date+' · '+equipmentName(next.equipment_id))+'</a>' : '—';
    return '<tr><td>'+employeeIdentity(employee)+'</td>'+
      '<td>'+esc(employee.phone||employee.email||'—')+'</td>'+
      '<td>'+upcoming+'</td><td>'+assigned.length+'</td>'+
      '<td class="act"><a class="ghost sm" href="./employee.html?id='+encodeURIComponent(employee.id)+'">Open</a></td></tr>';
  }).join('');
  return transportHeader('Employees',
    isCoord()?'<a class="primary employee-add-link" href="./employees.html?new=1">Add Employee</a>':'')+
    '<p class="hint employee-directory-hint">Select an employee to view their profile, weekly schedule, vans and passengers.</p>'+
    (rows ? '<div class="scroll"><table class="employee-directory-table"><thead><tr><th>Employee</th><th>Contact</th><th>Next appointment</th><th>Trips</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>' :
      '<div class="empty">No employees yet. Select Add Employee to get started.</div>');
}

function employeeEditor(employee) {
  if (!isCoord()) return transportHeader('Employee details','<a class="ghost sm" href="./employees.html">Back to Employees</a>')+
    '<div class="empty">Only authorised staff can edit employee records.</div>';
  const id=employee?.id||'';
  const back=id ? './employee.html?id='+encodeURIComponent(id) : './employees.html';
  const current=EMPLOYEE_AVATAR_STYLES.includes(employee?.avatar_style)?employee.avatar_style:'driver-1';
  const choices=EMPLOYEE_AVATAR_STYLES.map((value,index)=>
    '<label class="employee-avatar-option"><input type="radio" name="avatar_style" value="'+value+'"'+(current===value?' checked':'')+'>'+
    '<img src="./assets/'+value+'.svg" alt="Employee portrait option '+(index+1)+'">'+
    '<span>Portrait '+(index+1)+'</span></label>').join('');
  return transportHeader(employee?'Edit employee':'Add New Employee','<a class="ghost sm" href="'+back+'">Back to '+(employee?'Employee':'Employees')+'</a>')+
    '<form id="employee-form" class="client-form stack" data-employee-id="'+esc(id)+'">'+
    '<p class="hint">Employee records are separate from website login accounts.</p>'+
    '<div><h3>Employee picture</h3><p class="hint">Choose an illustrated portrait, just like the example clients.</p><div class="employee-avatar-options">'+choices+'</div></div>'+
    '<div class="client-fields">'+
      clientField('Full name *','full_name',employee?.full_name,'text','required maxlength="150" autocomplete="name"')+
      clientField('Phone','phone',employee?.phone,'tel','maxlength="40" autocomplete="tel"')+
      clientField('Email','email',employee?.email,'email','maxlength="254" autocomplete="email"')+
    '</div>'+
    '<label>Notes (optional)<textarea name="notes" class="client-notes" rows="4" maxlength="2000">'+esc(employee?.notes||'')+'</textarea></label>'+
    '<div class="client-actions"><button class="primary" type="submit">'+(employee?'Save changes':'Add Employee')+'</button>'+
      (employee?'<button class="ghost danger" type="button" data-act="delete-employee" data-id="'+esc(id)+'">Delete employee</button>':'')+'</div>'+
    '<div id="employee-error" class="msg" role="alert"></div></form>';
}

function employeeToday() {
  if (typeof localToday==='function' && typeof dashboardPrefs!=='undefined' && typeof STATE_TIMEZONES!=='undefined')
    return localToday(STATE_TIMEZONES[dashboardPrefs?.state] || 'Australia/Brisbane');
  return localToday('Australia/Brisbane');
}

function employeeProfile() {
  const params=new URLSearchParams(location.search);
  const id=params.get('id')||'';
  const employee=transport.employees.find(e=>e.id===id);
  if (!employee) return transportHeader('Employee not found','<a class="ghost sm" href="./employees.html">Back to Employees</a>')+
    '<div class="empty">Choose an employee from the employee list.</div>';
  const today=employeeToday();
  const days=clientWeekDates(today);
  const first=clientDayISO(days[0]),last=clientDayISO(days[6]);
  const todayISO=[today.year,String(today.month).padStart(2,'0'),String(today.day).padStart(2,'0')].join('-');
  const requested=params.get('date');
  const selected=/^\d{4}-\d{2}-\d{2}$/.test(requested||'') && requested>=first && requested<=last?requested:null;
  const assigned=transport.trips.filter(t=>t.employee_id===id&&t.trip_date>=first&&t.trip_date<=last);
  const listed=assigned.filter(t=>!selected||t.trip_date===selected)
    .sort((a,b)=>(a.trip_date+' '+(a.trip_time||'')).localeCompare(b.trip_date+' '+(b.trip_time||'')));
  const dateLabel=iso=>new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'})
    .format(new Date(iso+'T12:00:00Z'));
  const weekLabel=iso=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
    .format(new Date(iso+'T12:00:00Z'));
  const dayButtons=days.map(d=>{
    const iso=clientDayISO(d);
    const count=assigned.filter(t=>t.trip_date===iso).length;
    const active=iso===selected;
    return '<button type="button" class="client-week-day dash-selectable-day'+
      (iso===todayISO?' client-week-today':'')+(active?' dash-day-selected':'')+
      '" data-employee-profile-date="'+iso+'" aria-pressed="'+active+'"'+(iso===todayISO?' aria-current="date"':'')+'>'+
      '<small>'+esc(new Intl.DateTimeFormat('en-AU',{weekday:'short',timeZone:'UTC'}).format(d))+'</small>'+
      '<strong>'+d.getUTCDate()+'</strong><span class="client-week-count">'+
      (count?count+' trip'+(count===1?'':'s'):'—')+'</span></button>';
  }).join('');
  const rows=listed.map(t=>{
    const passengers=tripClients(t.id).map(c=>{
      const ap=appointmentForPassenger(t.id,c.id);
      return '<div class="employee-passenger">'+clientAvatar(c)+
        '<span><a href="./client.html?id='+encodeURIComponent(c.id)+'">'+esc(c.full_name)+'</a>'+
        (ap?'<small><a href="./appointment.html?kind=record&amp;id='+encodeURIComponent(ap.id)+'&amp;from=client">'+esc(ap.title)+'</a></small>':'<small>No linked appointment</small>')+
        '</span></div>';
    }).join('');
    return '<tr class="client-appointment-row employee-appointment-row" role="link" tabindex="0"'+
      ' data-employee-trip-href="./transport-appointment.html?id='+encodeURIComponent(t.id)+'">'+
      '<td>'+esc(dateLabel(t.trip_date))+'</td><td>'+esc(clientAppointmentTime(t.trip_time))+'</td>'+
      '<td><strong>'+esc(t.title)+'</strong></td>'+
      '<td><a href="./equipment.html?id='+encodeURIComponent(t.equipment_id)+'">'+esc(equipmentName(t.equipment_id))+'</a></td>'+
      '<td>'+(passengers||'—')+'</td></tr>';
  }).join('');
  const contact=[employee.phone?'<a href="tel:'+encodeURIComponent(employee.phone)+'">'+esc(employee.phone)+'</a>':'',
    employee.email?'<a href="mailto:'+encodeURIComponent(employee.email)+'">'+esc(employee.email)+'</a>':''].filter(Boolean).join(' · ');
  return transportHeader('Employee details','<a class="ghost sm" href="./employees.html">Back to Employees</a>')+
    '<section class="client-profile-heading employee-profile-heading">'+employeeAvatar(employee)+
      '<div><h3>'+esc(employee.full_name)+'</h3><p class="hint">Employee / Driver</p>'+
      (contact?'<p class="hint">'+contact+'</p>':'')+'</div>'+
      (isCoord()?'<a class="ghost sm" href="./employee.html?id='+encodeURIComponent(id)+'&amp;edit=1">Edit details</a>':'')+
    '</section>'+
    (employee.notes?'<div class="employee-notes card"><strong>Notes</strong><p>'+esc(employee.notes)+'</p></div>':'')+
    '<section class="client-week-card">'+
      '<div class="client-week-heading"><div><h3>This week</h3><p class="hint">'+esc(weekLabel(first))+' – '+esc(weekLabel(last))+'</p></div>'+
        '<span class="chip approved">Today: '+esc(dateLabel(todayISO))+'</span></div>'+
      '<div class="client-week-grid" aria-label="Employee weekly schedule">'+dayButtons+'</div>'+
      '<div class="client-appointments-heading"><h3>'+(selected?'Appointments — '+esc(dateLabel(selected)):'Appointments this week')+'</h3>'+
        '<div class="client-appointment-actions">'+
          (selected?'<button type="button" class="ghost sm" data-employee-profile-all-week>All week</button>':'')+
          '<span class="chip approved">'+listed.length+' trip'+(listed.length===1?'':'s')+'</span>'+
          (isCoord()?'<button type="button" class="primary sm" data-act="new-trip" data-employee="'+esc(id)+'">Add transport appointment</button>':'')+
        '</div></div>'+
      (listed.length?'<div class="scroll"><table class="client-appointments-table employee-appointments-table"><thead>'+
        '<tr><th>Date</th><th>Time</th><th>Appointment</th><th>Equipment</th><th>Clients and their appointments</th></tr></thead><tbody>'+rows+'</tbody></table></div>':
        '<div class="empty">No transport appointments for '+(selected?'this day':'this week')+'.</div>')+
    '</section>';
}

function viewEmployees() {
  const params=new URLSearchParams(location.search);
  const isProfile=location.pathname.endsWith('/employee.html');
  if (isProfile && params.get('edit')==='1')
    return employeeEditor(transport.employees.find(e=>e.id===params.get('id')));
  if (!isProfile && params.get('new')==='1')
    return employeeEditor(null);
  return isProfile?employeeProfile():employeeDirectory();
}

async function saveEmployeeRecord(form) {
  if (!isCoord())return toast('Only authorised staff can manage employees.',true);
  const f=Object.fromEntries(new FormData(form));
  const values={
    full_name:String(f.full_name||'').trim(),
    phone:String(f.phone||'').trim()||null,
    email:String(f.email||'').trim()||null,
    notes:String(f.notes||'').trim()||null,
    avatar_style:EMPLOYEE_AVATAR_STYLES.includes(f.avatar_style)?f.avatar_style:'driver-1'
  };
  if (!values.full_name) return;
  const id=form.dataset.employeeId||null;
  const query=id?sb.from('provider_employees').update(values).eq('id',id).select():
    sb.from('provider_employees').insert(values).select();
  const {data,error}=await query;
  if (error||!data?.length){
    form.querySelector('#employee-error').textContent=error?.message||'Unable to save employee.';
    return;
  }
  location.assign('./employee.html?id='+encodeURIComponent(data[0].id));
}

async function deleteEmployeeRecord(id) {
  if (!isCoord())return toast('Only authorised staff can manage employees.',true);
  const employee=transport.employees.find(e=>e.id===id);
  if(!employee)return;
  const count=transport.trips.filter(t=>t.employee_id===id).length;
  if(!confirm('Delete '+employee.full_name+'?'+(count?' Their '+count+' transport assignment(s) will remain but have no driver.':'')+' This cannot be undone.'))return;
  const {data,error}=await sb.from('provider_employees').delete().eq('id',id).select();
  if(error||!data?.length)return toast(error?.message||'Employee could not be deleted.',true);
  location.assign('./employees.html');
}

transportActions['delete-employee']=d=>deleteEmployeeRecord(d.id);
transportActions['new-employee']=()=>location.assign('./employees.html?new=1');
transportActions['edit-employee']=d=>location.assign('./employee.html?id='+encodeURIComponent(d.id)+'&edit=1');

document.addEventListener('submit',event=>{
  if(event.target.id==='employee-form'){
    event.preventDefault();
    saveEmployeeRecord(event.target);
  }
});

document.addEventListener('click',event=>{
  if(!location.pathname.endsWith('/employee.html'))return;
  const day=event.target.closest('[data-employee-profile-date]');
  if(day){
    const url=new URL(location.href);
    url.searchParams.set('date',day.dataset.employeeProfileDate);
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    render();
    document.querySelector('[data-employee-profile-date="'+day.dataset.employeeProfileDate+'"]')?.focus({preventScroll:true});
    return;
  }
  if(event.target.closest('[data-employee-profile-all-week]')){
    const url=new URL(location.href);
    url.searchParams.delete('date');
    history.replaceState(null,'',url.pathname+url.search+url.hash);
    render();
    return;
  }
  const row=event.target.closest('[data-employee-trip-href]');
  if(row&&!event.target.closest('a,button'))location.assign(row.dataset.employeeTripHref);
});

document.addEventListener('keydown',event=>{
  if(!location.pathname.endsWith('/employee.html'))return;
  const row=event.target.closest('[data-employee-trip-href]');
  if(row&&(event.key==='Enter'||event.key===' ')){
    event.preventDefault();location.assign(row.dataset.employeeTripHref);
  }
});
