/* SmartMatch Medicine Candidate OS — stable client
   Rebuilt as one deterministic script. Navigation works even when Supabase is unavailable.
*/
(function(){
"use strict";

const SUPABASE_URL="https://xndgplkeayyrtzqgphlj.supabase.co";
const SUPABASE_KEY="sb_publishable_QQ_FVe4_XJA8vaLWg9FXPQ_PwamKnNa";
const DIMS=[
 ["Academic",75],["Scientific Thinking",75],["Medical Insight",65],["Service",70],
 ["Leadership",70],["Communication",70],["Reasoning & Ethics",72],["Reflection & Character",70]
];
const OPS=[
 ["Deepen an existing service role","Service","Continue a real community commitment and own one outcome.","Evidence + continuity","Certificate-only participation"],
 ["Own a small project","Leadership","Lead planning, coordination, delegation or follow-through.","Ownership + FSA transfer","Title without responsibility"],
 ["Research with a question","Scientific Thinking","Work on a genuine question and produce an artefact.","Reasoning + evidence","One-day exposure"],
 ["Teach or mentor consistently","Communication","Help another student over multiple sessions.","Communication + service","Counting hours only"],
 ["Structured community listening","Service","Understand a need before deciding what to do.","Listening + reflection","Medicine cosplay"],
 ["Debate / discussion depth","Reasoning & Ethics","Practise competing views, evidence and consequences.","Reasoning + communication","Another certificate"]
];
const SC=[
 ["A teammate strongly disagrees with your proposal.","What would you do first?"],
 ["A student you mentor is not following the plan.","How would you respond before changing it?"],
 ["You notice a mistake just before submission.","What would you do, and why?"]
];

let db=null,user=null,profile=null;
let experiences=[],evidence=[],reflections=[],skills=[],goals=[],actions=[],portfolioSelections=[],growthEvents=[];

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const pd=k=>profile?.profile_data?.[k]??"";
const ad=k=>profile?.academic_data?.[k]??"";
const app=k=>profile?.application_data?.[k]??"";
const pages=["dashboard","requirements","profile","academics","journey","plan","reflection","growth","opportunities","evidence","portfolio","fsa","application"];

function toast(msg){
 let x=$("osToast");
 if(!x){x=document.createElement("div");x.id="osToast";x.style.cssText="position:fixed;right:20px;bottom:20px;z-index:9999;padding:12px 16px;border:1px solid #ddd;border-radius:12px;background:#fff;box-shadow:0 8px 30px #0002;max-width:360px;font:14px system-ui;";document.body.appendChild(x)}
 x.textContent=msg;x.style.display="block";clearTimeout(x._t);x._t=setTimeout(()=>x.style.display="none",3500);
}

function buildNav(){
 const nav=$("nav");if(!nav)return;
 nav.innerHTML="";
 pages.forEach(p=>{
  const b=document.createElement("button");
  b.type="button";b.className="nav";b.dataset.go=p;
  b.textContent=p==="dashboard"?"Dashboard":p.replace(/^./,m=>m.toUpperCase());
  nav.appendChild(b);
 });
}

function go(id){
 const target=$(id);if(!target)return;
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 target.classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.go===id));
 try{history.replaceState(null,"","#"+id)}catch(_){}
 window.scrollTo(0,0);
 render();
}

function bindNavigation(){
 document.addEventListener("click",e=>{
  const b=e.target.closest("[data-go]");
  if(b){e.preventDefault();go(b.dataset.go)}
 });
 document.addEventListener("click",e=>{
  const b=e.target.closest("#signOut");
  if(!b)return;
  e.preventDefault();
  b.disabled=true;b.textContent="Signing out…";
  const finish=()=>{window.location.replace("index.html")};
  if(db?.auth?.signOut) db.auth.signOut().catch(()=>{}).finally(finish); else finish();
 });
}

function chainFor(x){
 const ev=evidence.filter(e=>e.experience_id===x.id);
 const rf=reflections.filter(r=>r.experience_id===x.id);
 return {evidence:ev.length>0,verified:ev.some(e=>e.verified),reflections:rf.length>0,complete:ev.length>0&&rf.length>0};
}

function realExperiences(){return experiences.filter(x=>!["Interested","Planned"].includes(x.lifecycle_status));}

