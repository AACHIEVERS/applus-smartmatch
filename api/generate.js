export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY is not configured'});
  try{
    const {prompt}=req.body||{};
    if(!prompt) return res.status(400).json({error:'prompt is required'});
    const instruction='Create a presentation plan from this Chinese request. Return ONLY valid JSON: {"title":"...","slides":[{"type":"cover|content|chart|quote","title":"...","body":"...","bullets":["..."]}]}. Keep it practical and concise. Request: '+prompt;
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.OPENAI_API_KEY},body:JSON.stringify({model:'gpt-5.6-luna',input:instruction})});
    const data=await r.json();
    if(!r.ok) return res.status(r.status).json({error:data.error?.message||'OpenAI request failed'});
    let text='';
    for(const item of (data.output||[])) for(const part of (item.content||[])) if(part.type==='output_text') text+=part.text||'';
    const cleaned=text.replace(/^\s*```json\s*/,'').replace(/\s*```\s*$/,'').trim();
    return res.status(200).json(JSON.parse(cleaned));
  }catch(e){return res.status(500).json({error:e.message||'Generation error'});}
}