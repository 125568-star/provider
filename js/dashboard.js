/* Brisbane & Queensland: verified 2026/27 public holidays and dated local events.
   Events are editorial entries, not a live feed. See each source for changes. */
const QLD_HOLIDAY_SOURCE = 'https://www.qld.gov.au/recreation/travel/holidays/public';
const BRISBANE_EVENTS_SOURCE = 'https://www.brisbane.qld.gov.au/events-arts-and-culture/what-s-on-in-brisbane/event-search';
const VISIT_BRISBANE_SOURCE = 'https://visit.brisbane.qld.au/en/whats-on/whats-on-this-week';
const QLD_SCHOOL_SOURCE = 'https://education.qld.gov.au/about/Pages/termDates.aspx';
const qldHolidays = {
  2026: [
    ['01-01',"New Year's Day"],['01-26','Australia Day'],['04-03','Good Friday'],
    ['04-04','Day after Good Friday'],['04-05','Easter Sunday'],['04-06','Easter Monday'],
    ['04-25','Anzac Day'],['05-04','Labour Day'],['08-12','Ekka show holiday (Brisbane only)'],
    ['10-05',"King's Birthday"],['12-24','Christmas Eve (from 6 pm)'],
    ['12-25','Christmas Day'],['12-26','Boxing Day'],['12-28','Additional Boxing Day holiday']
  ],
  2027: [
    ['01-01',"New Year's Day"],['01-26','Australia Day'],['03-26','Good Friday'],
    ['03-27','Day after Good Friday'],['03-28','Easter Sunday'],['03-29','Easter Monday'],
    ['04-26','Anzac Day holiday'],['05-03','Labour Day'],['08-11','Ekka show holiday (Brisbane only)'],
    ['10-04',"King's Birthday"],['12-24','Christmas Eve (from 6 pm)'],
    ['12-25','Christmas Day'],['12-27','Additional Christmas Day holiday'],
    ['12-26','Boxing Day'],['12-28','Additional Boxing Day holiday']
  ]
};
const brisbaneSpecialEvents = [
  {date:'2026-10-06',title:'Queensland state schools — Term 4 begins',category:'School calendar',
    detail:'State school students return after the September holidays.',
    url:QLD_SCHOOL_SOURCE},
  {date:'2026-10-13',title:'Zara Larsson — Riverstage',category:'Brisbane event',
    detail:'Concert at Riverstage; see Brisbane City Council for details.',
    url:'https://www.brisbane.qld.gov.au/'},
  {date:'2026-10-21',title:'Melt Festival begins',category:'Brisbane festival',
    detail:'Arts and cultural festival running from 21 October to 8 November.',
    url:VISIT_BRISBANE_SOURCE},
  {date:'2026-10-24',title:'River Pride Parade',category:'Brisbane event',
    detail:'Brisbane River parade, part of Melt Festival.',
    url:VISIT_BRISBANE_SOURCE},
  {date:'2026-11-08',title:'Melt Festival concludes',category:'Brisbane festival',
    detail:'Final day of the 2026 citywide arts festival.',
    url:VISIT_BRISBANE_SOURCE},
  {date:'2026-11-15',title:'The Lion King opens in Brisbane',category:'Brisbane event',
    detail:'Musical season scheduled through March 2027.',
    url:VISIT_BRISBANE_SOURCE}
];
const LOCATION_DEFAULT = {city:'Brisbane',state:'QLD'};
const STATE_EVENT_LINKS = {
  QLD:'https://www.qld.gov.au/recreation/travel/holidays/public',
  NSW:'https://www.nsw.gov.au/about-nsw/public-holidays',
  VIC:'https://www.vic.gov.au/victorian-public-holidays-and-daylight-saving',
  WA:'https://www.wa.gov.au/service/employment/workplace-agreements/public-holidays-western-australia',
  SA:'https://www.safework.sa.gov.au/resources/public-holidays',
  ACT:'https://www.act.gov.au/living-in-the-act/public-holidays',
  TAS:'https://worksafe.tas.gov.au/topics/laws-and-compliance/public-holidays',
  NT:'https://nt.gov.au/nt-public-holidays'
};
const CITY_EVENT_LINKS = {
  Brisbane:BRISBANE_EVENTS_SOURCE,
  Sydney:'https://whatson.cityofsydney.nsw.gov.au/',
  Melbourne:'https://whatson.melbourne.vic.gov.au/',
  Perth:'https://visitperth.com/events',
  Adelaide:'https://www.experienceadelaide.com.au/whats-on/',
  Canberra:'https://events.canberra.com.au/',
  Hobart:'https://www.hobartcity.com.au/Community/Events-and-activities',
  Darwin:'https://www.darwin.nt.gov.au/explore/whats-on'
};
const STATE_TIMEZONES = {
  QLD:'Australia/Brisbane',NSW:'Australia/Sydney',VIC:'Australia/Melbourne',
  WA:'Australia/Perth',SA:'Australia/Adelaide',ACT:'Australia/Sydney',
  TAS:'Australia/Hobart',NT:'Australia/Darwin'
};
const NSW_HOLIDAYS = {
  2026:[
    ['01-01',"New Year's Day"],['01-26','Australia Day'],['04-03','Good Friday'],
    ['04-04','Easter Saturday'],['04-05','Easter Sunday'],['04-06','Easter Monday'],
    ['04-25','Anzac Day'],['04-27','Anzac Day additional holiday'],
    ['06-08',"King's Birthday"],['10-05','Labour Day'],
    ['12-25','Christmas Day'],['12-26','Boxing Day'],['12-28','Additional Boxing Day holiday']
  ],
  2027:[
    ['01-01',"New Year's Day"],['01-26','Australia Day'],['03-26','Good Friday'],
    ['03-27','Easter Saturday'],['03-28','Easter Sunday'],['03-29','Easter Monday'],
    ['04-25','Anzac Day'],['04-26','Anzac Day additional holiday'],
    ['06-14',"King's Birthday"],['10-04','Labour Day'],
    ['12-25','Christmas Day'],['12-26','Boxing Day'],
    ['12-27','Additional Christmas Day holiday'],['12-28','Additional Boxing Day holiday']
  ]
};
const SYDNEY_EVENTS = [
 {date:'2026-10-09',title:'Sydney Craft Week begins',category:'Sydney event',
  detail:'Markets, exhibitions, workshops and open studios, 9–18 October.',
  url:'https://whatson.cityofsydney.nsw.gov.au/articles/what-to-do-in-sydney-this-october'},
 {date:'2026-10-23',title:'Art & About Oxford Street begins',category:'Sydney event',
  detail:'Free music, art and street festivities, 23–25 October.',
  url:'https://whatson.cityofsydney.nsw.gov.au/articles/what-to-do-in-sydney-this-october'},
 {date:'2026-10-29',title:'Ghost Festival at The Rocks',category:'Sydney event',
  detail:'Halloween festival in The Rocks. Check the organiser for the latest details.',
  url:'https://whatson.cityofsydney.nsw.gov.au/suburbs/sydney'}
];
let dashboardPrefs = {...LOCATION_DEFAULT};
const dashboardInitialParams = new URLSearchParams(location.search);
let dashboardTab = location.pathname.endsWith('/dashboard.html') && dashboardInitialParams.get('tab')==='clients' ? 'clients' : 'general';
let dashboardSelectedDate = location.pathname.endsWith('/dashboard.html') && /^\d{4}-\d{2}-\d{2}$/.test(dashboardInitialParams.get('date')||'') ? dashboardInitialParams.get('date') : null;
let dashboardGeneralSelectedDate = null;
let dashboardLocationEditing = false;
let dashboardPrefError = '';
async function loadDashboardPrefs(){
  const {data:sessionInfo}=await sb.auth.getSession();
  const uid=sessionInfo?.session?.user?.id;
  if(!uid) return;
  const {data,error}=await sb.from('dashboard_preferences').select('city,state').eq('user_id',uid).maybeSingle();
  dashboardPrefError=error ? 'Location settings could not be loaded.' : '';
  if(!error) dashboardPrefs=data||{...LOCATION_DEFAULT};
}
async function saveDashboardLocation(form){
  const fd=new FormData(form);
  const city=String(fd.get('city')||'').trim();
  const state=String(fd.get('state')||'');
  if(!/^[\p{L}\p{M} .'-]{2,100}$/u.test(city)||!STATE_TIMEZONES[state]){
    dashboardPrefError='Enter a valid Australian city and state.'; render(); return;
  }
  const {data:sessionInfo}=await sb.auth.getSession();
  const uid=sessionInfo?.session?.user?.id;
  if(!uid){toast('Please sign in first.',true);return;}
  const {error}=await sb.from('dashboard_preferences').upsert({user_id:uid,city,state,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error){dashboardPrefError=error.message;render();return;}
  dashboardPrefs={city,state};dashboardLocationEditing=false;dashboardPrefError='';
  render();toast('Dashboard location saved.');
}
function localToday(timeZone){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=k=>parts.find(p=>p.type===k)?.value;
  return {year:Number(get('year')),month:Number(get('month')),day:Number(get('day'))};
}
function brisbaneToday(){return localToday('Australia/Brisbane');}
function localEventsFor(year,month,location){
  const prefix=year+'-'+String(month).padStart(2,'0')+'-';
  const state=location.state,city=location.city.toLowerCase();
  const holidayList=state==='QLD'?qldHolidays[year]:state==='NSW'?NSW_HOLIDAYS[year]:null;
  const holidays=(holidayList||[]).map(([day,title])=>({
    date:year+'-'+day,title,category:'Public holiday',
    detail:state==='QLD'&&title.includes('Ekka')?'Brisbane area only':state+' public holiday',
    url:STATE_EVENT_LINKS[state]
  })).filter(e=>!e.title.includes('Ekka')||city==='brisbane');
  const local=state==='QLD'&&city==='brisbane'?brisbaneSpecialEvents:
      state==='NSW'&&city==='sydney'?SYDNEY_EVENTS:[];
  return [...holidays,...local].filter(e=>e.date.startsWith(prefix)).sort((a,b)=>a.date.localeCompare(b.date));
}
function brisbaneEventsFor(year,month){return localEventsFor(year,month,LOCATION_DEFAULT);}
function dashboardCalendarDays(year,month,events,today,selectedDate){
  const starts=(new Date(Date.UTC(year,month-1,1)).getUTCDay()+6)%7;
  const days=new Date(Date.UTC(year,month,0)).getUTCDate();
  const counts=new Map();
  events.forEach(e=>counts.set(e.date,(counts.get(e.date)||0)+1));
  let out='<div class="dash-month-grid" aria-label="Monthly events calendar">';
  for(const d of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])out+='<span class="dash-weekday">'+d+'</span>';
  for(let n=0;n<starts;n++)out+='<span aria-hidden="true"></span>';
  for(let n=1;n<=days;n++){
    const iso=year+'-'+String(month).padStart(2,'0')+'-'+String(n).padStart(2,'0');
    const count=counts.get(iso)||0;
    const isToday=year===today.year&&month===today.month&&n===today.day;
    const selected=iso===selectedDate;
    const label=new Intl.DateTimeFormat('en-AU',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
      .format(new Date(iso+'T12:00:00Z'));
    out+='<button type="button" data-dash-general-date="'+iso+'" class="dash-day dash-calendar-button'+
      (count?' dash-has-event':'')+(isToday?' dash-today':'')+(selected?' dash-day-selected':'')+'"'+
      (isToday?' aria-current="date"':'')+' aria-pressed="'+selected+'"'+
      ' aria-label="'+esc(label+', '+count+' event'+(count===1?'':'s'))+'">'+n+
      (count?'<i aria-hidden="true"></i>':'')+'</button>';
  }
  return out+'</div>';
}
function dashboardEventList(events,today,selectedDate){
  return events.length?events.map(e=>{
    const day=Number(e.date.slice(-2));
    const dow=new Intl.DateTimeFormat('en-AU',{weekday:'short',timeZone:'UTC'}).format(new Date(e.date+'T12:00:00Z'));
    const past=e.date.slice(0,7)===(today.year+'-'+String(today.month).padStart(2,'0')) && day<today.day;
    return '<li class="dash-event'+(past?' dash-past':'')+'"><div class="dash-date"><strong>'+day+'</strong><small>'+dow+'</small></div>'+
      '<div class="dash-event-text"><span class="dash-category">'+esc(e.category)+'</span><strong>'+esc(e.title)+
      '</strong><p>'+esc(e.detail)+'</p><a href="'+esc(e.url)+'">More information ↗</a></div></li>';
  }).join(''):'<li class="dash-no-events">'+
    (selectedDate?'No listed events for this date. Check the official event listings for more.':
      'No curated local events for this month. Check the official listings below.')+'</li>';
}
function dashboardClientEvents(year,month){
  const prefix=year+'-'+String(month).padStart(2,'0')+'-';
  const today=localToday(STATE_TIMEZONES[dashboardPrefs.state]||'Australia/Brisbane');
  const appointments=(typeof myAppts==='function'?myAppts():[]).filter(a=>(a.appt_date||'').startsWith(prefix)).map(a=>({
    date:a.appt_date,title:a.title,category:'Client appointment',
    detail:'Client: '+nameOf(a.client_id),url:'./calendar.html'
  }));
  const directoryAppointments=(D.recordAppts||[]).filter(a=>(a.appt_date||'').startsWith(prefix)).map(a=>({
    date:a.appt_date,title:a.title,category:'Client appointment',
    detail:'Client: '+((D.clientRecords||[]).find(c=>c.id===a.client_record_id)?.full_name||'Client'),
    url:'./client.html?id='+encodeURIComponent(a.client_record_id)
  }));
  const birthdays=(D.clientRecords||[]).filter(c=>c.date_of_birth?.slice(5,7)===prefix.slice(5,7)).map(c=>({
    date:prefix+c.date_of_birth.slice(8,10),title:c.full_name+' — birthday',
    category:'Client birthday',detail:'From the client directory',url:'./clients.html'
  }));
  return [...appointments,...directoryAppointments,...birthdays].sort((a,b)=>a.date.localeCompare(b.date));
}

/* The Clients tab uses a Monday–Sunday agenda, not the General tab's monthly calendar. */
function dashboardWeeklyClients(today){
  const base=new Date(Date.UTC(today.year,today.month-1,today.day));
  const monday=new Date(base.getTime()-((base.getUTCDay()+6)%7)*86400000);
  const days=Array.from({length:7},(_,i)=>new Date(monday.getTime()+i*86400000));
  const iso=d=>d.toISOString().slice(0,10);
  const start=iso(days[0]),end=iso(days[6]),current=iso(base);
  // Keep selection when switching tabs, but reset it when a new week begins.
  if (!dashboardSelectedDate || dashboardSelectedDate<start || dashboardSelectedDate>end) dashboardSelectedDate=current;
  const dateLabel=d=>new Intl.DateTimeFormat('en-AU',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(d);
  const shortDate=date=>new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z'));
  const weekday=d=>new Intl.DateTimeFormat('en-AU',{weekday:'short',timeZone:'UTC'}).format(d);
  const formatTime=value=>{
    if(!value)return 'Time not set';
    const [hh,mm]=value.split(':').map(Number);
    return (hh%12||12)+':'+String(mm).padStart(2,'0')+(hh>=12?' pm':' am');
  };
  const directory=(D.recordAppts||[]).filter(a=>a.appt_date>=start&&a.appt_date<=end).map(a=>{
    const client=(D.clientRecords||[]).find(c=>c.id===a.client_record_id);
    return {...a,clientName:client?.full_name||'Client',client,link:'./appointment.html?kind=record&id='+encodeURIComponent(a.id)};
  });
  const loginClients=(typeof myAppts==='function'?myAppts():[]).filter(a=>a.appt_date>=start&&a.appt_date<=end).map(a=>({
    ...a,clientName:nameOf(a.client_id),client:null,appt_time:null,link:'./appointment.html?kind=account&id='+encodeURIComponent(a.id),is_example:false
  }));
  const appointments=[...directory,...loginClients].sort((a,b)=>
    a.appt_date.localeCompare(b.appt_date)||
    String(a.appt_time||'').localeCompare(String(b.appt_time||''))||
    a.clientName.localeCompare(b.clientName)
  );
  const weekCells=days.map(d=>{
    const day=iso(d),count=appointments.filter(a=>a.appt_date===day).length;
    const isToday=day===current,isSelected=day===dashboardSelectedDate;
    return '<button type="button" data-dash-client-date="'+day+'" class="client-week-day dash-selectable-day'+
      (isToday?' client-week-today':'')+(isSelected?' dash-day-selected':'')+'"'+
      (isToday?' aria-current="date"':'')+' aria-pressed="'+isSelected+'" aria-label="'+weekday(d)+' '+dateLabel(d)+', '+count+' appointments">'+
      '<small>'+weekday(d)+'</small><strong>'+d.getUTCDate()+'</strong>'+
      '<span class="client-week-count">'+(count?count+' appt'+(count===1?'':'s'):'—')+'</span></button>';
  }).join('');
  const selectedAppointments=appointments.filter(a=>a.appt_date===dashboardSelectedDate);
  const rows=selectedAppointments.map(a=>{
    const avatar=a.client&&typeof clientAvatar==='function'?clientAvatar(a.client):
      '<span class="client-avatar client-initials" aria-hidden="true">'+esc(a.clientName.slice(0,1))+'</span>';
    const time=formatTime(a.appt_time);
    return '<tr class="dash-appointment-row" role="link" tabindex="0" data-dash-appointment-href="'+esc(a.link)+'"'+
      ' aria-label="Open '+esc(a.title)+' for '+esc(a.clientName)+', '+esc(time)+'">'+
      '<td><span class="dash-appointment-client">'+avatar+'<strong>'+esc(a.clientName)+'</strong></span></td>'+
      '<td><strong class="dash-appointment-title">'+esc(a.title)+'</strong>'+
        (a.is_example?'<span class="dash-appointment-example">Example</span>':'')+'</td>'+
      '<td class="dash-appointment-time">'+esc(time)+'</td></tr>';
  }).join('');
  return '<div class="dash-weekly-clients" role="tabpanel">'+
    '<div class="client-week-heading"><div><h3>This week</h3><p class="hint">'+
      esc(dateLabel(days[0]))+' – '+esc(dateLabel(days[6]))+'</p></div>'+
    '<span class="chip approved">Today: '+esc(shortDate(current))+'</span></div>'+
    '<div class="client-week-grid" aria-label="Current week">'+weekCells+'</div>'+
    '<div class="client-appointments-heading"><h3>Appointments — '+esc(shortDate(dashboardSelectedDate))+'</h3>'+
      '<span class="chip approved">'+selectedAppointments.length+' appointment'+(selectedAppointments.length===1?'':'s')+'</span></div>'+
    (selectedAppointments.length?'<div class="scroll"><table class="client-appointments-table dash-all-clients-table">'+
      '<thead><tr><th>Client</th><th>Appointment</th><th>Time</th></tr></thead>'+
      '<tbody>'+rows+'</tbody></table></div>':'<div class="empty">No appointments for this day.</div>')+
    '</div>';
}

function viewDashboard(){
  const location=dashboardPrefs||LOCATION_DEFAULT;
  const timezone=STATE_TIMEZONES[location.state]||'Australia/Brisbane';
  const now=localToday(timezone),{year,month}=now;
  const monthName=new Intl.DateTimeFormat('en-AU',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1,12)));
  const monthPrefix=year+'-'+String(month).padStart(2,'0')+'-';
  if(dashboardGeneralSelectedDate&&!dashboardGeneralSelectedDate.startsWith(monthPrefix)) dashboardGeneralSelectedDate=null;
  const events=dashboardTab==='general'?localEventsFor(year,month,location):dashboardClientEvents(year,month);
  const shownGeneralEvents=dashboardGeneralSelectedDate?events.filter(e=>e.date===dashboardGeneralSelectedDate):events;
  const generalDayTitle=dashboardGeneralSelectedDate?
    new Intl.DateTimeFormat('en-AU',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})
      .format(new Date(dashboardGeneralSelectedDate+'T12:00:00Z')):null;
  const localSource=STATE_EVENT_LINKS[location.state];
  const citySource=CITY_EVENT_LINKS[location.city]||null;
  const generalNote=location.state==='NSW'||location.state==='QLD'
    ? 'A selection of verified public holidays and local events. This is not a live feed; always confirm with the organiser.'
    : 'Local public holiday and event dates have not been added for this state yet. Check the official listings.';
  const locTitle=location.city+', '+location.state;
  const locEditor=dashboardLocationEditing?
    '<form class="dash-location-form" id="dashboard-location-form"><label>City<input name="city" required maxlength="100" value="'+esc(location.city)+'" autocomplete="address-level2"></label>'+
    '<label>State<select name="state">'+Object.keys(STATE_TIMEZONES).map(s=>'<option value="'+s+'"'+(location.state===s?' selected':'')+'>'+s+'</option>').join('')+'</select></label>'+
    '<button class="primary sm" type="submit">Save</button><button class="ghost sm" data-dash-location-cancel type="button">Cancel</button></form>':
    '<button class="dash-location" type="button" data-dash-location-edit title="Change account location">'+esc(locTitle)+' · Change</button>';
  return '<div class="bar"><h2>Dashboard</h2></div>'+
    '<section class="dash-section" aria-labelledby="local-cal-title">'+
    '<div class="dash-heading"><div><h3 id="local-cal-title">'+esc(location.city+' & '+location.state+' — What’s On')+'</h3><p class="hint">Dates and activities for '+esc(monthName)+'</p></div>'+locEditor+'</div>'+
    (dashboardPrefError?'<p class="errbox">'+esc(dashboardPrefError)+'</p>':'')+
    '<div class="dash-inner-tabs" role="tablist" aria-label="What’s On categories">'+
    '<button type="button" role="tab" data-dash-tab="general" aria-selected="'+(dashboardTab==='general')+'">General</button>'+
    '<button type="button" role="tab" data-dash-tab="clients" aria-selected="'+(dashboardTab==='clients')+'">Clients</button></div>'+
    (dashboardTab==='clients' ? dashboardWeeklyClients(now) :
      '<div class="dash-calendar-layout" role="tabpanel"><div><h4>'+esc(monthName)+'</h4>'+
      dashboardCalendarDays(year,month,events,now,dashboardGeneralSelectedDate)+'</div><div>'+
      '<div class="dash-events-heading"><h4>'+(generalDayTitle?'Events — '+esc(generalDayTitle):'Dates to know')+'</h4>'+
      (dashboardGeneralSelectedDate?'<button class="ghost sm" type="button" data-dash-general-all-month>All month</button>':'')+
      '</div><ol class="dash-event-list">'+dashboardEventList(shownGeneralEvents,now,dashboardGeneralSelectedDate)+'</ol></div></div>')+
    (dashboardTab==='general'?'<p class="dash-source-note">'+generalNote+'</p>'+
      '<div class="dash-source-links"><a href="'+esc(localSource)+'">'+esc(location.state)+' public holidays ↗</a>'+
      (citySource?'<a href="'+esc(citySource)+'">'+esc(location.city)+' events ↗</a>':'')+'</div>'
     :'<p class="dash-source-note">All clients’ appointments for the current week. Select a client to see their full page.</p>')+
    '</section>';
}
document.addEventListener('click',e=>{
  const apptRow=e.target.closest('[data-dash-appointment-href]');
  if(apptRow){location.assign(apptRow.dataset.dashAppointmentHref);return;}
  const generalDate=e.target.closest('[data-dash-general-date]');
  if(generalDate){
    dashboardGeneralSelectedDate=generalDate.dataset.dashGeneralDate;
    render();
    document.querySelector('[data-dash-general-date="'+dashboardGeneralSelectedDate+'"]')?.focus({preventScroll:true});
    return;
  }
  if(e.target.closest('[data-dash-general-all-month]')){dashboardGeneralSelectedDate=null;render();return;}
  const dateButton=e.target.closest('[data-dash-client-date]');
  if(dateButton){dashboardSelectedDate=dateButton.dataset.dashClientDate;render();return;}
  const tab=e.target.closest('[data-dash-tab]');
  if(tab){dashboardTab=tab.dataset.dashTab;render();return;}
  if(e.target.closest('[data-dash-location-edit]')){dashboardLocationEditing=true;render();return;}
  if(e.target.closest('[data-dash-location-cancel]')){dashboardLocationEditing=false;dashboardPrefError='';render();}
});
document.addEventListener('submit',e=>{
  if(e.target.id==='dashboard-location-form'){e.preventDefault();saveDashboardLocation(e.target);}
});

/* Appointment rows also open with Enter or Space for keyboard users. */
document.addEventListener('keydown',e=>{
  const row=e.target.closest('[data-dash-appointment-href]');
  if(row && (e.key==='Enter'||e.key===' ')){
    e.preventDefault();
    location.assign(row.dataset.dashAppointmentHref);
  }
});