function vals(){
 const b={Academic:62,"Scientific Thinking":52,"Medical Insight":50,Service:52,Leadership:58,Communication:52,"Reasoning & Ethics":55,"Reflection & Character":55};
 realExperiences().forEach(x=>{
  const c=chainFor(x);
  (x.skills||[]).forEach(sk=>{
   const d=DIMS.find(q=>String(sk).toLowerCase().includes(q[0].toLowerCase()));
   if(!d)return;
   let n=2;if(c.evidence)n+=2;if(c.verified)n+=2;if(c.reflections)n+=2;if(c.complete)n+=2;if(x.impact)n+=2;
   b[d[0]]=Math.min(95,b[d[0]]+n);
  });
 });
 b["Reflection & Character"]=Math.min(95,b["Reflection & Character"]+Math.min(20,reflections.filter(r=>r.learning&&r.what_changed).length*4));
 skills.forEach(a=>{const d=DIMS.find(q=>q[0].toLowerCase()===String(a.skill||"").toLowerCase());if(d&&Number(a.current_score)>b[d[0]])b[d[0]]=Number(a.current_score)});
 return b;
}

async function load(){
 if(!db||!user)return;
 const qs=[
  db.from("candidate_profiles").select("*").eq("user_id",user.id).maybeSingle(),
  db.from("experiences").select("*").eq("user_id",user.id).order("year",{ascending:false}),
  db.from("evidence").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
  db.from("reflections").select("*").eq("user_id",user.id),
  db.from("skill_assessments").select("*").eq("user_id",user.id),
  db.from("goals").select("*").eq("user_id",user.id).order("created_at",{ascending:false}),
  db.from("action_plans").select("*").eq("user_id",user.id).order("position",{ascending:true}),
  db.from("portfolio_selections").select("*").eq("user_id",user.id).order("rank",{ascending:true}),
  db.from("growth_events").select("*").eq("user_id",user.id).order("created_at",{ascending:false})
 ];
 const q=await Promise.all(qs);
 if(q[0].error)throw q[0].error;
 profile=q[0].data;
 experiences=q[1].data||[];evidence=q[2].data||[];reflections=q[3].data||[];skills=q[4].data||[];
 goals=q[5].data||[];actions=q[6].data||[];portfolioSelections=q[7].data||[];growthEvents=q[8].data||[];
 if(!profile){
  const n={user_id:user.id,display_name:user.user_metadata?.display_name||user.email,stage:"Sec 4",target_programme:"NUS Medicine",profile_data:{},academic_data:{},application_data:{},fsa_data:{},preferences_data:{}};
  const z=await db.from("candidate_profiles").insert(n).select().single();
  if(z.error)throw z.error;profile=z.data||n;
 }
}

function fillForm(id,obj,fields){
 const f=$(id);if(!f)return;
 fields.forEach(k=>{if(f.elements[k])f.elements[k].value=obj?.[k]??""});
}

function renderDash(){
 const v=vals(),total=DIMS.reduce((a,d)=>a+d[1],0),got=DIMS.reduce((a,d)=>a+Math.min(v[d[0]],d[1]),0);
 if($("ready"))$("ready").textContent=Math.round(got/total*100)+"%";
 if($("expCount"))$("expCount").textContent=realExperiences().length;
 if($("eviCount"))$("eviCount").textContent=evidence.length;
 if($("refCount"))$("refCount").textContent=reflections.length;
 if($("profilePct")){const p=[profile?.display_name,profile?.school,profile?.stage,pd("medicine_motivation")].filter(Boolean).length;$("profilePct").textContent=Math.round(p/4*100)+"%"}
 if($("profileCheck"))$("profileCheck").textContent=profile?.display_name?"✓":"○";
 if($("academicCheck"))$("academicCheck").textContent=ad("route")?"✓":"○";
 if($("experienceCheck"))$("experienceCheck").textContent=realExperiences().length?"✓":"○";
 if($("evidenceCheck"))$("evidenceCheck").textContent=evidence.length?"✓":"○";
 if($("stage"))$("stage").textContent=profile?.stage||"Explore";
 if($("next"))$("next").textContent=realExperiences().length?"Strengthen one real experience":"Add your first real experience";
 if($("nextwhy"))$("nextwhy").textContent=realExperiences().length?"Connect it to evidence and reflection.":"Start with something substantive, not another certificate.";
 if($("dna"))$("dna").innerHTML=DIMS.map(d=>'<article class="card"><p class="eyebrow">'+esc(d[0])+'</p><h2>'+v[d[0]]+' / '+d[1]+'</h2></article>').join("");
}

