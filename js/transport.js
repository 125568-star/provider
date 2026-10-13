/* Provider transport fleet */
const transport = {equipment:[],employees:[],trips:[],passengers:[]};
let equipmentSelected = null;
async function transportLoad(){
  const sets=[['equipment','provider_equipment'],['employees','provider_employees'],['trips','provider_trips'],['passengers','provider_trip_clients']];
  await Promise.all(sets.map(async ([key,table])=>{const {data,error}=await sb.from(table).select('*');transport[key]=error?[]:(data||[]);if(error)loadErrs.push(table+': '+error.message);}));
}
const equipmentName=id=>transport.equipment.find(e=>e.id===id)?.name||'—';
const EQUIPMENT_IMAGE_STYLES=['van-1','van-2','van-3'];
function equipmentAvatar(equipment){
  const style=EQUIPMENT_IMAGE_STYLES.includes(equipment?.image_style)?equipment.image_style:'van-1';
  return '<img class="client-avatar equipment-avatar" src="./assets/'+style+'.svg" alt="Illustration of '+esc(equipment?.name||'equipment')+'" loading="lazy">';
}
function equipmentIdentity(equipment){
  return '<span class="client-identity equipment-identity">'+equipmentAvatar(equipment)+
    '<a class="link" href="./equipment.html?id='+encodeURIComponent(equipment.id)+'"><strong>'+esc(equipment.name)+'</strong></a></span>';
}

const employeeName=id=>transport.employees.find(e=>e.id===id)?.full_name||'Unassigned';
const transportEmployeeLink=id=>{const employee=transport.employees.find(e=>e.id===id);return employee&&typeof employeeIdentity==='function'?employeeIdentity(employee):esc(employeeName(id));};
const tripClients=id=>transport.passengers.filter(p=>p.trip_id===id).map(p=>D.clientRecords.find(c=>c.id===p.client_id)).filter(Boolean);
function appointmentTransportSummary(appointmentId){
 const links=transport.passengers.filter(x=>x.appointment_id===appointmentId);
 if(!links.length)return '<span class="hint">Not assigned</span>';
 return links.map(link=>{
  const trip=transport.trips.find(t=>t.id===link.trip_id);if(!trip)return '';
  return '<a href="./transport-appointment.html?id='+encodeURIComponent(trip.id)+'">'+esc(equipmentName(trip.equipment_id))+'</a> · '+esc(employeeName(trip.employee_id));
 }).join('<hr>');
}

const driverOpts=id=>'<option value="">Unassigned</option>'+transport.employees.map(e=>'<option value="'+esc(e.id)+'"'+(e.id===id?' selected':'')+'>'+esc(e.full_name)+'</option>').join('');
const equipOpts=id=>transport.equipment.map(e=>'<option value="'+esc(e.id)+'"'+(e.id===id?' selected':'')+'>'+esc(e.name)+'</option>').join('');
const appointmentForPassenger=(tripId,clientId)=>{const link=transport.passengers.find(p=>p.trip_id===tripId&&p.client_id===clientId);return D.recordAppts.find(a=>a.id===link?.appointment_id)||null;};
const transportPassengerLabel=(t,c)=>{const a=appointmentForPassenger(t.id,c.id);return esc(c.full_name)+(a?' → <a href="./appointment.html?kind=record&id='+encodeURIComponent(a.id)+'">'+esc(a.title)+'</a>':' → No appointment linked');};
const passengerInputs=(selected,tripId)=>{
 return D.clientRecords.map(c=>{
  const a=appointmentForPassenger(tripId,c.id);
  const list=D.recordAppts.filter(ap=>ap.client_record_id===c.id).sort((x,y)=>x.appt_date.localeCompare(y.appt_date));
  return '<div class="transport-passenger"><label class="check"><input type="checkbox" name="passenger" value="'+esc(c.id)+'"'+(selected.includes(c.id)?' checked':'')+'> '+esc(c.full_name)+'</label>'+
   '<label>Appointment<select data-passenger-appointment="'+esc(c.id)+'"><option value="">No appointment linked</option>'+
   list.map(ap=>'<option value="'+esc(ap.id)+'"'+(a?.id===ap.id?' selected':'')+'>'+esc(ap.appt_date+' · '+(ap.appt_time||'').slice(0,5)+' · '+ap.title)+'</option>').join('')+
   '</select></label></div>';
 }).join('');
};
function transportHeader(title,button){return '<div class="bar"><h2>'+esc(title)+'</h2>'+(button||'')+'</div>';}

