const SUPABASE_URL="https://xndgplkeayyrtzqgphlj.supabase.co";
const SUPABASE_KEY="sb_publishable_QQ_FVe4_XJA8vaLWg9FXPQ_PwamKnNa";
const client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});

const $=id=>document.getElementById(id);
function show(id){$(id).hidden=false}
function hide(id){$(id).hidden=true}
function message(text,ok=false){$("createMessage").textContent=text;$("createMessage").className="message"+(ok?" ok":"")}

async function getAdminSession(){
 const {data,error}=await client.auth.getSession();
 if(error||!data.session)return null;
 const {data:userData}=await client.auth.getUser();
 const user=userData?.user;
 if(!user)return null;
 return user;
}

async function loadUsers(){
 const list=$("usersList");list.innerHTML='<div class="empty">Loading accounts…</div>';
 try{
   const {data,error}=await client.functions.invoke("admin-list-users",{body:{}});
   if(error||!data?.ok){list.innerHTML='<div class="empty">Unable to load accounts.</div>';return}
   const users=data.users||[];
   if(!users.length){list.innerHTML='<div class="empty">No student accounts yet.</div>';return}
   list.innerHTML=users.map(u=>'<div class="user-row"><div><strong>'+escapeHtml(u.username)+'</strong><span>'+escapeHtml(u.name||u.username)+'</span></div><span class="status">Active</span></div>').join("");
 }catch(e){list.innerHTML='<div class="empty">Unable to load accounts.</div>'}
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

$("createBtn").addEventListener("click",async()=>{
 const username=$("username").value.trim().toLowerCase(),password=$("password").value,name=$("name").value.trim();
 if(!username||!password){message("Enter User ID and password.");return}
 if(password.length<8){message("Password must be at least 8 characters.");return}
 $("createBtn").disabled=true;message("Creating user…");
 try{
   const {data,error}=await client.functions.invoke("admin-create-user",{body:{username,password,name}});
   if(error||!data?.ok){message(data?.error||"Unable to create user.");return}
   message("User created: "+data.user.username,true);
   $("username").value="";$("password").value="";$("name").value="";
   await loadUsers();
 }catch(e){message("Unable to create user right now.")}
 finally{$("createBtn").disabled=false}
});
$("refreshBtn").addEventListener("click",loadUsers);
$("signOutBtn").addEventListener("click",async()=>{await client.auth.signOut();location.href="index.html"});

(async()=>{
 const user=await getAdminSession();
 hide("loadingView");
 if(!user){$("deniedMessage").textContent="Please sign in on the Medicine page first.";show("deniedView");return}
 if(user.app_metadata?.role!=="admin"){show("deniedView");return}
 $("adminIdentity").textContent="Admin · "+(user.user_metadata?.username||user.email||"");
 show("adminView");
 await loadUsers();
})();
