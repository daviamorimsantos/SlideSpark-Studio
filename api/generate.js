const crypto = require("crypto");
module.exports = async function(req,res){
  const origin=req.headers.origin||"";
  const allowed=["https://daviamorimsantos.github.io","http://localhost:3000","http://127.0.0.1:5500"];
  if(allowed.includes(origin))res.setHeader("Access-Control-Allow-Origin",origin);
  res.setHeader("Vary","Origin");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, x-studio-access-code");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  if(req.method==="OPTIONS")return res.status(204).end();
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Método não permitido."});}
  const expected=process.env.STUDIO_ACCESS_PASSWORD;
  const supplied=String(req.headers["x-studio-access-code"]||"");
  if(!expected)return res.status(503).json({error:"Configure STUDIO_ACCESS_PASSWORD no servidor."});
  const a=Buffer.from(supplied),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(401).json({error:"Acesso não autorizado. Digite novamente o código privado."});
  try{
    const brief=req.body||{};
    const topic=String(brief.topic||"").trim().slice(0,180);
    const slideCount=Number(brief.slideCount);
    const allowedVisuals=["dark","light","green","doodle","cartoon","comic","watercolor","pastel","retro","neon","infographic","notebook","science","minimal"];
    if(!topic)return res.status(400).json({error:"Informe o tema da apresentação."});
    if(!Number.isInteger(slideCount)||slideCount<5||slideCount>12)return res.status(400).json({error:"Escolha entre 5 e 12 slides."});
    const visual=allowedVisuals.includes(brief.visual)?brief.visual:"dark";
    const styleDescriptions={doodle:"desenho à mão e doodles de caderno, rabiscos, setas, pequenas ilustrações lineares",cartoon:"cartoon ilustrado, formas divertidas, personagens estilizados e contornos suaves",notebook:"caderno escolar colorido, papel pautado, anotações e desenhos feitos à mão",science:"ciência e laboratório, diagramas didáticos, símbolos científicos e visual limpo",minimal:"minimalista elegante, fundo claro, muito espaço em branco e tipografia organizada",dark:"premium escuro, roxo e azul, visual sofisticado",light:"minimalista acadêmico, fundo claro e hierarquia limpa",green:"natureza e sustentabilidade, verdes e formas orgânicas",sketch:"caderno desenhado à mão, papel pautado, rabiscos, setas, sublinhados e pequenas ilustrações lineares",comic:"quadrinhos, contornos marcados, balões, onomatopeias moderadas e composição dinâmica",watercolor:"aquarela, manchas translúcidas, paleta suave e elementos orgânicos",pastel:"pastel criativo, cores suaves, formas arredondadas e visual leve",retro:"revista vintage, cores terrosas, títulos editoriais e textura de papel",neon:"futurista neon, ciência e tecnologia, alto contraste e linhas luminosas",infographic:"infográfico, organização por blocos, diagramas simples, comparações e dados em destaque",sport:"esportivo, energia, movimento, linhas diagonais e contraste forte"};
    const systemInstruction=`Você cria apresentações educacionais em português brasileiro. Retorne APENAS JSON válido. Faça exatamente ${slideCount} slides. Primeiro slide é capa; último slide é conclusão e, quando apropriado, referências. Cada slide deve ter 2 a 5 tópicos curtos e notas de apresentador de 1 a 3 frases. Inclua visualSuggestion detalhada com ideias de desenhos, ícones, diagramas ou ilustrações que combinem com o tema visual: ${styleDescriptions[visual]}. Nos temas desenho à mão e caderno, sugerir desenhos à mão, setas e pequenas anotações; no cartoon, sugerir personagens e objetos ilustrados; em quadrinhos, painéis e balões; em aquarela, ilustrações orgânicas; em infográfico, diagramas simples. Não afirme que imagens foram baixadas ou geradas como arquivos de imagem. Nunca invente citações, estatísticas, leis, datas ou referências. Não garanta nota ou aprovação.`;
    const userPrompt=`Crie uma apresentação sobre: ${topic}\nMatéria: ${String(brief.subject||"não informada").slice(0,80)}\nNível: ${String(brief.grade||"Ensino Médio").slice(0,80)}\nTom: ${String(brief.tone||"Didática e simples").slice(0,80)}\nOrientações do professor: ${String(brief.instructions||"não informadas").slice(0,1800)}\nTema visual: ${styleDescriptions[visual]}.\nResponda em JSON: {"title":string,"slides":[{"title":string,"kicker":string,"bullets":string[],"speakerNotes":string,"visualSuggestion":string}]}.`;
    const key=process.env.GEMINI_API_KEY;if(!key)return res.status(503).json({error:"Configure GEMINI_API_KEY no servidor para ativar a geração."});
    const model=process.env.GEMINI_MODEL||"gemini-2.5-flash";
    const apiResponse=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({systemInstruction:{parts:[{text:systemInstruction}]},contents:[{parts:[{text:userPrompt}]}],generationConfig:{responseMimeType:"application/json",temperature:0.7}})});
    const apiData=await apiResponse.json().catch(()=>({}));
    if(!apiResponse.ok){console.error("Gemini error",apiData.error?.message||apiResponse.status);return res.status(502).json({error:"A IA não conseguiu gerar agora. Tente novamente."});}
    const raw=apiData.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("");if(!raw)throw new Error("A IA retornou uma resposta vazia.");
    const parsed=JSON.parse(raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/, ""));
    if(!Array.isArray(parsed.slides)||parsed.slides.length!==slideCount)throw new Error("A IA retornou uma quantidade inesperada de slides.");
    const slides=parsed.slides.map((s,i)=>({title:typeof s.title==="string"?s.title.slice(0,180):`Slide ${i+1}`,kicker:typeof s.kicker==="string"?s.kicker.slice(0,70):"APRESENTAÇÃO ESCOLAR",bullets:Array.isArray(s.bullets)?s.bullets.slice(0,6).map(x=>String(x).slice(0,420)):[],speakerNotes:typeof s.speakerNotes==="string"?s.speakerNotes.slice(0,1000):"",visualSuggestion:typeof s.visualSuggestion==="string"?s.visualSuggestion.slice(0,400):""}));
    return res.status(200).json({title:String(parsed.title||topic).slice(0,180),slides,visual});
  }catch(error){console.error("generate",error.message);return res.status(500).json({error:error.message||"Erro interno ao gerar a apresentação."});}
};
