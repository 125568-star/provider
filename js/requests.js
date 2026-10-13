/* ----- requests ----- */
function reqSummary(r){
  const ap = D.appts.find(a => a.id === r.appointment_id), nm = ap ? ap.title : 'appointment';
  if (r.action === 'add') return `Add: ${r.title} on ${fmtDate(r.appt_date)}`;
  if (r.action === 'edit') return `Change "${nm}" to: ${r.title} on ${fmtDate(r.appt_date)}`;
  return `Remove "${nm}"${ap ? ' on ' + fmtDate(ap.appt_date) : ''}`;
}
function viewReqs(){
  const ids = myClientIds();
  let list = isCoord() ? D.reqs : D.reqs.filter(r => r.requested_by === view.id || ids.includes(r.client_id));
  list = [...list].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return `<div class="bar"><h2>Requests</h2>${['client','family'].includes(view.role) ? '<button class="primary" data-act="add-req">New request</button>' : ''}</div>${!list.length ? '<div class="empty">No requests yet.</div>' : `<div class="scroll"><table><thead><tr><th>Sent</th><th>Request</th><th>Client</th><th>From</th><th>Status</th>${isCoord()?'<th></th>':''}</tr></thead><tbody>${list.map(r => `<tr><td>${esc(r.created_at ? new Date(r.created_at).toLocaleDateString() : '')}</td><td>${esc(reqSummary(r))}${r.note ? `<small>${esc(r.note)}</small>` : ''}</td><td>${esc(nameOf(r.client_id))}</td><td>${esc(r.requester_name || nameOf(r.requested_by))}<small>${esc(ROLE_LABEL[r.requester_role] || '')}</small></td><td><span class="chip ${esc(r.status)}">${esc(r.status)}</span>${r.review_note ? `<small>${esc(r.review_note)}</small>` : ''}</td>${isCoord() ? `<td class="act">${r.status === 'pending' ? `<button class="primary sm" data-act="review" data-id="${esc(r.id)}">Review</button>` : ''}</td>` : ''}</tr>`).join('')}</tbody></table></div>`}`;
}

