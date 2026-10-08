(function(){
  "use strict";
  var demoTitles={"Biology Research":1,"Community Service":1,"Debate":1};

  function esc(v){
    return String(v==null?"":v).replace(/[&<>"]/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch];});
  }
  function years(){
    return [...new Set(state.experiences.map(function(x){return x.year;}))].sort(function(a,b){return Number(b)-Number(a);});
  }
  function evidenceCount(){
    return state.experiences.reduce(function(n,x){return n+(x.evidenceItems||[]).length;},0);
  }
  function reflectionCount(){
    return state.experiences.filter(function(x){return x.learning;}).length;
  }
  function leadershipCount(){
    return state.experiences.filter(function(x){return /lead|owner|coordinat|manage|captain|president|founder/i.test((x.role||"")+" "+(x.description||""));}).length;
  }
  function serviceCount(){
    return state.experiences.filter(function(x){return (x.skills||[]).some(function(s){return /service|community/i.test(s);})||/volunteer|service|community/i.test((x.title||"")+" "+(x.description||""));}).length;
  }
  function readiness(){
    var total=state.experiences.length;
    if(!total)return 0;
    var evidence=state.experiences.filter(function(x){return x.evidence;}).length;
    var reflection=reflectionCount();
    var strong=state.experiences.filter(function(x){return x.portfolio==="Strong";}).length;
    return Math.min(100,Math.round((Math.min(total,10)/10)*35+(evidence/total)*25+(reflection/total)*20+(strong/total)*20));
  }
  function attributeData(){
    var names=["Scientific Thinking","Service","Leadership","Communication","Reasoning & Ethics","Reflection & Character"];
    return names.map(function(name){
      var xs=state.experiences.filter(function(x){
        return (x.skills||[]).some(function(s){return String(s).toLowerCase().includes(name.split(" ")[0].toLowerCase()) || (name==="Reasoning & Ethics"&&/reason|ethic/i.test(s));});
      });
      var score=Math.min(95,Math.round(40+xs.length*9+xs.filter(function(x){return x.evidence;}).length*4+xs.filter(function(x){return x.reflection;}).length*4));
      return {name:name,score:score,count:xs.length};
    });
  }
  function installStyle(){
    if(document.getElementById("journeyEnhancedStyle"))return;
    var s=document.createElement("style");s.id="journeyEnhancedStyle";
    s.textContent=`
      .j-overview{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;margin-bottom:14px}
      .j-hero,.j-card{background:#fff;border:1px solid var(--line);border-radius:20px}
      .j-hero{padding:25px}.j-hero h2{margin:4px 0 7px;font-size:27px}.j-hero p{color:var(--muted);line-height:1.55;margin:0}
      .j-score{display:flex;align-items:end;justify-content:space-between;margin-top:18px}.j-score strong{font-size:42px;line-height:1}.j-score span{font-size:11px;color:var(--muted)}
      .j-meter{height:7px;background:#e9eeec;border-radius:99px;margin-top:10px;overflow:hidden}.j-meter i{display:block;height:100%;background:var(--accent);border-radius:99px}
      .j-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:20px;overflow:hidden}
      .j-stat{background:#fff;padding:20px}.j-stat strong{display:block;font-size:27px}.j-stat span{font-size:10px;color:var(--muted)}
      .j-card{padding:22px;margin-bottom:14px}.j-card h3{margin:0 0 7px}.j-card-head{display:flex;justify-content:space-between;gap:12px;align-items:start}.j-card-head p{color:var(--muted);font-size:12px;margin:0}
      .j-badge{font-size:9px;font-weight:850;letter-spacing:.08em;color:var(--accent);border:1px solid #cfe1dc;border-radius:99px;padding:5px 8px;white-space:nowrap}
      .j-attrs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0}.j-attr{background:#f3f6f5;border-radius:11px;padding:10px}.j-attr b{display:block;font-size:10px}.j-attr span{font-size:9px;color:var(--muted)}
      .j-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:15px}.j-box{background:#f7f9f8;border-radius:13px;padding:14px}.j-box b{font-size:9px;letter-spacing:.08em;color:var(--accent)}.j-box p{font-size:12px;line-height:1.55;color:#52615e;margin:7px 0 0}
      .j-evidence{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.j-evidence span{font-size:9px;padding:5px 7px;background:#fff;border:1px solid var(--line);border-radius:7px;color:#566661}
      .j-quality{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);margin-top:15px;border-radius:12px;overflow:hidden}.j-quality div{background:#fff;padding:11px}.j-quality b{display:block;font-size:16px}.j-quality span{font-size:8px;color:var(--muted)}
      .j-map{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.j-map-item{padding:14px;border:1px solid var(--line);border-radius:13px}.j-map-item b{font-size:10px}.j-map-item strong{display:block;font-size:22px;margin:5px 0}.j-map-item small{color:var(--muted);font-size:9px}
      .j-next{background:var(--ink);color:#fff;border-radius:20px;padding:23px;margin-bottom:14px}.j-next p{color:#c5cecc;font-size:12px;line-height:1.55}.j-next .eyebrow{color:#71cbbd}.j-next h3{margin:5px 0}
      .j-timeline{border-left:1px solid #dfe5e2;padding-left:22px}.j-year{font-size:11px;color:var(--accent);font-weight:850;letter-spacing:.1em;margin:20px 0 10px;position:relative}.j-year:before{content:"";position:absolute;left:-28px;top:2px;width:9px;height:9px;border-radius:50%;background:var(--accent)}
      @media(max-width:850px){.j-overview,.j-columns{grid-template-columns:1fr}.j-map{grid-template-columns:repeat(2,1fr)}.j-attrs{grid-template-columns:repeat(2,1fr)}.j-quality{grid-template-columns:repeat(2,1fr)}}
    `;
    document.head.appendChild(s);
  }

  function render(){
    var page=document.getElementById("page-journey");
    if(!page)return;
    installStyle();
    var wrap=page.querySelector(".page-wrap");
    if(!wrap)return;
    var total=state.experiences.length, evidence=evidenceCount(), reflections=reflectionCount(), ready=readiness();
    var attrs=attributeData();
    var gaps=(typeof computeCandidateState==="function"?computeCandidateState().gaps:[]).slice(0,2);
    var html=`
      <div class="section-intro row-between">
        <div><p class="kicker">YOUR RECORD · MEDICINE JOURNEY</p><h1>My Journey</h1><p>Turn real experiences into evidence, reflection and a coherent medicine story.</p></div>
        <button class="primary" id="addExperience">+ Add experience</button>
      </div>
      <div class="j-overview">
        <article class="j-hero">
          <span class="eyebrow">JOURNEY READINESS · SMARTMATCH INTERNAL MODEL</span>
          <h2>${total?"Your record is taking shape.":"Start with one real experience."}</h2>
          <p>${total?"The goal is not to collect more activities. Strengthen ownership, evidence, impact and reflection in the experiences that matter.":"Add something you genuinely did. You can build the evidence and reflection later."}</p>
          <div class="j-score"><div><strong>${ready}</strong><span>/ 100 readiness</span></div><span>${Math.min(total,10)} / 10 Top 10 slots used</span></div>
          <div class="j-meter"><i style="width:${ready}%"></i></div>
        </article>
        <div class="j-stats">
          <div class="j-stat"><strong>${total}</strong><span>EXPERIENCES</span></div>
          <div class="j-stat"><strong>${evidence}</strong><span>EVIDENCE ITEMS</span></div>
          <div class="j-stat"><strong>${reflections}</strong><span>REFLECTIONS</span></div>
          <div class="j-stat"><strong>${leadershipCount()}</strong><span>OWNERSHIP / LEADERSHIP</span></div>
        </div>
      </div>
      <article class="j-card">
        <div class="section-intro compact"><p class="kicker">MEDICINE ATTRIBUTE MAP</p><h2>What your experiences are showing</h2><p>These are SmartMatch development signals, not NUS Medicine admission weights.</p></div>
        <div class="j-map">${attrs.map(function(a){return '<div class="j-map-item"><b>'+esc(a.name)+'</b><strong>'+a.score+'</strong><small>'+a.count+' linked experience'+(a.count===1?"":"s")+'</small></div>';}).join("")}</div>
      </article>
      <article class="j-next">
        <span class="eyebrow">WHAT TO STRENGTHEN NEXT</span>
        <h3>${gaps.length?esc(gaps[0].name):"Build depth, not volume"}</h3>
        <p>${gaps.length?"Your largest current development gap is "+esc(gaps[0].name)+". Look for a real opportunity to deepen this through responsibility, evidence and reflection rather than simply adding another activity.":"Keep developing one meaningful experience with clear responsibility and measurable impact."}</p>
      </article>
      <div class="j-timeline" id="journeyEnhancedList"></div>
    `;
    wrap.innerHTML=html;
    var list=document.getElementById("journeyEnhancedList");
    years().forEach(function(y){
      var year=document.createElement("div");year.className="j-year";year.textContent=y;list.appendChild(year);
      state.experiences.filter(function(x){return x.year==y;}).forEach(function(x){
        var card=document.createElement("article");card.className="j-card";
        var quality=Math.min(100,Math.round((x.evidence?25:8)+(x.reflection?25:8)+(x.impact?25:10)+(x.learning?25:10)));
        var demo=demoTitles[x.title];
        card.innerHTML=`
          <div class="j-card-head"><div><h3>${esc(x.title)}</h3><p>${esc(x.role)} · ${esc(x.duration)} · ${esc(x.year)}</p></div><span class="j-badge">${demo?"DEMO EXAMPLE":"YOUR EXPERIENCE"}</span></div>
          <div class="chips">${(x.skills||[]).map(function(s){return '<span class="chip">'+esc(s)+'</span>';}).join("")}</div>
          <div class="j-columns">
            <div class="j-box"><b>WHAT HAPPENED</b><p>${esc(x.description)||"Add a factual description of what you actually did."}</p></div>
            <div class="j-box"><b>WHAT CHANGED</b><p>${esc(x.impact)||"Open this experience and record the real outcome or contribution."}</p></div>
            <div class="j-box"><b>WHAT I LEARNED</b><p>${esc(x.learning)||"Reflection is still needed. What did this experience change in how you think or act?"}</p></div>
            <div class="j-box"><b>EVIDENCE</b><div class="j-evidence">${(x.evidenceItems||[]).length?(x.evidenceItems||[]).map(function(e){return '<span>✓ '+esc(e)+'</span>';}).join(""):"<span>Evidence needed</span>"}</div></div>
          </div>
          <div class="j-quality">
            <div><b>${x.evidence?"Strong":"Needed"}</b><span>EVIDENCE</span></div>
            <div><b>${x.reflection?"Strong":"Needed"}</b><span>REFLECTION</span></div>
            <div><b>${x.impact?"Strong":"Needed"}</b><span>IMPACT</span></div>
            <div><b>${quality}</b><span>EXPERIENCE SIGNAL</span></div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:15px">
            <span style="font-size:10px;color:var(--muted)">Portfolio: <b>${esc(x.portfolio||"Supporting")}</b></span>
            <button class="text-btn j-open">Open record →</button>
          </div>`;
        card.querySelector(".j-open").onclick=function(){openExperience(x.id);};
        list.appendChild(card);
      });
    });
    document.getElementById("addExperience").onclick=function(){
      var old=document.getElementById("addExperience");
      if(old&&old.__originalAdd){old.__originalAdd();}
      else if(typeof openExperience==="function"){
        document.getElementById("modalContent").innerHTML='<span class="eyebrow">NEW EXPERIENCE</span><h2>Add to My Journey</h2><label>Experience<input id="newTitle" placeholder="e.g. Community project"></label><label>Your role<input id="newRole" placeholder="e.g. Project coordinator"></label><label>What happened?<textarea id="newDesc" placeholder="Keep it factual."></textarea></label><button class="primary" id="saveExperience">Add experience</button>';
        document.getElementById("modal").classList.add("open");
        document.getElementById("saveExperience").onclick=function(){
          var title=document.getElementById("newTitle").value.trim()||"New experience";
          var role=document.getElementById("newRole").value.trim()||"Participant";
          var desc=document.getElementById("newDesc").value.trim()||"Record details later.";
          state.experiences.unshift({id:Date.now(),year:String(new Date().getFullYear()),title:title,role:role,duration:"New",skills:["To assess"],evidence:false,reflection:false,portfolio:"Supporting",description:desc,impact:"",learning:"",evidenceItems:[]});
          save();renderCandidateDNA();render();renderPortfolio();closeModal();
        };
      }
    };
  }

  function boot(){
    if(typeof state==="undefined")return;
    window.__smartmatchEnhancedJourney=render;
    render();
    window.renderJourney=render;
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();