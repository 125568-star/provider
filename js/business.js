/* Generic business management: client notes and invoice register. */
let businessSection = 'notes';
let businessClientFilter = '';
let businessInvoiceFilter = 'all';
const BUSINESS_NOTE_TYPES = [['general','General'],['meeting','Meeting'],['service','Service'],['follow_up','Follow-up']];
const BUSINESS_INVOICE_STATUS = [['draft','Draft'],['sent','Sent'],['paid','Paid'],['void','Void']];
function businessClientName(id){ return D.clientRecords.find(c=>c.id===id)?.full_name || '—'; }
function businessCash(n){return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(Number(n)||0);}
function businessTotal(i){return Math.round((Number(i.quantity)*Number(i.unit_price))*(1+Number(i.gst_percent)/100)*100)/100;}
function businessInvoiceNum(i){return 'INV-'+String(i.invoice_number).padStart(5,'0');}
function businessLabel(choices,v){return choices.find(x=>x[0]===v)?.[1]||v;}
function businessSelect(choices,selected){return choices.map(x=>'<option value="'+esc(x[0])+'"'+(x[0]===selected?' selected':'')+'>'+esc(x[1])+'</option>').join('');}
function viewBusiness(){
 const notes= D.businessNotes||[], invoices=D.businessInvoices||[];
 const body=businessSection==='notes'?businessNotesView():businessInvoicesView();
 return '<div class="card"><div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px"><div><h2>Business</h2><p class="hint">Client-linked notes and a simple invoice register.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">'+
 '<button type="button" class="'+(businessSection==='notes'?'primary':'ghost')+'" data-act="business-section" data-section="notes">Notes ('+notes.length+')</button>'+
 '<button type="button" class="'+(businessSection==='invoices'?'primary':'ghost')+'" data-act="business-section" data-section="invoices">Invoices ('+invoices.length+')</button></div></div>'+
 '<div style="margin-top:18px">'+body+'</div></div>';
}
function businessNotesView(){
 const all=D.businessNotes||[];
 const ordered=all.filter(n=>!businessClientFilter||n.client_id===businessClientFilter).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 const clientOptions='<option value="">All clients</option>'+opts(D.clientRecords,'id',c=>c.full_name,null,businessClientFilter);
 return '<div class="bar"><div><h3>Client notes</h3><p class="hint">Keep a dated history of meetings, service updates and follow-ups.</p></div><button class="primary" data-act="business-add-note" type="button">+ New note</button></div>'+
 '<label style="display:block;max-width:340px;margin:10px 0">Filter by client<select data-business-client-filter>'+clientOptions+'</select></label>'+
 (ordered.length?'<div class="scroll"><table><thead><tr><th>Date</th><th>Client</th><th>Note</th><th>Type</th><th>Actions</th></tr></thead><tbody>'+
 ordered.map(n=>'<tr><td>'+esc(new Date(n.created_at).toLocaleDateString('en-AU'))+'</td><td>'+esc(businessClientName(n.client_id))+'</td><td><strong>'+esc(n.title)+'</strong>'+
 (n.body?'<div style="white-space:pre-wrap;max-width:500px">'+esc(n.body)+'</div>':'')+'</td><td>'+esc(businessLabel(BUSINESS_NOTE_TYPES,n.category))+'</td>'+
 '<td><div style="display:flex;gap:6px"><button type="button" class="ghost sm" data-act="business-edit-note" data-id="'+esc(n.id)+'">Edit</button>'+
 '<button type="button" class="ghost sm" data-act="business-delete-note" data-id="'+esc(n.id)+'">Delete</button></div></td></tr>').join('')+
 '</tbody></table></div>':'<div class="empty">No notes yet for this selection.</div>');
}
function businessNoteEditor(n){
 if(!D.clientRecords.length){toast('Add a client first.',true);return;}
 const body='<label>Client<select name="client_id" required>'+opts(D.clientRecords,'id',c=>c.full_name,'Choose client',n?.client_id||businessClientFilter)+'</select></label>'+
 '<label>Title<input name="title" required maxlength="160" value="'+esc(n?.title||'')+'"></label>'+
 '<label>Type<select name="category">'+businessSelect(BUSINESS_NOTE_TYPES,n?.category||'general')+'</select></label>'+
 '<label>Details<textarea name="body" rows="6" maxlength="10000">'+esc(n?.body||'')+'</textarea></label>';
 openDlg(n?'Edit note':'New note',body,async f=>{
  const title=String(f.title||'').trim();
  if(!title||!D.clientRecords.some(c=>c.id===f.client_id)){toast('Choose a client and enter a title.',true);return false;}
  const payload={client_id:f.client_id,title:title,category:f.category,body:String(f.body||''),updated_at:new Date().toISOString()};
  const q=n?sb.from('business_notes').update(payload).eq('id',n.id).select():sb.from('business_notes').insert({...payload,created_by:me.id}).select();
  return run(q,n?'Note updated.':'Note saved.');
 });
}
function businessInvoicesView(){
 const all=D.businessInvoices||[];
 const ordered=all.filter(i=>businessInvoiceFilter==='all'||i.status===businessInvoiceFilter).sort((a,b)=>String(b.issue_date).localeCompare(String(a.issue_date))||Number(b.invoice_number)-Number(a.invoice_number));
 const outstanding=all.filter(i=>i.status==='sent').reduce((sum,i)=>sum+businessTotal(i),0);
 return '<div class="bar"><div><h3>Invoices</h3><p class="hint">Track invoices, due dates and payment status. Marking paid does not process a payment.</p></div><button class="primary" type="button" data-act="business-add-invoice">+ New invoice</button></div>'+
 '<p class="hint">Sent invoices not marked paid: <strong>'+businessCash(outstanding)+'</strong></p>'+
 '<label style="display:block;max-width:300px;margin:10px 0">Filter by status<select data-business-invoice-filter><option value="all">All</option>'+businessSelect(BUSINESS_INVOICE_STATUS,businessInvoiceFilter)+'</select></label>'+
 (ordered.length?'<div class="scroll"><table><thead><tr><th>Number</th><th>Bill to</th><th>Description</th><th>Issued</th><th>Due</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
 ordered.map(i=>'<tr><td><strong>'+esc(businessInvoiceNum(i))+'</strong></td><td>'+esc(i.bill_to_name)+'</td><td>'+esc(i.description)+'</td><td>'+esc(fmtDate(i.issue_date))+'</td><td>'+esc(fmtDate(i.due_date))+'</td>'+
 '<td>'+esc(businessCash(businessTotal(i)))+'</td><td>'+esc(businessLabel(BUSINESS_INVOICE_STATUS,i.status))+'</td>'+
 '<td><div style="display:flex;gap:6px"><button type="button" class="ghost sm" data-act="business-edit-invoice" data-id="'+esc(i.id)+'">Edit</button>'+
 '<button type="button" class="ghost sm" data-act="business-delete-invoice" data-id="'+esc(i.id)+'">Delete</button></div></td></tr>').join('')+
 '</tbody></table></div>':'<div class="empty">No invoices in this view.</div>');
}
function businessInvoiceEditor(i){
 const clientOpts='<option value="">Not linked</option>'+opts(D.clientRecords,'id',c=>c.full_name,null,i?.client_id);
 const body='<p class="hint">An invoice entry is for tracking purposes. It does not send an invoice or take payment.</p>'+
 '<label>Client (optional)<select name="client_id" data-business-invoice-client>'+clientOpts+'</select></label>'+
 '<label>Bill to<input name="bill_to_name" required maxlength="200" value="'+esc(i?.bill_to_name||'')+'"></label>'+
 '<label>Description<input name="description" required maxlength="1000" value="'+esc(i?.description||'')+'"></label>'+
 '<label>Quantity<input name="quantity" type="number" min="0.01" step="0.01" required value="'+esc(i?.quantity??1)+'"></label>'+
 '<label>Unit price (AUD)<input name="unit_price" type="number" min="0" step="0.01" required value="'+esc(i?.unit_price??0)+'"></label>'+
 '<label>GST rate<select name="gst_percent"><option value="0"'+(Number(i?.gst_percent||0)===0?' selected':'')+'>0%</option><option value="10"'+(Number(i?.gst_percent||0)===10?' selected':'')+'>10%</option></select></label>'+
 '<label>Issue date<input name="issue_date" type="date" required value="'+esc(i?.issue_date||todayStr())+'"></label>'+
 '<label>Due date<input name="due_date" type="date" value="'+esc(i?.due_date||'')+'"></label>'+
 '<label>Status<select name="status">'+businessSelect(BUSINESS_INVOICE_STATUS,i?.status||'draft')+'</select></label>'+
 '<label>Internal notes<textarea name="notes" rows="3" maxlength="3000">'+esc(i?.notes||'')+'</textarea></label>';
 openDlg(i?'Edit '+businessInvoiceNum(i):'New invoice entry',body,async f=>{
  const q=Number(f.quantity), price=Number(f.unit_price), tax=Number(f.gst_percent);
  if(!String(f.bill_to_name||'').trim()||!String(f.description||'').trim()||!Number.isFinite(q)||q<=0||q>100000||!Number.isFinite(price)||price<0||![0,10].includes(tax)){toast('Check the invoice fields.',true);return false;}
  const payload={client_id:nul(f.client_id),bill_to_name:String(f.bill_to_name).trim(),description:String(f.description).trim(),quantity:q,unit_price:price,gst_percent:tax,issue_date:f.issue_date,due_date:nul(f.due_date),status:f.status,notes:String(f.notes||''),updated_at:new Date().toISOString()};
  const query=i?sb.from('business_invoices').update(payload).eq('id',i.id).select():sb.from('business_invoices').insert({...payload,created_by:me.id}).select();
  return run(query,i?'Invoice entry updated.':'Invoice entry created.');
 });
}
ACT['business-section']=d=>{businessSection=d.section==='invoices'?'invoices':'notes';render();};
ACT['business-add-note']=()=>businessNoteEditor(null);
ACT['business-edit-note']=d=>{const n=D.businessNotes.find(x=>x.id===d.id);if(n)businessNoteEditor(n);};
ACT['business-delete-note']=d=>{const n=D.businessNotes.find(x=>x.id===d.id);if(n&&confirm('Delete this note permanently?'))return run(sb.from('business_notes').delete().eq('id',n.id).select(),'Note deleted.');};
ACT['business-add-invoice']=()=>businessInvoiceEditor(null);
ACT['business-edit-invoice']=d=>{const i=D.businessInvoices.find(x=>x.id===d.id);if(i)businessInvoiceEditor(i);};
ACT['business-delete-invoice']=d=>{const i=D.businessInvoices.find(x=>x.id===d.id);if(i&&confirm('Delete '+businessInvoiceNum(i)+' permanently?'))return run(sb.from('business_invoices').delete().eq('id',i.id).select(),'Invoice entry deleted.');};
document.addEventListener('change',e=>{
 const t=e.target;
 if(t.matches('[data-business-client-filter]')){businessClientFilter=t.value;render();}
 else if(t.matches('[data-business-invoice-filter]')){businessInvoiceFilter=t.value;render();}
 else if(t.matches('[data-business-invoice-client]')){
   const input=t.form?.querySelector('[name="bill_to_name"]');
   const c=D.clientRecords.find(c=>c.id===t.value);
   if(input&&c&&!input.value.trim())input.value=c.full_name;
 }
});
