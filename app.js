const scholarships = window.SCHOLARSHIPS || [];

const grid=document.querySelector("#grid"),input=document.querySelector("#searchInput"),level=document.querySelector("#levelFilter"),count=document.querySelector("#count");
function render(){
 const q=input.value.toLowerCase().trim(), l=level.value;
 const list=scholarships.filter(s=>(!l||s.levels.includes(l))&&(!q||[s.name,s.provider,s.field,s.award].concat(s.nationality||[],s.levels||[]).join(" ").toLowerCase().includes(q)));
 count.textContent=list.length;
 grid.innerHTML=list.map(function(s){
   const tags=(s.levels||[]).slice(0,2).concat((s.field||"").split(" /").slice(0,1)).filter(Boolean);
   return '<article class="card"><div class="tags">'+tags.map(function(t){return '<span class="tag">'+t+'</span>'}).join("")+'</div><h3>'+s.name+'</h3><div class="provider">'+s.provider+'</div><div class="meta"><div><small>Eligibility</small><b>'+((s.nationality||[]).join(", ")||"See official source")+'</b></div><div><small>Award</small><b>'+s.award+'</b></div><div><small>Field</small><b>'+s.field+'</b></div><div><small>Deadline</small><b>'+s.deadline+'</b></div></div><a href="scholarship.html?id='+encodeURIComponent(s.name)+'">View scholarship →</a><a href="'+s.source+'" target="_blank" rel="noopener">Official source →</a><div class="verified">Verified: '+s.verified+'</div></article>'
 }).join("")||'<div class="card"><h3>No matching scholarships yet</h3><div class="provider">Try a broader search or remove a filter.</div></div>';
}
input.addEventListener("input",render);level.addEventListener("change",render);document.querySelector("#searchBtn").addEventListener("click",render);
document.querySelectorAll("[data-filter]").forEach(function(b){b.addEventListener("click",function(){level.value=["Secondary","JC","Polytechnic","University"].includes(b.dataset.filter)?b.dataset.filter:"";input.value=b.dataset.filter==="STEM"?"STEM":"";render()})});
render();
