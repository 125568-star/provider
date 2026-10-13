/* ----- appointments ----- */
function apptTable(list){
  if (!list.length) return '<div class="empty">Nothing here.</div>';
  return `<div class="scroll"><table><thead><tr><th>Date</th><th>Appointment</th><th>Client</th><th>Provider</th>${isCoord()?'<th></th>':''}</tr></thead><tbody>${list.map(a => `<tr><td>${esc(fmtDate(a.appt_date))}</td><td><strong>${esc(a.title)}</strong></td><td>${esc(nameOf(a.client_id))}</td><td>${esc(compName(a.company_id))}</td>${isCoord()?`<td class="act"><button class="ghost sm" data-act="edit-appt" data-id="${esc(a.id)}">Edit</button> <button class="ghost sm danger" data-act="del-appt" data-id="${esc(a.id)}">Delete</button></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function viewAppts(){
  const all = myAppts(), t = todayStr();
  const up = all.filter(a => (a.appt_date || '') >= t), past = all.filter(a => (a.appt_date || '') < t).reverse();
  return `<div class="bar"><h2>Appointments</h2>${isCoord() ? '<button class="primary" data-act="add-appt">Add appointment</button>' : ''}${['client','family'].includes(view.role) ? '<button class="primary" data-act="add-req">Request a change</button>' : ''}</div>${apptTable(up)}${past.length ? `<h3 class="sub">Past</h3>${apptTable(past)}` : ''}`;
}