function renderProfile(){fillForm("profileForm",Object.assign({display_name:profile?.display_name||user?.email,school:profile?.school,stage:profile?.stage||"Sec 4",target_programme:profile?.target_programme||"NUS Medicine"},profile?.profile_data||{}),["display_name","school","stage","target_year","target_programme","location","medicine_motivation","healthcare_interest","interests","commitments","priorities"])}

function renderAcademics(){fillForm("academicForm",Object.assign({route:"A-Level"},profile?.academic_data||{}),["route","academic_target","chemistry","biology","physics","gp","project_work","other_subjects","strengths","gaps","strategy"])}

function renderJourney(filter){
 const xs=filter==="active"?experiences.filter(x=>["Started","Active"].includes(x.lifecycle_status)):filter==="reflected"?experiences.filter(x=>reflections.some(r=>r.experience_id===x.id)||x.learning):filter==="portfolio"?experiences.filter(x=>portfolioSelections.some(p=>p.experience_id===x.id)):experiences;
 const el=$("journeyList");if(!el)return;
 el.innerHTML=xs.length?xs.map(x=>{const c=chainFor(x);return '<article class="experience"><div><h3>'+esc(x.title)+'</h3><p>'+esc(x.role||"")+' · '+esc(x.duration||"")+' · '+esc(x.year||"")+'</p><div class="chips">'+(x.skills||[]).map(s=>'<span class="chip">'+esc(s)+'</span>').join("")+'</div><p>'+esc(x.description||"")+'</p><div class="chips"><span class="chip">'+(c.evidence?"Evidence ✓":"Evidence needed")+'</span><span class="chip">'+(c.reflections?"Reflection ✓":"Reflection needed")+'</span></div></div><div class="state">'+esc(x.lifecycle_status||"Started")+'<br><button type="button" onclick="openExp('+JSON.stringify(x.id)+')">Open →</button></div></article>'}).join(""):'<div class="notice">No experiences yet. Start with something real and substantive.</div>';
}

function renderReflection(){
 const el=$("reflectionList");if(!el)return;
 el.innerHTML=reflections.length?reflections.map(r=>{const x=experiences.find(e=>e.id===r.experience_id)||{};return '<article class="card experience"><h3>'+esc(x.title||"Reflection")+'</h3><p>'+esc(r.what_happened||"")+'</p><div class="chips"><span class="chip">'+(r.learning?"Learning ✓":"Learning needed")+'</span><span class="chip">'+(r.what_changed?"Impact ✓":"Impact needed")+'</span></div><button type="button" class="ghost" onclick="openReflection('+JSON.stringify(r.id)+')">Open →</button></article>'}).join(""):'<div class="notice">No reflections yet. Add a reflection from a real experience.</div>';
}

function renderGrowth(){
 const el=$("growthList");if(!el)return;const v=vals(),g=DIMS.map(d=>({n:d[0],t:d[1],v:v[d[0]],gap:d[1]-v[d[0]]})).sort((a,b)=>b.gap-a.gap);
 if($("growthFocus"))$("growthFocus").textContent=g[0].n;
 if($("growthWhy"))$("growthWhy").textContent="Current gap: "+Math.max(0,g[0].gap)+" points.";
 if($("growthDo"))$("growthDo").textContent="Create or deepen one real experience that produces evidence and reflection for "+g[0].n+".";
 if($("growthDont"))$("growthDont").textContent="Do not add activities just to increase the count.";
 el.innerHTML='<div class="grid2">'+DIMS.map(d=>'<article class="card"><p class="eyebrow">'+esc(d[0])+'</p><h2>'+v[d[0]]+' / '+d[1]+'</h2><p>Gap '+Math.max(0,d[1]-v[d[0]])+'</p></article>').join("")+'</div>';
}

function renderOps(){
 const el=$("opList");if(!el)return;const v=vals();
 el.innerHTML=OPS.map(o=>'<article class="card op"><span class="match">MATCH · '+(o[1]&&DIMS.find(d=>d[0]===o[1])&&DIMS.find(d=>d[0]===o[1])[1]-v[o[1]]>0?"CURRENT GAP":"BUILD")+'</span><h3>'+esc(o[0])+'</h3><p><b>'+esc(o[1])+'</b><br>'+esc(o[2])+'</p><p>Why: '+esc(o[3])+'</p><div class="trap">Avoid: '+esc(o[4])+'</div></article>').join("");
}

