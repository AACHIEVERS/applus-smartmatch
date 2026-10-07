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