function viewEquipment(){
 if(equipmentSelected){
  const e=transport.equipment.find(item=>item.id===equipmentSelected);
  if(!e){equipmentSelected=null;return viewEquipment();}
  const trips=transport.trips.filter(t=>t.equipment_id===e.id).sort((a,b)=>(a.trip_date+' '+(a.trip_time||'')).localeCompare(b.trip_date+' '+(b.trip_time||'')));
  const rows=trips.map(t=>{
    const href='./transport-appointment.html?id='+encodeURIComponent(t.id);
    const clients=tripClients(t.id).map(c=>
      '<div class="equipment-passenger">'+clientAvatar(c)+'<span><a href="./client.html?id='+encodeURIComponent(c.id)+'">'+esc(c.full_name)+'</a>'+
      (appointmentForPassenger(t.id,c.id)?'<small>'+esc(appointmentForPassenger(t.id,c.id).title)+'</small>':'')+'</span></div>'
    ).join('');
    return '<tr class="record-row" role="link" tabindex="0" data-row-href="'+href+'" aria-label="Open '+esc(t.title)+' transport appointment">'+
      '<td>'+esc(fmtDate(t.trip_date))+'</td>'+
      '<td>'+esc(t.trip_time?.slice(0,5)||'—')+'</td>'+
      '<td><a class="link" href="'+href+'"><strong>'+esc(t.title)+'</strong></a></td>'+
      '<td>'+transportEmployeeLink(t.employee_id)+'</td>'+
      '<td>'+(clients||'—')+'</td>'+
      '<td class="act"><button class="ghost sm" data-act="edit-trip" data-id="'+esc(t.id)+'">Edit</button></td></tr>';
  }).join('');
  return transportHeader('Equipment details','<a class="ghost sm" href="./equipment.html">Back to Equipment</a>')+
    '<section class="client-profile-heading equipment-profile-heading">'+equipmentAvatar(e)+
    '<div><h3>'+esc(e.name)+'</h3><p class="hint">Registration: '+esc(e.registration||'—')+' · '+esc(e.capacity)+' passenger seats</p>'+
    (e.description?'<p class="hint">'+esc(e.description)+'</p>':'')+'</div>'+
    (isCoord()?'<button class="ghost sm" data-act="edit-equipment" data-id="'+esc(e.id)+'">Edit details</button>':'')+
    '</section>'+
    transportHeader('Appointments / Trips',isCoord()?'<button class="primary" data-act="new-trip" data-equipment="'+esc(e.id)+'">Add appointment</button>':'')+
    (rows?'<div class="scroll"><table class="equipment-appointments-table"><thead><tr><th>Date</th><th>Time</th><th>Appointment</th><th>Employee</th><th>Clients</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>':
      '<div class="empty">No appointments for this equipment yet.</div>');
 }
 const equipment=[...transport.equipment].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true}));
 const rows=equipment.map(e=>{
  const href='./equipment.html?id='+encodeURIComponent(e.id);
  const assigned=transport.trips.filter(t=>t.equipment_id===e.id);
  return '<tr class="record-row" role="link" tabindex="0" data-row-href="'+href+'" aria-label="Open '+esc(e.name)+' equipment">'+
    '<td>'+equipmentIdentity(e)+'</td>'+
    '<td>'+esc(e.registration||'—')+'</td>'+
    '<td>'+esc(e.capacity)+'</td>'+
    '<td>'+assigned.length+'</td>'+
    '<td class="act"><a class="ghost sm" href="'+href+'">Open</a></td></tr>';
 }).join('');
 return transportHeader('Equipment',isCoord()?'<button class="primary" data-act="new-equipment">Add equipment</button>':'')+
  '<p class="hint equipment-directory-hint">Select equipment to view its profile, employee assignments, passengers and appointments.</p>'+
  (rows?'<div class="scroll"><table class="equipment-directory-table"><thead><tr><th>Equipment</th><th>Registration</th><th>Seats</th><th>Appointments</th><th></th></tr></thead><tbody>'+rows+'</tbody></table></div>':
    '<div class="empty">No equipment yet. Select Add equipment to get started.</div>');
}

