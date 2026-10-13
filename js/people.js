/* ----- people ----- */
function viewPeople(){
  const roles = ORDER.filter(o => o !== 'admin' || me.role === 'admin');
  const body = ORDER.map(r => {
    const L = byRole(r); if (!L.length) return '';
    return `<h3 class="sub">${ROLE_PLURAL[r]}</h3><div class="scroll"><table><thead><tr><th>Name</th><th>Email</th><th>Access</th><th>Role</th><th>Linked to</th></tr></thead><tbody>${L.map(p => `<tr>
      <td>${esc(p.full_name || '—')}${['client','family'].includes(p.role) ? `<label class="check"><input type="checkbox" data-prep="${esc(p.id)}"${p.is_representative ? ' checked' : ''}> Representative</label>` : ''}</td>
      <td>${esc(p.email)}</td>
      <td>${p.approved ? '<span class="chip approved">Approved</span>' : `<button class="primary sm" data-act="approve-user" data-id="${esc(p.id)}">Approve</button>`}</td>
      <td>${p.role === 'admin' && me.role !== 'admin' ? 'Admin' : `<select data-prole="${esc(p.id)}" aria-label="Role">${roles.map(o => `<option value="${o}"${o === p.role ? ' selected' : ''}>${ROLE_LABEL[o]}</option>`).join('')}</select>`}</td>
      <td>${p.role === 'family' ? `<select data-plink="${esc(p.id)}" aria-label="Linked client">${opts(byRole('client'), 'id', pname, 'No client', p.linked_client)}</select>` : ['provider_staff','provider_company'].includes(p.role) ? `<select data-pcomp="${esc(p.id)}" aria-label="Company">${opts(D.companies, 'id', c => c.name, 'No company', p.company_id)}</select>` : '—'}</td></tr>`).join('')}</tbody></table></div>`;
  }).join('');
  return `<div class="bar"><h2>People</h2></div>${body || '<div class="empty">No people yet.</div>'}`;
}

