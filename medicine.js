const STORE_KEY="smartmatch_medicine_candidate_v2";
const initial={
 experiences:[
  {id:1,year:"2026",title:"Biology Research",role:"Research participant",duration:"4 months",skills:["Scientific Thinking","Reasoning"],evidence:true,reflection:true,portfolio:"Strong",description:"Explored a biological question and presented findings.",impact:"Presented findings to the research team.",learning:"Learned to test assumptions and explain evidence clearly.",evidenceItems:["Research presentation"]},
  {id:2,year:"2026",title:"Community Service",role:"Volunteer",duration:"6 months",skills:["Service","Communication"],evidence:true,reflection:true,portfolio:"Strong",description:"Supported weekly activities for an elderly community group.",impact:"Helped coordinate weekly activities and participant support.",learning:"Learned that listening changes how you serve people.",evidenceItems:["Volunteer record"]},
  {id:3,year:"2026",title:"Debate",role:"Team member",duration:"1 term",skills:["Communication","Reasoning"],evidence:false,reflection:true,portfolio:"Supporting",description:"Practised structured discussion and responding to unfamiliar viewpoints.",impact:"Contributed to team preparation and live discussion.",learning:"Learned to slow down and understand an opposing view.",evidenceItems:[]}
 ],
 tasks:[false,false,false,false]
};
let state=JSON.parse(localStorage.getItem(STORE_KEY)||"null")||initial;\nstate.experiences=state.experiences.map(x=>({...x,impact:x.impact||"",learning:x.learning||"",evidenceItems:x.evidenceItems||[]}));
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state)); cloudSaveState();}