function renderEvidence(){
 const el=$("evidenceList");if(!el)return;const ver=evidence.filter(x=>x.verified).length,linked=evidence.filter(x=>x.experience_id&&reflections.some(r=>r.experience_id===x.experience_id)).length;
 $("evTotal").textContent=evidence.length;$("evVerified").textContent=ver;$("evHealth").textContent=(evidence.length?Math.round(linked/evidence.length*100):0)+"%";
 el.innerHTML=evidence.length?evidence.map(x=>'<article class="card evidence"><h3>'+esc(x.title)+'</h3><p>'+esc(x.evidence_type||"Evidence")+' · '+esc((experiences.find(e=>e.id===x.experience_id)||{}).title||"Unlinked")+'</p><p>'+esc(x.notes||"")+'</p><span class="verified">'+(x.verified?"Verified":"Needs verification")+'</span></article>').join(""):'<div class="notice">Connect reports, certificates, presentations, mentor feedback, impact data and other real evidence to your experiences.</div>';
}

function renderPortfolio(){
 const xs=experiences.filter(x=>chainFor(x).complete),selected=portfolioSelections.map(s=>s.experience_id),el=$("portfolioList");if(!el)return;
 $("portfolioSummary").innerHTML='<div class="card"><b>'+xs.length+'</b><span>Portfolio-ready candidates</span></div><div class="card"><b>'+selected.length+'/10</b><span>Top 10 selected</span></div><div class="card"><b>'+new Set(xs.flatMap(x=>x.skills||[])).size+'</b><span>Capability signals</span></div>';
 el.innerHTML=xs.length?xs.map(x=>{const ps=portfolioSelections.find(s=>s.experience_id===x.id);return '<article class="card portfolio"><span class="match">'+(ps?"TOP 10 · #"+ps.rank:"PORTFOLIO CANDIDATE")+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.role||"")+' · '+esc(x.duration||"")+'</p><div class="chips">'+(x.skills||[]).map(s=>'<span class="chip">'+esc(s)+'</span>').join("")+'</div><p>Evidence: '+evidence.filter(e=>e.experience_id===x.id).length+' · Reflection: Complete</p><button type="button" class="ghost" onclick="'+(ps?"removePortfolio":"selectPortfolio")+'('+JSON.stringify(x.id)+')">'+(ps?"Remove from Top 10":"Add to Top 10")+'</button></article>'}).join(""):'<div class="notice">No experience is Portfolio-ready yet. Complete Experience → Evidence → Reflection first.</div>';
}

function renderFsa(){
 const v=vals(),el=$("fsaSkills");if(!el)return;
 const a=[["Communication",v.Communication],["Listening",Math.min(90,v.Communication+4)],["Teamwork",Math.min(90,v.Service+8)],["Reasoning",v["Reasoning & Ethics"]],["Adaptability",Math.min(90,v["Reflection & Character"]+5)]];
 el.innerHTML=a.map(x=>'<div class="card skill"><b>'+x[0]+'</b><strong>'+x[1]+'</strong><small>development signal</small></div>').join("");
 const s=SC[0];$("scenarioTitle").textContent=s[0];$("scenarioPrompt").textContent=s[1];
}

function renderPlan(){
 const el=$("planList");if(!el)return;const v=vals(),g=DIMS.map(d=>({skill:d[0],target:d[1],current:v[d[0]],gap:d[1]-v[d[0]]})).sort((a,b)=>b.gap-a.gap);
 if(!goals.length){el.innerHTML='<div class="card"><p class="eyebrow">NEXT BEST GOAL</p><h2>'+esc(g[0].skill)+'</h2><p>Build one meaningful experience that directly develops this capability.</p><button type="button" class="primary" onclick="createGoalForGap()">Create goal →</button></div>';return}
 el.innerHTML=goals.map(goal=>{const aa=actions.filter(a=>a.goal_id===goal.id),done=aa.filter(a=>a.status==="done").length;return '<article class="card"><span class="match">'+esc(goal.status||"active")+'</span><h3>'+esc(goal.title)+'</h3><p>Skill: '+esc(goal.skill||"")+'</p><div class="tasklist">'+aa.map(a=>'<div class="task"><label><input type="checkbox" '+(a.status==="done"?"checked":"")+' onchange="toggleAction('+JSON.stringify(a.id)+',this.checked)"> '+esc(a.title)+'</label></div>').join("")+'</div><p>'+done+'/'+aa.length+' actions complete</p><button type="button" class="ghost" onclick="addAction('+JSON.stringify(goal.id)+')">+ Add action</button></article>'}).join("");
}

