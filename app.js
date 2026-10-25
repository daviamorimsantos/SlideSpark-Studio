const $ = id => document.getElementById(id);
const state = {slides:[],index:0,theme:"dark",accessCode:sessionStorage.getItem("slidespark_access_code")||""};
$("year").textContent=new Date().getFullYear();
const nav=document.querySelector("nav");
$("mobileMenu").addEventListener("click",()=>nav.classList.toggle("open"));
nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>nav.classList.remove("open")));
const API_BASE=(window.SLIDESPARK_API_BASE||"").replace(/\/$/,"");
const apiUrl=path=>`${API_BASE}${path}`;
function toast(message){const node=$("toast");node.textContent=message;node.classList.add("show");setTimeout(()=>node.classList.remove("show"),3200);}
function setMessage(message,isError=false){$("formMessage").textContent=message;$("formMessage").style.color=isError?"#ffb9b9":"#9af0ce";}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cssHex(hex){return `#${hex}`;}
function updatePromptPreview(){const topic=$("topic").value.trim();if(topic){$("previewTitle").innerHTML=`${escapeHtml(topic.slice(0,36))}<br><em>em destaque.</em>`;$("previewSubtitle").textContent=`Uma apresentação de ${$("slideCount").value} slides para ${$("grade").value.toLowerCase()}.`;}else{$("previewTitle").innerHTML="Sua ideia<br><em>em destaque.</em>";$("previewSubtitle").textContent="Uma estrutura clara para explicar o que você aprendeu.";}}
["topic","slideCount","grade"].forEach(id=>$(id).addEventListener("input",updatePromptPreview));
function showStudio(){$("accessGate").classList.add("hidden");}
$("accessForm").addEventListener("submit",async e=>{e.preventDefault();const code=$("accessCode").value;const button=$("accessButton");button.disabled=true;button.textContent="Verificando…";try{const r=await fetch(apiUrl("/api/auth"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accessCode:code})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||"Código incorreto.");state.accessCode=code;sessionStorage.setItem("slidespark_access_code",code);showStudio();}catch(err){$("accessMessage").textContent=err.message||"Não foi possível validar o acesso.";$("accessMessage").style.color="#ffb9b9";}finally{button.disabled=false;button.innerHTML='Entrar no estúdio <span>→</span>';}});
if(state.accessCode){showStudio();}
$("briefForm").addEventListener("submit",async e=>{e.preventDefault();if(!state.accessCode){$("accessGate").classList.remove("hidden");return;}const button=$("generateButton");button.disabled=true;button.textContent="Criando apresentação…";setMessage("A IA está estruturando os slides. Isso pode levar alguns segundos.");const payload={topic:$("topic").value.trim(),subject:$("subject").value.trim(),grade:$("grade").value,slideCount:Number($("slideCount").value),tone:$("tone").value,instructions:$("instructions").value.trim(),visual:$("visual").value};try{const response=await fetch(apiUrl("/api/generate"),{method:"POST",headers:{"Content-Type":"application/json","x-studio-access-code":state.accessCode},body:JSON.stringify(payload)});const data=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401){state.accessCode="";sessionStorage.removeItem("slidespark_access_code");$("accessGate").classList.remove("hidden");}throw new Error(data.error||"Não foi possível gerar a apresentação.");}state.slides=data.slides;state.theme=data.visual||payload.visual;state.index=0;renderSlide();$("resultModal").classList.add("open");$("resultModal").setAttribute("aria-hidden","false");setMessage("Apresentação pronta! Revise antes de exportar.");}catch(error){setMessage(error.message||"Erro de conexão. Confira se o backend está configurado.",true);}finally{button.disabled=false;button.innerHTML='Gerar apresentação <span>✦</span>';}});
function getPalette(){const palettes={dark:{bg:"171629",fg:"F7F5FF",accent:"B4A2FF",muted:"D0CDE1",shape:"3B315F"},light:{bg:"F4F5FB",fg:"22213A",accent:"6552C7",muted:"66657C",shape:"DCD7FF"},green:{bg:"102A27",fg:"F1FFF9",accent:"63D8B0",muted:"B2D0C7",shape:"24564A"},doodle:{bg:"FFF9E9",fg:"283047",accent:"E36B4B",muted:"5E6473",shape:"F5D66F"},cartoon:{bg:"FFF5F0",fg:"28233D",accent:"FF6D5A",muted:"625D70",shape:"FFD166"},comic:{bg:"FFF8D9",fg:"171717",accent:"E63946",muted:"3D405B",shape:"F4A261"},watercolor:{bg:"F8F2F7",fg:"42364C",accent:"A56CC1",muted:"75677D",shape:"E2C9E8"},infographic:{bg:"F2F7FA",fg:"203047",accent:"168AAD",muted:"5A6B7B",shape:"BDE0FE"},notebook:{bg:"FFFDF4",fg:"283044",accent:"4385F5",muted:"5D6878",shape:"FFE08A"},minimal:{bg:"F6F6F4",fg:"222222",accent:"4D5B57",muted:"6B716F",shape:"D6DDD8"},retro:{bg:"F6E9D2",fg:"3B2723",accent:"C95D36",muted:"72554A",shape:"E6B566"},science:{bg:"EEF8FC",fg:"123044",accent:"147D92",muted:"4F6F7E",shape:"B9E6F2"}};return palettes[state.theme]||palettes.dark;}
function renderSlide(){const s=state.slides[state.index],box=$("resultSlide"),c=getPalette();box.style.background=`linear-gradient(140deg,#${c.bg},#${c.shape})`;box.style.color=cssHex(c.fg);box.dataset.theme=state.theme;const bullets=(s.bullets||[]).map(x=>"• "+x).join("\n");box.innerHTML=`<div class="slide-decoration" style="background:${cssHex(c.accent)}"></div><div class="slide-kicker" style="color:${cssHex(c.accent)}">${escapeHtml(s.kicker||"APRESENTAÇÃO ESCOLAR")}</div><h3>${escapeHtml(s.title||"Slide")}</h3><div class="slide-body" style="color:${cssHex(c.fg)}">${escapeHtml(bullets)}${s.visualSuggestion?"\n\n✎ IDEIA VISUAL: "+escapeHtml(s.visualSuggestion):""}${s.speakerNotes?"\n\nNOTAS: "+escapeHtml(s.speakerNotes):""}</div><span class="slide-number" style="color:${cssHex(c.muted)}">${String(state.index+1).padStart(2,"0")} / ${String(state.slides.length).padStart(2,"0")}</span>`;$("slideCounter").textContent=`${state.index+1} / ${state.slides.length}`;$("prevSlide").disabled=state.index===0;$("nextSlide").disabled=state.index===state.slides.length-1;}
$("prevSlide").addEventListener("click",()=>{if(state.index>0){state.index--;renderSlide();}});
$("nextSlide").addEventListener("click",()=>{if(state.index<state.slides.length-1){state.index++;renderSlide();}});
function closeModal(){$("resultModal").classList.remove("open");$("resultModal").setAttribute("aria-hidden","true");}
$("closeModal").addEventListener("click",closeModal);$("resultModal").addEventListener("click",e=>{if(e.target===$("resultModal"))closeModal();});
$("downloadPptx").addEventListener("click", async () => {
  if (!state.slides.length) return;
  if (!window.PptxGenJS) { toast("Não foi possível carregar o exportador PowerPoint. Verifique sua conexão."); return; }
  try {
    const pptx = new window.PptxGenJS(); pptx.layout = "LAYOUT_WIDE"; pptx.author = "SlideSpark AI"; pptx.subject = "Apresentação escolar gerada com IA"; pptx.title = $("topic").value || "Apresentação escolar"; pptx.company = "SlideSpark AI";
    pptx.theme = {headFontFace:"Aptos Display",bodyFontFace:"Aptos",lang:"pt-BR"};
    const c = getPalette();
    state.slides.forEach((s, idx) => {
      const slide = pptx.addSlide(); slide.background = {color:c.bg};
      slide.addShape(state.theme === "comic" ? pptx.ShapeType.rect : pptx.ShapeType.rect,{x:0,y:0,w:state.theme === "sketch" ? .08 : .16,h:7.5,fill:{color:c.accent},line:{color:c.accent}});
      slide.addText((s.kicker || "APRESENTAÇÃO ESCOLAR").toUpperCase(),{x:.65,y:.48,w:10.8,h:.28,fontFace:"Aptos",fontSize:9,bold:true,charSpacing:2,color:c.accent,margin:0});
      slide.addText(s.title || "Slide",{x:.65,y:1.0,w:11.7,h:1.25,fontFace:"Aptos Display",fontSize:idx===0?31:27,bold:true,color:c.fg,breakLine:false,fit:"shrink",margin:0.02});
      const bullets = (s.bullets || []).map(t=>({text:t,options:{bullet:{indent:14},hanging:3,breakLine:true,paraSpaceAfterPt:12}}));
      if(bullets.length) slide.addText(bullets,{x:.82,y:2.55,w:9.1,h:3.65,fontFace:"Aptos",fontSize:17,color:c.fg,breakLine:false,fit:"shrink",valign:"top",margin:.04,paraSpaceAfterPt:12});
      if(s.visualSuggestion) slide.addText("IDEIA VISUAL: "+s.visualSuggestion,{x:.82,y:6.35,w:10.2,h:.45,fontFace:"Aptos",fontSize:9,italic:true,color:c.muted,fit:"shrink",margin:0});
      if (state.theme === "sketch") {
        slide.addShape(pptx.ShapeType.line,{x:10.3,y:.6,w:1.6,h:.5,line:{color:c.accent,width:2,dash:"dash"}});
        slide.addShape(pptx.ShapeType.ellipse,{x:10.7,y:5.15,w:1.5,h:1.5,fill:{color:c.shape,transparency:15},line:{color:c.accent,width:1.5,dash:"dash"}});
      } else if (state.theme === "comic") {
        slide.addShape(pptx.ShapeType.star5,{x:10.6,y:5.15,w:1.7,h:1.7,fill:{color:c.shape},line:{color:c.fg,width:2}});
      } else {
        slide.addShape(state.theme === "comic" ? pptx.ShapeType.star5 : (state.theme === "sketch" ? pptx.ShapeType.line : pptx.ShapeType.ellipse), state.theme === "sketch" ? {x:9.8,y:5.7,w:2.4,h:1.3,line:{color:c.accent,width:2,dash:"dash"}} : {x:10.6,y:5.2,w:2.2,h:2.2,fill:{color:c.shape,transparency:20},line:{color:c.shape,transparency:100}});
      }
      slide.addText(`${String(idx+1).padStart(2,"0")} / ${String(state.slides.length).padStart(2,"0")}`,{x:11.1,y:7.08,w:1.45,h:.2,fontSize:8,color:c.muted,align:"right",margin:0});
      if(s.speakerNotes && slide.addNotes) slide.addNotes(s.speakerNotes);
    });
    await pptx.writeFile({fileName:"SlideSpark-Apresentacao.pptx"});
  } catch (e) { console.error(e); toast("Erro ao exportar PowerPoint. Tente novamente."); }
});
$("downloadPdf").addEventListener("click", () => {
  if (!state.slides.length) return;
  if (!window.jspdf || !window.jspdf.jsPDF) { toast("Não foi possível carregar o exportador PDF. Verifique sua conexão."); return; }
  try {
    const {jsPDF} = window.jspdf; const pdf = new jsPDF({orientation:"landscape",unit:"mm",format:[297,167]}); const c=getPalette();
    state.slides.forEach((s,idx)=>{
      if(idx) pdf.addPage([297,167],"landscape");
      const bg=hex(c.bg), fg=hex(c.fg), accent=hex(c.accent), muted=hex(c.muted), shape=hex(c.shape);
      pdf.setFillColor(...bg);pdf.rect(0,0,297,167,"F");pdf.setFillColor(...accent);pdf.rect(0,0,3,167,"F");
      pdf.setTextColor(...accent);pdf.setFont("helvetica","bold");pdf.setFontSize(9);pdf.text(String(s.kicker||"APRESENTAÇÃO ESCOLAR").toUpperCase(),16,17);
      pdf.setTextColor(...fg);pdf.setFontSize(idx===0?27:24);const titleLines=pdf.splitTextToSize(s.title||"Slide",245);pdf.text(titleLines,16,37);
      const startY=37+titleLines.length*10;pdf.setFont("helvetica","normal");pdf.setFontSize(14);pdf.setTextColor(...fg);
      const bullets=(s.bullets||[]).map(t=>"• "+t);let y=startY+8;
      bullets.forEach(t=>{const lines=pdf.splitTextToSize(t,242);if(y+lines.length*7>145)return;pdf.text(lines,19,y);y+=lines.length*7+5;});
      if(s.visualSuggestion){pdf.setFont("helvetica","italic");pdf.setFontSize(8);pdf.setTextColor(...muted);const visualLines=pdf.splitTextToSize("IDEIA VISUAL: "+s.visualSuggestion,220);pdf.text(visualLines.slice(0,2),19,151);}
      pdf.setDrawColor(...shape);pdf.setLineWidth(.5);if(state.theme==="comic"){pdf.setFillColor(...shape);pdf.triangle(251,124,281,143,251,158,"S");}else{pdf.circle(268,143,16,"S");}
      pdf.setTextColor(...muted);pdf.setFontSize(8);pdf.text(`${String(idx+1).padStart(2,"0")} / ${String(state.slides.length).padStart(2,"0")}`,278,158,{align:"right"});
    });
    pdf.save("SlideSpark-Apresentacao.pdf");
  } catch(e){console.error(e);toast("Erro ao exportar PDF. Tente novamente.");}
});
function hex(value){return [parseInt(value.slice(0,2),16),parseInt(value.slice(2,4),16),parseInt(value.slice(4,6),16)];}