let cloudClient=null, currentUser=null, cloudReady=false, cloudBusy=false;
const SUPABASE_URL="https://xndgplkeayyrtzqgphlj.supabase.co";
const SUPABASE_KEY="sb_publishable_QQ_FVe4_XJA8vaLWg9FXPQ_PwamKnNa";
function setAuthMessage(message,ok=false){
 const el=document.getElementById("authMessage"); if(el){el.textContent=message;el.className="auth-message "+(ok?"ok":"");}
}
function updateAuthButton(){
 const b=document.getElementById("authBtn"); if(!b)return;
 b.textContent=currentUser ? (currentUser.email||"Account") : "Sign in";
}
async function initCloud(){
 if(!window.supabase)return;
 cloudClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data}=await cloudClient.auth.getSession();
 currentUser=data.session?.user||null; updateAuthButton();
 cloudClient.auth.onAuthStateChange(async (_event,session)=>{
   currentUser=session?.user||null; updateAuthButton();
   if(currentUser) await loadCloudState();
 });
 if(currentUser) await loadCloudState();
}
async function loadCloudState(){
 if(!cloudClient||!currentUser||cloudBusy)return;
 cloudBusy=true;
 try{
   const [{data:profile,error:pe},{data:rows,error:ee},{data:plans,error:ae}]=await Promise.all([
     cloudClient.from("candidate_profiles").select("*").eq("user_id",currentUser.id).maybeSingle(),
     cloudClient.from("experiences").select("*").eq("user_id",currentUser.id).order("year",{ascending:false}),
     cloudClient.from("action_plans").select("*").eq("user_id",currentUser.id).order("position",{ascending:true})
   ]);
   if(pe) throw pe; if(ee) throw ee;
   if(rows&&rows.length){
     const ids=rows.map(x=>x.id);
     const {data:evRows}=await cloudClient.from("evidence").select("experience_id,title,evidence_type").eq("user_id",currentUser.id).in("experience_id",ids);
     if(evRows) rows.forEach(x=>{x._evidence=evRows.filter(e=>e.experience_id===x.id).map(e=>e.title||e.evidence_type);});
     state.experiences=rows.map(x=>({id:x.id,year:x.year||"",title:x.title||"Experience",role:x.role||"Participant",duration:x.duration||"",skills:x.skills||[],evidence:false,reflection:Boolean(x.learning),portfolio:x.portfolio_status||"Supporting",description:x.description||"",impact:x.impact||"",learning:x.learning||"",evidenceItems:x._evidence||[],evidence:Boolean((x._evidence||[]).length)}));
     if(plans?.length) state.tasks=[0,1,2,3].map(i=>plans.find(p=>p.position===i+1)?.status==="done");
     saveLocalOnly();
     renderJourney();renderPortfolio();renderTasks();
   }else{
     await ensureProfile(profile);
     await migrateLocalExperiences();
     await syncTasks();
   }
 }catch(err){console.warn("Cloud sync unavailable:",err?.message||err);}
 finally{cloudBusy=false;}
}
function saveLocalOnly(){localStorage.setItem(STORE_KEY,JSON.stringify(state));}
async function ensureProfile(profile){
 if(profile)return;
 await cloudClient.from("candidate_profiles").insert({user_id:currentUser.id,display_name:currentUser.email?.split("@")[0]||"Candidate",stage:"Sec 4",target_programme:"NUS Medicine",current_focus:"Leadership",focus_score:58,target_score:70});
}
async function migrateLocalExperiences(){
 for(const x of [...state.experiences]){
   const payload={user_id:currentUser.id,year:x.year,title:x.title,role:x.role,duration:x.duration,description:x.description,impact:x.impact||"",learning:x.learning||"",skills:x.skills||[],portfolio_status:x.portfolio||"Supporting",lifecycle_status:x.learning&&x.evidence?"Reflected":"Active"};
   const {data,error}=await cloudClient.from("experiences").insert(payload).select().single();
   if(error)throw error;
   x.id=data.id;
   if((x.evidenceItems||[]).length) await cloudClient.from("evidence").insert((x.evidenceItems||[]).map(v=>({user_id:currentUser.id,experience_id:data.id,evidence_type:"record",title:v})));
   if(x.learning||x.impact) await cloudClient.from("reflections").insert({user_id:currentUser.id,experience_id:data.id,learning:x.learning||"",what_changed:x.impact||""});
 }
 saveLocalOnly();renderJourney();renderPortfolio();
 await syncTasks();
}
async function cloudSaveState(){
 if(!cloudClient||!currentUser||cloudBusy)return;
 const profile={user_id:currentUser.id,stage:document.getElementById("stageLabel")?.textContent||"Sec 4",target_programme:"NUS Medicine",current_focus:"Leadership",focus_score:Number(document.getElementById("focusScore")?.textContent||58),target_score:70,updated_at:new Date().toISOString()};
 const {error:pe}=await cloudClient.from("candidate_profiles").upsert(profile);
 if(pe){console.warn(pe);return;}
 for(const x of state.experiences){
   const payload={user_id:currentUser.id,year:x.year,title:x.title,role:x.role,duration:x.duration,description:x.description,impact:x.impact||"",learning:x.learning||"",skills:x.skills||[],portfolio_status:x.portfolio||"Supporting",lifecycle_status:x.learning&&x.evidence?"Reflected":"Active"};
   if(typeof x.id==="string"&&x.id.includes("-")) payload.id=x.id;
   const {data,error}=await cloudClient.from("experiences").upsert(payload).select().single();
   if(!error&&data){
     x.id=data.id;
     await cloudClient.from("evidence").delete().eq("experience_id",data.id).eq("user_id",currentUser.id);
     if((x.evidenceItems||[]).length) await cloudClient.from("evidence").insert(x.evidenceItems.map(v=>({user_id:currentUser.id,experience_id:data.id,evidence_type:"record",title:v})));
     await cloudClient.from("reflections").upsert({user_id:currentUser.id,experience_id:data.id,learning:x.learning||"",what_changed:x.impact||""});
   }
 }
 saveLocalOnly();
 await syncTasks();
}
async function syncTasks(){
 if(!cloudClient||!currentUser)return;
 for(let i=0;i<state.tasks.length;i++){
   const payload={user_id:currentUser.id,position:i+1,title:["Take ownership of one project task","Record what changed","Add one piece of evidence","Write a short reflection"][i],status:state.tasks[i]?"done":"todo"};
   await cloudClient.from("action_plans").upsert(payload,{onConflict:"user_id,position"});
 }
}
async function signIn(){
 const email=document.getElementById("authEmail").value.trim(),password=document.getElementById("authPassword").value;
 if(!email||!password)return setAuthMessage("Enter your email and password.");
 setAuthMessage("Signing in…");
 const {error}=await cloudClient.auth.signInWithPassword({email,password});
 setAuthMessage(error?error.message:"Signed in. Your journey is syncing.",!error);
 if(!error)document.getElementById("authModal").classList.remove("open");
}
async function signUp(){
 const email=document.getElementById("authEmail").value.trim(),password=document.getElementById("authPassword").value;
 if(!email||password.length<6)return setAuthMessage("Use an email and a password of at least 6 characters.");
 setAuthMessage("Creating account…");
 const {data,error}=await cloudClient.auth.signUp({email,password});
 if(error)return setAuthMessage(error.message);
 setAuthMessage(data.session?"Account created and signed in.":"Account created. Check your email to confirm, then sign in.",true);
}