function renderApp(){
 const el=$("checklist");if(!el)return;
 const c=[["Academic route",!!ad("route")],["Profile",!!pd("medicine_motivation")],["Experiences",realExperiences().length>0],["Evidence",evidence.length>0],["Reflections",reflections.length>0],["Top 10 bank",portfolioSelections.length>=10],["Personal Statement notes",!!app("personal_statement_notes")],["Testimonial",["Requested","Draft received","Ready"].includes(app("testimonial"))],["Referee 1",!!app("referee1")],["Referee 2",!!app("referee2")]];
 el.innerHTML=c.map(x=>'<div class="card check"><b>'+x[0]+'</b><span>'+(x[1]?"✓ Ready":"○ Needed")+'</span></div>').join("");
 fillForm("applicationForm",profile?.application_data||{},["personal_statement_notes","top10_notes","referee1","referee2","testimonial","notes"]);
}

function render(){
 try{renderDash();renderProfile();renderAcademics();renderJourney(document.querySelector(".filters button.active")?.dataset.filter||"all");renderReflection();renderGrowth();renderOps();renderEvidence();renderPortfolio();renderFsa();renderPlan();renderApp()}catch(e){console.error(e);toast("Candidate OS loaded with a UI error. Navigation remains available.");}
}

function openModal(html){$("modalBody").innerHTML=html;$("modal").classList.add("open")}
function closeModal(){$("modal")?.classList.remove("open")}

window.go=go;
window.closeModal=closeModal;

