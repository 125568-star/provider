/* ----- companies ----- */
function viewCompanies(){
  return `<div class="bar"><h2>Provider companies</h2><button class="primary" data-act="add-comp">Add company</button></div>${!D.companies.length ? '<div class="empty">No companies yet.</div>' : `<div class="scroll"><table><thead><tr><th>Name</th><th>Staff</th><th></th></tr></thead><tbody>${D.companies.map(c => `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(D.profiles.filter(p => p.company_id === c.id).map(pname).join(', ') || '—')}</td><td class="act"><button class="ghost sm danger" data-act="del-comp" data-id="${esc(c.id)}">Delete</button></td></tr>`).join('')}</tbody></table></div>`}`;
}