function showPage(page){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 document.querySelector("#page-"+page).classList.add("active");
 document.querySelectorAll(".nav-btn").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
 window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(x=>x.addEventListener("click",()=>showPage(x.dataset.page)));
document.getElementById("authBtn").addEventListener("click",async()=>{if(!cloudClient)return; if(currentUser){if(confirm("Sign out of SmartMatch?"))await cloudClient.auth.signOut();}else{document.getElementById("authModal").classList.add("open");}});
document.getElementById("closeAuth").addEventListener("click",()=>document.getElementById("authModal").classList.remove("open"));
document.getElementById("signInBtn").addEventListener("click",signIn);
document.getElementById("signUpBtn").addEventListener("click",signUp);
document.getElementById("resetDemo").addEventListener("click",()=>{if(confirm("Reset the demo record?")){localStorage.removeItem(STORE_KEY);location.reload();}});

const requirements={
 academic:{title:"Academic",status:"On track",body:"Academic eligibility is a hard gate. SmartMatch keeps the current official prerequisite information separate from student-development scoring.",list:["For the Singapore-Cambridge A-Level route, check the current H2 Chemistry and H2 Biology or H2 Physics prerequisite combination.","Check the current GP and Project Work requirements.","Eligibility must always be verified against the official NUS Medicine admissions page for the intended intake."]},
 portfolio:{title:"Medicine Portfolio",status:"Developing",body:"Your four-year record should make the Portfolio easier to assemble because experiences, evidence and reflections are already connected.",list:["Personal Statement — 500 words under the current Standard Scheme structure.","Top 10 achievements / activities from the relevant recent period.","Official school testimonial.","Two referee reports."]},
 fsa:{title:"Focused Skills Assessment",status:"Developing",body:"FSA readiness is developed through real communication, teamwork, reasoning and reflection — not by memorising medical answers.",list:["Role-play","Task-based","Group","Interview","Current NUS guidance states that FSA does not test academic or medical knowledge."]},
 selection:{title:"Selection",status:"Final stage",body:"SmartMatch does not predict admission. It shows whether the student has completed the relevant preparation gates and whether the record is coherent and evidenced.",list:["Academic eligibility","Portfolio readiness","FSA capability","Application readiness"]}
};
function renderRequirement(key="academic"){
 const r=requirements[key];
 document.getElementById("requirementCard").innerHTML=`<span class="eyebrow">NUS MEDICINE · CURRENT MODEL</span><h2>${r.title}</h2><p>${r.body}</p><ul>${r.list.map(x=>"<li>"+x+"</li>").join("")}</ul><span class="status">● ${r.status}</span>`;
}
document.querySelectorAll(".admission-step").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".admission-step").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderRequirement(b.dataset.req);}));

function renderJourney(){
 const list=document.getElementById("journeyList");
 const years=[...new Set(state.experiences.map(x=>x.year))].sort((a,b)=>b-a);
 list.innerHTML=years.map(y=>`<div class="journey-year">${y}</div>`+state.experiences.filter(x=>x.year==y).map(x=>`<article class="journey-card"><div><h3>${x.title}</h3><p>${x.role} · ${x.duration}</p><div class="chips">${x.skills.map(s=>`<span class="chip">${s}</span>`).join("")}</div><p style="margin-top:12px">${x.description}</p><div class="chips"><span class="chip">${x.evidence?"Evidence ✓":"Evidence needed"}</span><span class="chip">${x.reflection?"Reflection ✓":"Reflection needed"}</span></div></div><div class="record-state">${x.portfolio}<br><button class="text-btn" style="margin-top:12px" onclick="openExperience(${x.id})">Open →</button></div></article>`).join("")).join("")||"<p>No experiences yet.</p>";
 document.getElementById("experienceCount").textContent=state.experiences.length;
 document.getElementById("strongCount").textContent=state.experiences.filter(x=>x.portfolio==="Strong").length;
}
function openExperience(id){
 const x=state.experiences.find(e=>e.id===id);
 document.getElementById("modalContent").innerHTML=`<span class="eyebrow">EXPERIENCE RECORD</span><h2>${x.title}</h2><p>${x.role} · ${x.duration}</p><p>${x.description}</p><h3>What changed?</h3><textarea id="impactText" placeholder="Record the real outcome...">${x.impact||""}</textarea><h3>What did you learn?</h3><textarea id="reflectionText" placeholder="Write your reflection...">${x.learning||""}</textarea><h3>Evidence</h3><textarea id="evidenceText" placeholder="What real evidence exists? e.g. report, presentation, mentor feedback">${(x.evidenceItems||[]).join("\n")}</textarea><button class="primary" id="saveReflection">Save record</button>`;
 document.getElementById("modal").classList.add("open");
 document.getElementById("saveReflection").onclick=()=>{x.impact=document.getElementById("impactText").value.trim();x.learning=document.getElementById("reflectionText").value.trim();x.evidenceItems=document.getElementById("evidenceText").value.split("\n").map(v=>v.trim()).filter(Boolean);x.evidence=x.evidenceItems.length>0;x.reflection=x.learning.length>0;save();closeModal();renderJourney();renderPortfolio();};
}
function closeModal(){document.getElementById("modal").classList.remove("open");}
document.getElementById("closeModal").addEventListener("click",closeModal);
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});

