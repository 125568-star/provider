/* Appointment detail route: appointment.html?kind=record|account&id=<uuid>.
   All content comes from records already returned under Supabase RLS. */
function viewAppointmentDetail(){
  const params=new URLSearchParams(location.search);
  const kind=params.get('kind');
  const id=params.get('id')||'';
  const fromDirectory=kind==='record';
  const fromAccount=kind==='account';
  const available=fromDirectory
    ? (isCoord() ? D.recordAppts : [])
    : fromAccount ? myAppts() : [];
  const a=available.find(item=>item.id===id);
  if(!a){
    return '<div class="bar"><h2>Appointment not found</h2>'+
      '<a class="ghost sm client-open" href="./dashboard.html?tab=clients">Back to Dashboard</a></div>'+
      '<div class="empty">This appointment could not be found or is not available to your account.</div>';
  }
  const client=fromDirectory ? D.clientRecords.find(c=>c.id===a.client_record_id) : prof(a.client_id);
  const clientName=fromDirectory ? client?.full_name||'Client' : client ? pname(client) : 'Client';
  const avatar=fromDirectory && client ? clientAvatar(client) :
    '<span class="client-avatar client-initials" aria-hidden="true">'+
       esc(clientName.trim().slice(0,1).toUpperCase()||'?')+'</span>';
  const readableDate=new Intl.DateTimeFormat('en-AU',{
    weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'
  }).format(new Date(a.appt_date+'T12:00:00Z'));
  const time=a.appt_time ? clientAppointmentTime(a.appt_time) : 'Not specified';
  const fromClient=params.get('from')==='client' && fromDirectory && client;
  const back=fromClient ?
    './client.html?id='+encodeURIComponent(client.id)+'&date='+encodeURIComponent(a.appt_date) :
    './dashboard.html?tab=clients&date='+encodeURIComponent(a.appt_date);
  const clientLink=fromDirectory&&client ?
    '<a class="ghost sm client-open" href="./client.html?id='+encodeURIComponent(client.id)+
    '&date='+encodeURIComponent(a.appt_date)+'">Client schedule</a>' : '';
  const transportMatches=fromDirectory && typeof transport!=='undefined'
    ? transport.passengers.filter(p=>p.appointment_id===a.id).map(link=>transport.trips.find(t=>t.id===link.trip_id)).filter(Boolean)
    : [];
  const driverFields=transportMatches.map(t=>{
    const employee=transport.employees.find(e=>e.id===t.employee_id);
    const employeeBlock=employee&&typeof employeeAvatar==='function'
      ? '<div class="employee-passenger">'+employeeAvatar(employee)+'<span><a href="./employee.html?id='+encodeURIComponent(employee.id)+'">'+esc(employee.full_name)+'</a></span></div>'
      : '<span class="hint">No driver assigned</span>';
    return '<div class="appointment-detail-field"><small>Transport / Driver</small>'+
      '<strong><a href="./equipment.html?id='+encodeURIComponent(t.equipment_id)+'">'+esc(equipmentName(t.equipment_id))+'</a></strong>'+
      employeeBlock+'<a href="./transport-appointment.html?id='+encodeURIComponent(t.id)+'">View transport assignment</a></div>';
  }).join('');
  const note=typeof a.notes==='string'&&a.notes.trim()
    ? a.notes.trim() : 'No additional information has been recorded for this appointment yet.';
  return '<div class="bar"><h2>Appointment details</h2>'+
      '<a class="ghost sm client-open" href="'+back+'">'+(fromClient?'Back to Client':'Back to Clients Dashboard')+'</a></div>'+
    '<section class="client-week-card appointment-detail-card">'+
      '<div class="appointment-detail-head">'+avatar+
        '<div><h3>'+esc(clientName)+'</h3><p>Appointment record</p></div>'+
        (a.is_example?'<span class="chip pending">Example</span>':'')+
      '</div>'+
      '<h3 class="appointment-detail-title">'+esc(a.title)+'</h3>'+
      '<div class="appointment-detail-fields">'+
        '<div class="appointment-detail-field"><small>Date</small><strong>'+esc(readableDate)+'</strong></div>'+
        '<div class="appointment-detail-field"><small>Time</small><strong>'+esc(time)+'</strong></div>'+
        '<div class="appointment-detail-field"><small>Client</small><strong>'+esc(clientName)+'</strong></div>'+driverFields+
      '</div>'+
      '<div class="appointment-detail-description"><h4>About this appointment</h4><p>'+esc(note)+'</p></div>'+
      '<div class="appointment-detail-links">'+clientLink+'</div>'+
    '</section>';
}