function viewEmployees(){
 return transportHeader('Employees / Drivers','<button class="primary" data-act="new-employee">Add employee</button>')+
 '<div class="scroll"><table><thead><tr><th>Employee</th><th>Phone</th><th>Email</th><th>Assigned trips</th><th></th></tr></thead><tbody>'+transport.employees.map(e=>'<tr><td><strong>'+esc(e.full_name)+'</strong></td><td>'+esc(e.phone||'—')+'</td><td>'+esc(e.email||'—')+'</td><td>'+transport.trips.filter(t=>t.employee_id===e.id).length+'</td><td><button class="ghost sm" data-act="edit-employee" data-id="'+esc(e.id)+'">Edit</button></td></tr>').join('')+'</tbody></table></div>';
}
function viewTransportAppointment(){
 const id=new URLSearchParams(location.search).get('id'),t=transport.trips.find(t=>t.id===id);
 if(!t)return transportHeader('Appointment not found','<a class="ghost sm" href="./equipment.html">Equipment</a>');
 return transportHeader(t.title,'<button class="primary" data-act="edit-trip" data-id="'+esc(t.id)+'">Edit appointment</button>')+
 '<div class="card"><p><strong>Date:</strong> '+esc(t.trip_date)+' · <strong>Time:</strong> '+esc(t.trip_time?.slice(0,5)||'Not set')+'</p><p><strong>Equipment:</strong> <a href="./equipment.html?id='+encodeURIComponent(t.equipment_id)+'">'+esc(equipmentName(t.equipment_id))+'</a></p><p><strong>Driver:</strong> '+transportEmployeeLink(t.employee_id)+'</p><p><strong>Clients / Passengers:</strong></p><ul>'+tripClients(t.id).map(c=>'<li><a href="./client.html?id='+encodeURIComponent(c.id)+'">'+esc(c.full_name)+'</a> · '+transportPassengerLabel(t,c).split(' → ').slice(1).join(' → ')+'</li>').join('')+'</ul><p>'+esc(t.notes||'')+'</p></div>';
}
async function transportSave(table,payload,id){
 const query=id?sb.from(table).update(payload).eq('id',id).select():sb.from(table).insert(payload).select();
 const {data,error}=await query;if(error||!data?.length){toast(error?.message||'Save failed',true);return null;}
 await loadAll();render();toast('Saved.');return data[0];
}

function editEquipment(id){
 const e=transport.equipment.find(e=>e.id===id);
 if(!isCoord())return toast('Only authorised staff can manage equipment.',true);
 const selected=EQUIPMENT_IMAGE_STYLES.includes(e?.image_style)?e.image_style:'van-1';
 const imageOptions=EQUIPMENT_IMAGE_STYLES.map((value,index)=>
   '<label class="employee-avatar-option"><input type="radio" name="image_style" value="'+value+'"'+(selected===value?' checked':'')+'>'+
   '<img src="./assets/'+value+'.svg" alt="Equipment picture '+(index+1)+'"><span>Picture '+(index+1)+'</span></label>').join('');
 openDlg(e?'Edit equipment':'Add equipment',
 '<div><h3>Equipment picture</h3><p class="hint">Choose a picture for the equipment list and profile.</p><div class="employee-avatar-options">'+imageOptions+'</div></div>'+
 '<label>Name<input name="name" required maxlength="150" value="'+esc(e?.name||'')+'"></label>'+
 '<label>Registration<input name="registration" maxlength="40" value="'+esc(e?.registration||'')+'"></label>'+
 '<label>Passenger capacity<input name="capacity" type="number" min="1" max="100" required value="'+esc(e?.capacity||12)+'"></label>'+
 '<label>Description<textarea name="description">'+esc(e?.description||'')+'</textarea></label>',
 async f=>!!(await transportSave('provider_equipment',{
   name:String(f.name||'').trim(),registration:String(f.registration||'').trim(),
   capacity:Number(f.capacity),description:String(f.description||'').trim(),
   image_style:EQUIPMENT_IMAGE_STYLES.includes(f.image_style)?f.image_style:'van-1'
 },id)));
}

