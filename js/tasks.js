
/* Task management. Separate database for each website. */
let taskFilter = 'all';
let taskStaff = [];
let taskStaffLoaded = false;
const taskIsProvider = SUPABASE_URL.includes('fudujpxplvlrcwtdcaas');
async function loadTaskStaff(){
 if(!taskIsProvider) return D.profiles.filter(p=>['coordinator','provider_staff','provider_company','admin'].includes(p.role));
 if(taskStaffLoaded) return taskStaff;
 const {data,error}=await sb.from('provider_employees').select('id,full_name').order('full_name');
 if(error) {toast('Unable to load employees: '+error.message,true);return [];}
 taskStaff=data||[];taskStaffLoaded=true;return taskStaff;
}
function taskStaffName(id){
 if(!id) return '—';
 const person=taskIsProvider?taskStaff.find(x=>x.id===id):D.profiles.find(x=>x.id===id);
 return person ? (person.full_name||person.email||'Unnamed employee') : 'Unassigned / unavailable';
}
function viewTasks(){
 if(taskIsProvider&&!taskStaffLoaded) loadTaskStaff().then(()=>{if(taskStaffLoaded&&tab==='tasks')render();});
 const all=D.tasks||[];
 const filtered=all.filter(t=>taskFilter==='all'||t.status===taskFilter);
 const ordered=[...filtered].sort((a,b)=>(a.status==='done')-(b.status==='done') || (a.due_date||'9999').localeCompare(b.due_date||'9999') || (b.created_at||'').localeCompare(a.created_at||''));
 const count=s=>all.filter(t=>t.status===s).length;
 return `<div class="card">
 <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h2>Tasks</h2><p class="hint">Create, assign and track work for clients and employees.</p></div><button class="primary" type="button" data-act="add-task">+ New task</button></div>
 <div style="display:flex;flex-wrap:wrap;gap:8px;margin:16px 0">
 ${[['all','All ('+all.length+')'],['todo','To do ('+count('todo')+')'],['in_progress','In progress ('+count('in_progress')+')'],['done','Done ('+count('done')+')']].map(([v,l])=>`<button type="button" class="${taskFilter===v?'primary':'ghost'}" data-act="filter-task" data-filter="${v}">${l}</button>`).join('')}
 </div>
 ${ordered.length?`<div style="overflow-x:auto"><table style="width:100%"><thead><tr><th>Task</th><th>Client</th><th>Employee</th><th>Due</th><th>Status</th><th>Priority</th><th>Actions</th></tr></thead><tbody>
 ${ordered.map(t=>`<tr><td><strong>${esc(t.title)}</strong>${t.description?`<div class="hint">${esc(t.description)}</div>`:''}</td><td>${esc(D.clientRecords.find(c=>c.id===t.client_id)?.full_name||'—')}</td><td>${esc(taskStaffName(t.employee_id))}</td><td>${t.due_date?esc(fmtDate(t.due_date)):'—'}</td><td>${esc({todo:'To do',in_progress:'In progress',done:'Done'}[t.status]||t.status)}</td><td>${esc(t.priority)}</td><td><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="ghost sm" data-act="edit-task" data-id="${esc(t.id)}">Edit</button>${t.status!=='done'?`<button type="button" class="ghost sm" data-act="done-task" data-id="${esc(t.id)}">Done</button>`:''}<button type="button" class="ghost sm" data-act="delete-task" data-id="${esc(t.id)}">Delete</button></div></td></tr>`).join('')}
 </tbody></table></div>`:'<p class="hint">No tasks in this view. Select New task to create one.</p>'}
 </div>`;
}
async function taskEditor(t){
 const people=await loadTaskStaff();
 const html=`
 <label>Task title<input name="title" required maxlength="200" value="${esc(t?.title||'')}"></label>
 <label>Description<textarea name="description" rows="3" maxlength="3000">${esc(t?.description||'')}</textarea></label>
 <label>Client<select name="client_id">${opts(D.clientRecords,'id',c=>c.full_name,'No client',t?.client_id)}</select></label>
 <label>Employee<select name="employee_id">${opts(people,'id',p=>p.full_name||p.email||'Unknown','Unassigned',t?.employee_id)}</select></label>
 <label>Due date<input name="due_date" type="date" value="${esc(t?.due_date||'')}"></label>
 <label>Status<select name="status">${[['todo','To do'],['in_progress','In progress'],['done','Done']].map(([v,l])=>`<option value="${v}"${(t?.status||'todo')===v?' selected':''}>${l}</option>`).join('')}</select></label>
 <label>Priority<select name="priority">${['low','normal','high'].map(v=>`<option value="${v}"${(t?.priority||'normal')===v?' selected':''}>${v}</option>`).join('')}</select></label>`;
 openDlg(t?'Edit task':'New task',html,async f=>{
 const changes={title:String(f.title||'').trim(),description:String(f.description||'').trim(),client_id:nul(f.client_id),employee_id:nul(f.employee_id),due_date:nul(f.due_date),status:f.status,priority:f.priority,updated_at:new Date().toISOString()};
 if(!changes.title){toast('Enter a task title.',true);return false;}
 const q=t?sb.from('work_tasks').update(changes).eq('id',t.id).select():sb.from('work_tasks').insert({...changes,created_by:me.id}).select();
 return run(q,t?'Task updated.':'Task created.');
 });
}
ACT['add-task']=()=>taskEditor(null);
ACT['edit-task']=d=>{const t=D.tasks.find(x=>x.id===d.id);if(t)taskEditor(t);};
ACT['done-task']=d=>run(sb.from('work_tasks').update({status:'done',updated_at:new Date().toISOString()}).eq('id',d.id).select(),'Task completed.');
ACT['delete-task']=d=>{if(confirm('Delete this task permanently?'))return run(sb.from('work_tasks').delete().eq('id',d.id).select(),'Task deleted.');};
ACT['filter-task']=d=>{taskFilter=d.filter;render();};
