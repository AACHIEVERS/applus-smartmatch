(function(){
  "use strict";
  var key="smartmatch_medicine_candidate_v2";
  function clean(){
    try{
      var raw=JSON.parse(localStorage.getItem(key)||"null");
      if(!raw||!Array.isArray(raw.experiences))return;
      var seen={}, out=[];
      raw.experiences.forEach(function(x){
        var sig=[x.year,x.title,x.role,x.duration,x.description,x.impact,x.learning].join("\u001f").toLowerCase().trim();
        if(!seen[sig]){seen[sig]=true;out.push(x);}
      });
      raw.experiences=out;
      localStorage.setItem(key,JSON.stringify(raw));
    }catch(e){}
  }
  clean();
  window.setTimeout(clean,1200);
})();