function editEmployee(id){
 const e=transport.employees.find(e=>e.id===id);
 openDlg(e?'Edit employee':'Add employee',
 '<label>Full name<input name="full_name" required maxlength="150" value="'+esc(e?.full_name||'')+'"></label><label>Phone<input name="phone" value="'+esc(e?.phone||'')+'"></label><label>Email<input name="email" type="email" value="'+esc(e?.email||'')+'"></label><label>Notes<textarea name="notes">'+esc(e?.notes||'')+'</textarea></label>',
 async f=>!!(await transportSave('provider_employees',f,id)));
}
function editTrip(id,equipment,employee){
 const t=transport.trips.find(x=>x.id===id);const selected=t?transport.passengers.filter(x=>x.trip_id===id).map(x=>x.client_id):[];
 openDlg(t?'Edit transport assignment':'Add transport assignment',
 '<label>Transport / Destination<input name="title" required maxlength="200" value="'+esc(t?.title||'')+'"></label><label>Equipment<select name="equipment_id" required>'+equipOpts(t?.equipment_id||equipment)+'</select></label><label>Driver / Employee<select name="employee_id">'+driverOpts(t?.employee_id||employee)+'</select></label><label>Date<input name="trip_date" type="date" required value="'+esc(t?.trip_date||todayStr())+'"></label><label>Time<input name="trip_time" type="time" value="'+esc(t?.trip_time?.slice(0,5)||'09:00')+'"></label><label>Clients / Passengers</label><div class="card">'+passengerInputs(selected,t?.id)+'</div><label>Notes<textarea name="notes">'+esc(t?.notes||'')+'</textarea></label>',
 async f=>{
  const form=document.getElementById('df'),ids=[...form.querySelectorAll('[name="passenger"]:checked')].map(x=>x.value); const appointmentByClient=Object.fromEntries(ids.map(cid=>[cid,form.querySelector('[data-passenger-appointment="'+cid+'"]')?.value||null]));
  const payload={title:f.title,equipment_id:f.equipment_id,employee_id:f.employee_id||null,trip_date:f.trip_date,trip_time:f.trip_time||null,notes:f.notes};
  const capacity=transport.equipment.find(x=>x.id===f.equipment_id)?.capacity||0;
  if(ids.length>capacity){toast('Passenger count exceeds the van capacity.',true);return false;}
  if(!ids.length){toast('Choose at least one client for this transport assignment.',true);return false;}
  for(const cid of ids){const ap=D.recordAppts.find(a=>a.id===appointmentByClient[cid]);if(ap && ap.client_record_id!==cid){toast('Appointment does not belong to selected client.',true);return false;}}
  const {data,error}=await (t?sb.from('provider_trips').update(payload).eq('id',t.id).select():sb.from('provider_trips').insert(payload).select());
  if(error||!data?.length){toast(error?.message||'Cannot save trip.',true);return false;}
  const tripId=data[0].id;
  const removed=selected.filter(x=>!ids.includes(x)),added=ids.filter(x=>!selected.includes(x)); const retained=ids.filter(x=>selected.includes(x));
  if(removed.length){const {error}=await sb.from('provider_trip_clients').delete().eq('trip_id',tripId).in('client_id',removed);if(error){toast(error.message,true);return false;}}
  if(added.length){const {error}=await sb.from('provider_trip_clients').insert(added.map(client_id=>({trip_id:tripId,client_id,appointment_id:appointmentByClient[client_id]})));if(error){toast(error.message,true);return false;}}
  for(const cid of retained){const previous=appointmentForPassenger(tripId,cid)?.id||null;if(previous!==appointmentByClient[cid]){const {error}=await sb.from('provider_trip_clients').update({appointment_id:appointmentByClient[cid]}).eq('trip_id',tripId).eq('client_id',cid);if(error){toast(error.message,true);return false;}}}
  await loadAll();render();toast('Transport assignment saved.');return true;
 });
}
const transportActions={
 'new-equipment':()=>editEquipment(), 'edit-equipment':d=>editEquipment(d.id),
 'equipment-back':()=>{equipmentSelected=null;location.href='./equipment.html';},
 'new-employee':()=>editEmployee(),'edit-employee':d=>editEmployee(d.id),
 'new-trip':d=>editTrip(null,d.equipment,d.employee),'edit-trip':d=>editTrip(d.id)
};
