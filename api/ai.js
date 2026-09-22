export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
  try{
    const {command,slides=[]}=req.body||{};
    if(!command) return res.status(400).json({error:'command is required'});
    const prompt='You are the slide editing agent for SlideForge AI. Convert the user instruction into JSON operations. Return ONLY valid JSON with this shape: {"message":"short Chinese summary","operations":[{"action":"update","slide":1,"title":"...","body":"..."},{"action":"delete","slide":2},{"action":"add","title":"...","body":"..."}]}. Slide numbers are 1-based. Only include fields that should change. Preserve existing content unless asked to rewrite. Current slides: '+JSON.stringify(slides)+'. User instruction: '+command;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:'gpt-5.6-luna',input:prompt})});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data.error?.message||'OpenAI request failed'});
    let text='';
    for(const item of (data.output||[])) for(const part of (item.content||[])) if(part.type==='output_text') text+=part.text||'';
    const cleaned=text.replace(/^\s*```json\s*/,'').replace(/\s*```\s*$/,'').trim();
    return res.status(200).json(JSON.parse(cleaned));
  }catch(e){return res.status(500).json({error:e.message||'Agent error'});}
}