document.getElementById("addExperience").addEventListener("click",()=>{
 document.getElementById("modalContent").innerHTML=`<span class="eyebrow">NEW EXPERIENCE</span><h2>Add to My Journey</h2><label>Experience<input id="newTitle" placeholder="e.g. Community project"></label><label>Your role<input id="newRole" placeholder="e.g. Project coordinator"></label><label>What happened?<textarea id="newDesc" placeholder="Keep it factual. You can refine it later."></textarea></label><button class="primary" id="saveExperience">Add experience</button>`;
 document.getElementById("modal").classList.add("open");
 document.getElementById("saveExperience").onclick=()=>{
  const title=document.getElementById("newTitle").value.trim()||"New experience";
  const role=document.getElementById("newRole").value.trim()||"Participant";
  const desc=document.getElementById("newDesc").value.trim()||"Record details later.";
  state.experiences.unshift({id:Date.now(),year:String(new Date().getFullYear()),title,role,duration:"New",skills:["To assess"],evidence:false,reflection:false,portfolio:"Supporting",description:desc,impact:"",learning:"",evidenceItems:[]});
  save();closeModal();renderJourney();
 };
});

document.querySelectorAll(".check").forEach(b=>b.addEventListener("click",()=>{const i=Number(b.dataset.task);state.tasks[i]=!state.tasks[i];save();renderTasks();}));
function renderTasks(){document.querySelectorAll(".check").forEach(b=>{const done=state.tasks[Number(b.dataset.task)];b.textContent=done?"✓":"○";b.style.fontWeight=done?"900":"400";});}
document.getElementById("startAction").addEventListener("click",()=>{showPage("plan");window.setTimeout(()=>document.querySelector(".plan-item").scrollIntoView({behavior:"smooth",block:"center"}),150);});

function renderPortfolio(){
 const strong=state.experiences.filter(x=>x.portfolio==="Strong");
 document.getElementById("portfolioList").innerHTML=strong.map((x,i)=>`<article class="portfolio-item"><span class="rank">0${i+1} · POTENTIAL TOP 10</span><h3>${x.title}</h3><p>${x.role} · ${x.duration}</p><div class="chips">${x.skills.map(s=>`<span class="chip">${s}</span>`).join("")}</div><div class="why"><b>Why it is strong:</b> continuity, real responsibility, evidence and reflection are recorded.<br><span style="display:block;margin-top:7px">Evidence: ${(x.evidenceItems||[]).length} · Reflection: ${x.learning?"Recorded":"Needed"}</span></div></article>`).join("")||"<article class='simple-card'><h3>Your strongest experiences will appear here.</h3><p>Complete experiences and keep their evidence and reflection connected.</p></article>";
}
document.getElementById("practiceFsa").addEventListener("click",()=>{
 document.getElementById("modalContent").innerHTML=`<span class="eyebrow">FSA PRACTICE</span><h2>A team member strongly disagrees with your proposal.</h2><p>You have two minutes to respond. What would you do first?</p><textarea id="fsaAnswer" placeholder="Write how you would respond..."></textarea><button class="primary" id="assessFsa">Get feedback</button>`;
 document.getElementById("modal").classList.add("open");
 document.getElementById("assessFsa").onclick=()=>{const a=document.getElementById("fsaAnswer").value.trim();document.getElementById("modalContent").innerHTML=`<span class="eyebrow">FEEDBACK</span><h2>Good start.</h2><p>${a?"Your response is recorded as practice.":"Start by acknowledging the other person's perspective before proposing a solution."}</p><p><b>Try next:</b> listen → clarify → consider the team → decide → reflect.</p><button class="primary" onclick="closeModal()">Done</button>`;};
});

renderRequirement();
renderJourney();
renderTasks();
renderPortfolio();
window.addEventListener("DOMContentLoaded",()=>initCloud());
