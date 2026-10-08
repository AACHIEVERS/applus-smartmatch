/* SmartMatch universal emergency runtime — UI must remain clickable even if an optional app script fails. */
(function(){
  "use strict";
  function showPage(name){
    var p=document.getElementById("page-"+name)||document.getElementById(name);
    if(!p)return false;
    document.querySelectorAll(".page").forEach(function(x){x.classList.remove("active")});
    p.classList.add("active");
    document.querySelectorAll("[data-page]").forEach(function(x){x.classList.toggle("active",x.getAttribute("data-page")===name)});
    document.querySelectorAll(".nav").forEach(function(x){x.classList.toggle("active",x.getAttribute("data-go")===name)});
    try{history.replaceState(null,"","#"+name)}catch(_){}
    window.scrollTo(0,0); return true;
  }
  document.addEventListener("click",function(e){
    var b=e.target.closest&&e.target.closest("[data-page],[data-go]");
    if(b){
      var name=b.getAttribute("data-page")||b.getAttribute("data-go");
      if(name&&showPage(name)) e.preventDefault();
    }
    var wa=e.target.closest&&e.target.closest("#weekAction");
    if(wa){
      e.preventDefault();
      if(window.go) window.go("plan"); else showPage("plan");
      setTimeout(function(){var first=document.querySelector("#planList .card, #planList .tasklist, #planList");if(first)first.scrollIntoView({behavior:"smooth",block:"center"});},120);
      return;
    }
    var ae=e.target.closest&&e.target.closest("#addEvidence");
    if(ae){
      if(window.__candidateEvidenceReady)return;
      e.preventDefault();
      var xs=window.__candidateExperiences||[];
      if(window.openEvidenceFallback){window.openEvidenceFallback();return;}
      if(!xs.length){alert("Please add a real experience first.");return;}
      var opts=xs.map(function(x){return "<option value='"+String(x.id).replace(/'/g,"&#039;")+"'>"+String(x.title||"Experience").replace(/[&<>]/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[m]})+"</option>"}).join("");
      var m=document.getElementById("modal"),body=document.getElementById("modalBody");
      if(m&&body){
        body.innerHTML="<h2>Add evidence</h2><label>Experience<select id='fbEvx'>"+opts+"</select></label><label>Evidence title<input id='fbEvt'></label><label>Type<input id='fbEvtype' placeholder='Report / certificate / presentation / feedback / impact data'></label><label>What does it prove?<textarea id='fbEvnotes'></textarea></label><button type='button' class='primary' id='fbSaveEvidence'>Save evidence</button>";
        m.classList.add("open");
        document.getElementById("fbSaveEvidence").onclick=async function(){
          var db=window.__candidateDb;
          var s=await db.auth.getSession(),u=s.data.session&&s.data.session.user;
          if(!u){alert("Please sign in first.");return;}
          var q=await db.from("evidence").insert({user_id:u.id,experience_id:document.getElementById("fbEvx").value,title:document.getElementById("fbEvt").value.trim(),evidence_type:document.getElementById("fbEvtype").value.trim()||"record",notes:document.getElementById("fbEvnotes").value.trim()});
          if(q.error){alert(q.error.message);return;}
          m.classList.remove("open");location.reload();
        };
      }
      return;
    }
    var so=e.target.closest&&e.target.closest("#signOut");
    if(so){
      e.preventDefault();
      so.disabled=true; so.textContent="Signing out…";
      var finish=function(){window.location.href="index.html?loggedout=1&v=20261007"};
      if(window.supabase&&window.__candidateDb&&window.__candidateDb.auth){
        window.__candidateDb.auth.signOut().catch(function(){}).finally(finish);
      }else finish();
    }
  },true);
  window.__smartmatchRuntime=true;
})();