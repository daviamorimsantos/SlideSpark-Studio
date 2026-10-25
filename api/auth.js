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
  if(!expected)return res.status(503).json({error:"O código privado ainda não foi configurado no servidor."});
  const supplied=String((req.body||{}).accessCode||"");
  const a=Buffer.from(supplied), b=Buffer.from(expected);
  const ok=a.length===b.length && crypto.timingSafeEqual(a,b);
  if(!ok)return res.status(401).json({error:"Código de acesso incorreto."});
  return res.status(200).json({ok:true});
};
