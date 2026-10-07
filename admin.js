const SUPABASE_URL="https://xndgplkeayyrtzqgphlj.supabase.co";
const SUPABASE_KEY="sb_publishable_QQ_FVe4_XJA8vaLWg9FXPQ_PwamKnNa";
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});

const $=id=>document.getElementById(id);
function show(id){$(id).hidden=false}
function hide(id){$(id).hidden=true}
function message(text,ok=false){$("createMessage").textContent=text;$("createMessage").className="message"+(ok?" ok":"")}

async function getAdminSession(){
 const refreshed=await client.auth.refreshSession();
 const session=refreshed.data.session;
 if(refreshed.error||!session)return null;
 const {data:userData}=await client.auth.getUser();
 const user=userData?.user;
 if(!user)return null;
 return user;
}

async function loadUsers(){
 await client.auth.refreshSession();
 const list=$("usersList");list.innerHTML='<div class="empty">Loading accounts…</div>';
 try{
   const {data,error}=await client.functions.invoke("admin-list-users",{body:{}});
   if(error||!data?.ok){list.innerHTML='<div class="empty">Unable to load accounts.</div>';return}
   const users=data.users||[];
   if(!users.length){list.innerHTML='<div class="empty">No student accounts yet.</div>';return}
   list.innerHTML=users.map(u=>'<div class="user-row"><div><strong>'+escapeHtml(u.email)+'</strong><span>'+escapeHtml(u.name||u.email)+'</span></div><span class="status">Active</span></div>').join("");
 }catch(e){list.innerHTML='<div class="empty">Unable to load accounts.</div>'}
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("createBtn").addEventListener("click",async()=>{
 const email=$("email").value.trim().toLowerCase(),password=$("password").value,name=$("name").value.trim();
 if(!email||!password){message("Enter email and password.");return}
 if(password.length<8){message("Password must be at least 8 characters.");return}
 $("createBtn").disabled=true;message("Creating user…");
 try{
   await client.auth.refreshSession();
   const {data,error}=await client.functions.invoke("admin-create-user",{body:{email,password,name}});
   if(error||!data?.ok){message(data?.error||"Unable to create user.");return}
   message("User created: "+data.user.email,true);
   $("email").value="";$("password").value="";$("name").value="";
   await loadUsers();
 }catch(e){message("Unable to create user right now.")}
 finally{$("createBtn").disabled=false}
});
$("refreshBtn").addEventListener("click",loadUsers);
$("signOutBtn").addEventListener("click",async()=>{await client.auth.signOut();location.href="index.html"});

(async()=>{
 let user=await getAdminSession();
 hide("loadingView");
 if(!user){$("deniedMessage").textContent="Please sign in on the Medicine page first.";show("deniedView");return}

 // One-time bootstrap is restricted server-side to the original administrator UID.
 if(user.id==="a160669e-847e-45e6-99fb-e51f93f18705" && user.app_metadata?.role!=="admin"){
   const {data,error}=await client.functions.invoke("admin-bootstrap",{body:{}});
   if(error||!data?.ok){
     $("deniedMessage").textContent=data?.error||"Administrator initialization failed.";
     show("deniedView");
     return;
   }
   await client.auth.refreshSession();
   user=await getAdminSession();
 }

 if(user?.app_metadata?.role!=="admin"){show("deniedView");return}
 $("adminIdentity").textContent="Admin · "+(user.user_metadata?.display_name||user.user_metadata?.name||"Administrator");
 show("adminView");
 await loadUsers();
})();
