(function(){
  "use strict";

  function cleanEscapedWhitespace(){
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    var node;
    while(node=walker.nextNode()){
      if(/\\n|\\r|\\t/.test(node.nodeValue)){
        node.nodeValue=node.nodeValue.replace(/\\r/g," ").replace(/\\n/g," ").replace(/\\t/g," ").replace(/ {2,}/g," ").trim();
      }
    }
  }

  function page(name){
    document.querySelectorAll(".page").forEach(function(p){p.classList.remove("active");});
    var target=document.getElementById("page-"+name);
    if(target) target.classList.add("active");
    document.querySelectorAll(".nav-btn").forEach(function(b){b.classList.toggle("active",b.dataset.page===name);});
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function openModal(id){
    var el=document.getElementById(id);
    if(el){el.classList.add("open");el.setAttribute("aria-hidden","false");}
  }
  function closeModal(id){
    var el=document.getElementById(id);
    if(el){el.classList.remove("open");el.setAttribute("aria-hidden","true");}
  }

  function fallback(){
    document.querySelectorAll("[data-page]").forEach(function(b){
      if(!b.__smBound){
        b.__smBound=true;
        b.addEventListener("click",function(e){
          var p=b.dataset.page;
          if(p){e.preventDefault();page(p);}
        });
      }
    });

    var closeAuth=document.getElementById("closeAuth");
    if(closeAuth && !closeAuth.__smBound){closeAuth.__smBound=true;closeAuth.onclick=function(){closeModal("authModal");};}
    var authModal=document.getElementById("authModal");
    if(authModal && !authModal.__smBound){authModal.__smBound=true;authModal.onclick=function(e){if(e.target===authModal)closeModal("authModal");};}

    var authBtn=document.getElementById("authBtn");
    if(authBtn && !authBtn.__smBound){authBtn.__smBound=true;authBtn.onclick=function(){openModal("authModal");};}

    var adminBtn=document.getElementById("adminBtn");
    if(adminBtn && !adminBtn.__smBound){adminBtn.__smBound=true;adminBtn.onclick=function(){location.href="admin.html";};}

    var reset=document.getElementById("resetDemo");
    if(reset && !reset.__smBound){reset.__smBound=true;reset.onclick=function(){localStorage.removeItem("smartmatch_medicine_candidate_v2");location.reload();};}

    document.querySelectorAll(".check").forEach(function(b){
      if(b.__smBound)return;
      b.__smBound=true;
      b.onclick=function(){
        b.textContent=b.textContent==="✓"?"○":"✓";
        b.style.fontWeight=b.textContent==="✓"?"900":"400";
      };
    });

    var start=document.getElementById("startAction");
    if(start && !start.__smBound){start.__smBound=true;start.onclick=function(){page("plan");};}

    var practice=document.getElementById("practiceFsa");
    if(practice && !practice.__smBound){
      practice.__smBound=true;
      practice.onclick=function(){
        var c=document.getElementById("modalContent");
        if(c)c.innerHTML='<span class="eyebrow">FSA PRACTICE</span><h2>Practice scenario</h2><p>A team member strongly disagrees with your proposal. What would you do first?</p><textarea id="fsaAnswer" placeholder="Write how you would respond..."></textarea><button class="primary" id="fallbackFsa">Get feedback</button>';
        openModal("modal");
        var btn=document.getElementById("fallbackFsa");
        if(btn)btn.onclick=function(){
          var a=document.getElementById("fsaAnswer");
          if(c)c.innerHTML='<span class="eyebrow">FEEDBACK</span><h2>Good start.</h2><p>'+((a&&a.value.trim())?"Your response is recorded as practice.":"Start by acknowledging the other person's perspective before proposing a solution.")+'</p><p><b>Try next:</b> listen → clarify → consider the team → decide → reflect.</p><button class="primary" id="fallbackDone">Done</button>';
          var done=document.getElementById("fallbackDone");if(done)done.onclick=function(){closeModal("modal");};
        };
      };
    }

    var close=document.getElementById("closeModal");
    if(close && !close.__smBound){close.__smBound=true;close.onclick=function(){closeModal("modal");};}
    var modal=document.getElementById("modal");
    if(modal && !modal.__smBound){modal.__smBound=true;modal.onclick=function(e){if(e.target===modal)closeModal("modal");};}

    var add=document.getElementById("addExperience");
    if(add && !add.__smBound){
      add.__smBound=true;
      add.onclick=function(){
        var c=document.getElementById("modalContent");
        if(c)c.innerHTML='<span class="eyebrow">NEW EXPERIENCE</span><h2>Add to My Journey</h2><label>Experience<input id="fallbackTitle" placeholder="e.g. Community project"></label><label>Your role<input id="fallbackRole" placeholder="e.g. Project coordinator"></label><label>What happened?<textarea id="fallbackDesc" placeholder="Keep it factual."></textarea></label><button class="primary" id="fallbackSave">Add experience</button>';
        openModal("modal");
        var save=document.getElementById("fallbackSave");
        if(save)save.onclick=function(){
          var raw=JSON.parse(localStorage.getItem("smartmatch_medicine_candidate_v2")||'{"experiences":[],"tasks":[false,false,false,false]}');
          raw.experiences=raw.experiences||[];
          raw.experiences.unshift({id:Date.now(),year:String(new Date().getFullYear()),title:(document.getElementById("fallbackTitle").value||"New experience").trim(),role:(document.getElementById("fallbackRole").value||"Participant").trim(),duration:"New",skills:["To assess"],evidence:false,reflection:false,portfolio:"Supporting",description:(document.getElementById("fallbackDesc").value||"").trim(),impact:"",learning:"",evidenceItems:[]});
          localStorage.setItem("smartmatch_medicine_candidate_v2",JSON.stringify(raw));
          closeModal("modal");location.reload();
        };
      };
    }
  }

  function boot(){
    cleanEscapedWhitespace();
    window.setTimeout(function(){
      if(window.__smartmatchMedicineLoaded!==true) fallback();
      cleanEscapedWhitespace();
    },700);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();