window.openExp=async id=>{
 const x=experiences.find(e=>e.id===id)||{};
 openModal('<p class="eyebrow">EXPERIENCE RECORD</p><h2>'+(id?"Edit experience":"Add experience")+'</h2><label>Title<input id="et" value="'+esc(x.title||"")+'"></label><label>Role<input id="er" value="'+esc(x.role||"")+'"></label><div class="grid2"><label>Year<input id="ey" type="number" value="'+(x.year||new Date().getFullYear())+'"></label><label>Duration<input id="ed" value="'+esc(x.duration||"")+'"></label></div><label>What happened?<textarea id="ex">'+esc(x.description||"")+'</textarea><label>What changed / impact?<textarea id="ei">'+esc(x.impact||"")+'</textarea><label>What did you learn?<textarea id="el" >'+esc(x.learning||"")+'</textarea><label>Skills developed<input id="es" value="'+esc((x.skills||[]).join(", "))+'"></label><label>Lifecycle<select id="ec"><option>Interested</option><option>Planned</option><option>Started</option><option>Active</option><option>Completed</option><option>Reflected</option><option>Evidence Added</option><option>Impact Assessed</option><option>Portfolio Candidate</option></select></label><div class="modalactions"><button type="button" id="saveExp" class="primary">Save</button></div>';
 if(x.lifecycle_status)$("ec").value=x.lifecycle_status;
 $("saveExp").onclick=async()=>{
  if(!db||!user)return toast("Please sign in first.");
  const p={user_id:user.id,title:$("et").value.trim(),role:$("er").value.trim(),year:Number($("ey").value)||new Date().getFullYear(),duration:$("ed").value.trim(),description:$("ex").value.trim(),impact:$("ei").value.trim(),learning:$("el").value.trim(),skills:$("es").value.split(",").map(v=>v.trim()).filter(Boolean),lifecycle_status:$("ec").value,portfolio_status:$("ec").value==="Portfolio Candidate"?"Strong":"Supporting"};
  const q=id?await db.from("experiences").update(p).eq("id",id).eq("user_id",user.id):await db.from("experiences").insert(p);
  if(q.error)return toast(q.error.message);closeModal();await load();render();
 };
};

window.createGoalForGap=async()=>{
 if(!db||!user)return toast("Please sign in first.");
 const v=vals(),g=DIMS.map(d=>({skill:d[0],gap:d[1]-v[d[0]]})).sort((a,b)=>b.gap-a.gap)[0],title=prompt("Goal for "+g.skill,"Develop "+g.skill+" through a real experience");
 if(!title)return;
 const q=await db.from("goals").insert({user_id:user.id,title,skill:g.skill,status:"active"});
 if(q.error)return toast(q.error.message);await load();render();go("plan");
};
window.addGoal=window.createGoalForGap;

window.addAction=async goalId=>{
 if(!db||!user)return toast("Please sign in first.");
 const title=prompt("What is the next concrete action?");if(!title)return;
 const q=await db.from("action_plans").insert({user_id:user.id,goal_id:goalId,position:actions.filter(a=>a.goal_id===goalId).length+1,title,status:"todo"});
 if(q.error)return toast(q.error.message);await load();render();go("plan");
};
window.toggleAction=async(id,done)=>{
 if(!db||!user)return toast("Please sign in first.");
 const q=await db.from("action_plans").update({status:done?"done":"todo"}).eq("id",id).eq("user_id",user.id);
 if(q.error)return toast(q.error.message);await load();render();go("plan");
};

window.openReflection=async id=>{
 const r=reflections.find(x=>x.id===id);if(!r)return;
 openModal("<h2>Edit reflection</h2><p>"+esc((experiences.find(e=>e.id===r.experience_id)||{}).title||"Experience")+"</p><label>What happened?<textarea id="refH">"+esc(r.what_happened||"")+"</textarea></label><label>Role<textarea id="refR">"+esc(r.role_taken||"")+"</textarea></label><label>Difficulty<textarea id="refD">"+esc(r.difficulty||"")+"</textarea></label><label>Decision<textarea id="refDec">"+esc(r.decision_made||"")+"</textarea></label><label>Learning<textarea id="refL">"+esc(r.learning||"")+"</textarea></label><label>What changed?<textarea id="refC">"+esc(r.what_changed||"")+"</textarea></label><label>Next step<textarea id="refN">"+esc(r.next_step||"")+"</textarea></label><div class="modalactions"><button type="button" id="saveReflection" class="primary">Save reflection</button></div>");
 $("saveReflection").onclick=async()=>{const q=await db.from("reflections").update({what_happened:$("refH").value.trim(),role_taken:$("refR").value.trim(),difficulty:$("refD").value.trim(),decision_made:$("refDec").value.trim(),learning:$("refL").value.trim(),what_changed:$("refC").value.trim(),next_step:$("refN").value.trim(),updated_at:new Date().toISOString()}).eq("id",id).eq("user_id",user.id);if(q.error)return toast(q.error.message);closeModal();await load();render()};
};

function bindForms(){
 $("profileForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!db||!user)return toast("Please sign in first.");const o=Object.fromEntries(new FormData(e.target)),d={...(profile?.profile_data||{}),...o};const q=await db.from("candidate_profiles").update({display_name:o.display_name,school:o.school,stage:o.stage,target_programme:o.target_programme,profile_data:d,updated_at:new Date().toISOString()}).eq("user_id",user.id);$("profileMsg").textContent=q.error?q.error.message:"Saved.";if(!q.error){await load();render()}});
 $("academicForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!db||!user)return toast("Please sign in first.");const o=Object.fromEntries(new FormData(e.target)),q=await db.from("candidate_profiles").update({academic_data:o,updated_at:new Date().toISOString()}).eq("user_id",user.id);$("academicMsg").textContent=q.error?q.error.message:"Saved.";if(!q.error){await load();render()}});
 $("applicationForm")?.addEventListener("submit",async e=>{e.preventDefault();if(!db||!user)return toast("Please sign in first.");const o=Object.fromEntries(new FormData(e.target)),q=await db.from("candidate_profiles").update({application_data:o,updated_at:new Date().toISOString()}).eq("user_id",user.id);$("applicationMsg").textContent=q.error?q.error.message:"Saved.";if(!q.error){await load();render()}});
 $("addExp")?.addEventListener("click",()=>openExp(""));
 $("addGoal")?.addEventListener("click",createGoalForGap);
 $("addReflection")?.addEventListener("click",async()=>{if(!realExperiences().length)return toast("Please add a real experience first.");openModal("<h2>Add reflection</h2><label>Experience<select id="refExp">"+realExperiences().map(x=>"<option value=""+esc(x.id)+"">"+esc(x.title)+"</option>").join("")+"</select></label><label>What happened?<textarea id="refH"></textarea></label><label>What was your role?<textarea id="refR"></textarea></label><label>What was difficult?<textarea id="refD"></textarea></label><label>What decision did you make?<textarea id="refDec"></textarea></label><label>What did you learn?<textarea id="refL"></textarea></label><label>What changed?<textarea id="refC"></textarea></label><label>What will you do next?<textarea id="refN"></textarea></label><div class="modalactions"><button type="button" id="saveReflection" class="primary">Save reflection</button></div>");$("saveReflection").onclick=async()=>{const q=await db.from("reflections").insert({user_id:user.id,experience_id:$("refExp").value,what_happened:$("refH").value.trim(),role_taken:$("refR").value.trim(),difficulty:$("refD").value.trim(),decision_made:$("refDec").value.trim(),learning:$("refL").value.trim(),what_changed:$("refC").value.trim(),next_step:$("refN").value.trim()});if(q.error)return toast(q.error.message);closeModal();await load();render();go("reflection")}};
 $("addEvidence")?.addEventListener("click",async()=>{if(!db||!user)return toast("Please sign in first.");if(!realExperiences().length)return toast("Please add a real experience first.");openModal("<p class="eyebrow">EVIDENCE VAULT</p><h2>Add evidence</h2><label>Experience<select id="evx">"+realExperiences().map(x=>"<option value=""+esc(x.id)+"">"+esc(x.title)+"</option>").join("")+"</select></label><label>Evidence title<input id="evt"></label><label>Type<input id="evtype" placeholder="Report / certificate / presentation / feedback / impact data"></label><label>What does it prove?<textarea id="evnotes"></textarea></label><label>Verified<select id="evverified"><option value="false">Not verified</option><option value="true">Verified</option></select></label><div class="modalactions"><button type="button" id="saveEvidence" class="primary">Save evidence</button></div>");$("saveEvidence").onclick=async()=>{const expId=$("evx").value,q=await db.from("evidence").insert({user_id:user.id,experience_id:expId,title:$("evt").value.trim(),evidence_type:$("evtype").value.trim()||"record",notes:$("evnotes").value.trim(),verified:$("evverified").value==="true"});if(q.error)return toast(q.error.message);await db.from("experiences").update({lifecycle_status:"Evidence Added"}).eq("id",expId).eq("user_id",user.id);closeModal();await load();render()}});
 $("fsaSubmit")?.addEventListener("click",async()=>{const a=$("fsaAnswer").value.trim();$("fsaFeedback").innerHTML=a?"<b>Practice feedback:</b> Start with listening and clarification. Consider the other person's perspective before defending your own. Then decide, act and reflect.":"Start by listening and clarifying the concern rather than defending your proposal immediately.";});
 $("closeModal")?.addEventListener("click",closeModal);$("modal")?.addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
 document.querySelectorAll(".filters button").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderJourney(b.dataset.filter||"all")}));
}

window.selectPortfolio=async id=>{if(!db||!user)return toast("Please sign in first.");if(portfolioSelections.length>=10)return toast("Top 10 is full.");const q=await db.from("portfolio_selections").insert({user_id:user.id,experience_id:id,rank:portfolioSelections.length+1,selected:true,rationale:"Selected from a complete Experience → Evidence → Reflection chain."});if(q.error)return toast(q.error.message);await load();render();go("portfolio")};
window.removePortfolio=async id=>{if(!db||!user)return toast("Please sign in first.");const q=await db.from("portfolio_selections").delete().eq("experience_id",id).eq("user_id",user.id);if(q.error)return toast(q.error.message);await load();render();go("portfolio")};

async function start(){
 buildNav();bindNavigation();bindForms();
 if($("userName"))$("userName").textContent="Loading…";
 try{
  if(!window.supabase?.createClient)throw new Error("Supabase client unavailable");
  db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const s=await db.auth.getSession();user=s.data.session?.user;
  if(!user){$("userName").textContent="Not signed in";toast("Your session has expired. Returning to sign in.");setTimeout(()=>window.location.replace("index.html"),900);return}
  $("userName").textContent=user.user_metadata?.display_name||user.email||"Account";
  await load();render();
 }catch(e){
  console.error("Candidate OS:",e);
  $("userName").textContent=user?.email||"Account";
  render();
  toast("UI is active, but account data could not be loaded: "+(e.message||"connection error"));
 }
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start);else start();
})();