/* Mapa mental do painel (estilo MindMaster). Adaptado do módulo independente "export-mapa".
   Uso: MapaMental(G) devolve {MM, renderMapa, mmReceber, mmNorm, LS_MAPAS}. Contrato G em MapaMentalTab.jsx.
   Diferenças da versão original: exportado como módulo ES; variáveis CSS com prefixo --mm-
   (não colidem com o tema do site); marca vem de G.marca / G.logo; "demandas" viram IMÓVEIS;
   modelos voltados a corretor de imóveis; mapas-modelo automáticos só se G.semear. */
import { raizVisaoCeo, EXTRA_VISAO_CEO } from "../../../lib/mapasProntos";

export default function MapaMental(G){
"use strict";
const {h, svg, icon, menuPopup, caixaDialogo, copiarTexto, setStatus, openPeek, onDbErr, editingNow, state} = G;
if(!document.getElementById("mapa-mental-css")){ const st = document.createElement("style"); st.id = "mapa-mental-css"; st.textContent = "/* ---- Mapa mental (estilo MindMaster) ---- */\n.mm{display:flex;flex-direction:column;height:calc(100vh - 200px);min-height:560px;border:1px solid var(--mm-border-2);border-radius:8px;overflow:hidden;background:#fff;margin-top:12px;position:relative;user-select:none;-webkit-user-select:none}\n.mm.cheia{position:fixed;inset:0;height:auto;margin:0;border-radius:0;z-index:38;border:0}\n.mm-rib{border-bottom:1px solid var(--mm-border-2);background:#fafaf9;flex:none}\n.mm-rib-tabs{display:flex;gap:2px;padding:4px 8px 0;overflow-x:auto}\n.mm-rib-tabs button{padding:6px 12px;font-size:13px;color:var(--mm-text-2);border-radius:6px 6px 0 0;white-space:nowrap}\n.mm-rib-tabs button[aria-selected=true]{background:#fff;color:var(--mm-text);box-shadow:0 -1px 0 var(--mm-border-2) inset;font-weight:500;border:1px solid var(--mm-border-2);border-bottom-color:#fff;margin-bottom:-1px}\n.mm-rib-body{display:flex;gap:4px;padding:6px 8px;background:#fff;overflow-x:auto;align-items:stretch;border-top:1px solid var(--mm-border-2)}\n.mm-grp{display:flex;gap:2px;align-items:stretch;padding-right:6px;margin-right:4px;border-right:1px solid var(--mm-border)}\n.mm-grp:last-child{border-right:0}\n.mm-b{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:58px;padding:4px 6px;border-radius:6px;font-size:11.5px;color:var(--mm-text);white-space:nowrap;line-height:1.1}\n.mm-b:hover{background:var(--mm-hover)}\n.mm-b.on{background:#e7f0fb;color:#1b72ca}\n.mm-b:disabled{opacity:.35;cursor:default;background:none}\n.mm-b .ic{width:20px;height:20px}\n.mm-corpo{flex:1;display:flex;min-height:0}\n.mm-arq{width:220px;flex:none;border-right:1px solid var(--mm-border-2);display:flex;flex-direction:column;background:#fbfbfa;min-height:0}\n.mm-arq-top{padding:10px;display:flex;flex-direction:column;gap:8px;border-bottom:1px solid var(--mm-border)}\n.mm-arq-top .btn{justify-content:center}\n.mm-arq input{font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--mm-border-2);border-radius:6px;width:100%;background:#fff}\n.mm-arq-lista{flex:1;overflow:auto;padding:6px}\n.mm-arq-it{display:flex;align-items:center;gap:6px;padding:7px 8px;border-radius:6px;cursor:pointer;font-size:13px}\n.mm-arq-it:hover{background:var(--mm-hover)}\n.mm-arq-it.on{background:#e7f0fb}\n.mm-arq-it .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}\n.mm-arq-it .dt{display:block;font-size:11px;color:var(--mm-text-3);font-weight:400}\n.mm-arq-it .mn{opacity:0;padding:2px;border-radius:4px}\n.mm-arq-it:hover .mn,.mm-arq-it.on .mn{opacity:1}\n.mm-arq-vazio{font-size:12px;color:var(--mm-text-3);padding:12px;text-align:center}\n.mm-tela{flex:1;position:relative;overflow:hidden;cursor:default;outline:none;touch-action:none;min-width:0}\n.mm-tela.pan{cursor:grabbing}\n.mm-tela.rel{cursor:crosshair}\n.mm-mundo{position:absolute;left:0;top:0;transform-origin:0 0}\n.mm-mundo.anim{transition:transform .45s cubic-bezier(.3,.7,.3,1)}\n.mm-svg{position:absolute;left:0;top:0;overflow:visible;width:1px;height:1px;pointer-events:none}\n.mm-svg .rel-hit{pointer-events:stroke;cursor:pointer}\n.mm-svg .rel-h{pointer-events:all;cursor:move}\n.mm-svg .rel-tx{pointer-events:all;cursor:pointer}\n.mm-no{position:absolute;left:0;top:0;width:max-content;display:flex;flex-direction:column;align-items:flex-start;gap:3px;cursor:default;box-sizing:border-box;line-height:1.35;color:#14130F}\n.mm-no .ln{display:flex;align-items:center;gap:5px;max-width:600px}\n.mm-no .tx{white-space:pre-wrap;word-break:break-word;max-width:260px;outline:none;min-width:8px}\n.mm-no .tx[contenteditable]{cursor:text;user-select:text;-webkit-user-select:text;background:rgba(255,255,255,.85);color:#14130F;border-radius:3px;box-shadow:0 0 0 1px #2383e2}\n.mm-no.sel{box-shadow:0 0 0 2px #fff,0 0 0 4px #2383e2}\n.mm-no.alvo-filho{box-shadow:0 0 0 3px #f2a33a}\n.mm-no.alvo-antes{box-shadow:0 -4px 0 0 #f2a33a}\n.mm-no.alvo-depois{box-shadow:0 4px 0 0 #f2a33a}\n.mm-no.achado{box-shadow:0 0 0 3px #fbe36b}\n.mm-no.dim{opacity:.13}\n.mm-no.fant{opacity:.55;pointer-events:none;z-index:5}\n.mm-mk{display:inline-flex;gap:2px;align-items:center;flex:none}\n.mm-mk svg{width:16px;height:16px;display:block}\n.mm-mk .em{font-size:14px;line-height:1}\n.mm-ics{display:inline-flex;gap:3px;align-items:center;flex:none;opacity:.75}\n.mm-ics .ic{width:13px;height:13px}\n.mm-ics a,.mm-ics button{display:flex;color:inherit;padding:1px;border-radius:3px}\n.mm-ics a:hover,.mm-ics button:hover{background:rgba(0,0,0,.08)}\n.mm-tags{display:flex;gap:3px;flex-wrap:wrap;max-width:260px}\n.mm-tags span{font-size:10.5px;padding:0 6px;border-radius:8px;background:#e9e4d8;color:#4a4436;line-height:16px;font-weight:500}\n.mm-dem{font-size:10.5px;display:inline-flex;align-items:center;gap:3px;background:#d3e5ef;color:#183347;padding:0 6px;border-radius:8px;line-height:16px;cursor:pointer;max-width:200px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:500}\n.mm-tg{position:absolute;width:15px;height:15px;border-radius:50%;background:#fff;border:1.3px solid #8a8a8a;font-size:10px;line-height:12px;text-align:center;color:#555;cursor:pointer;padding:0;font-weight:600;z-index:2}\n.mm-tg:hover{border-color:#2383e2;color:#2383e2}\n.mm-tg.fech{width:auto;min-width:17px;padding:0 3px;border-radius:8px}\n.mm-laco{position:absolute;border:1px dashed #2383e2;background:rgba(35,131,226,.08);pointer-events:none;z-index:6}\n.mm-fmt{width:260px;flex:none;border-left:1px solid var(--mm-border-2);display:flex;flex-direction:column;background:#fbfbfa;min-height:0}\n.mm-fmt-tabs{display:flex;border-bottom:1px solid var(--mm-border-2)}\n.mm-fmt-tabs button{flex:1;padding:8px 4px;font-size:12.5px;color:var(--mm-text-2);border-bottom:2px solid transparent}\n.mm-fmt-tabs button[aria-selected=true]{color:var(--mm-text);border-bottom-color:#2383e2;font-weight:500}\n.mm-fmt-body{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:14px}\n.mm-sec h4{margin:0 0 6px;font-size:11.5px;font-weight:600;color:var(--mm-text-2);text-transform:uppercase;letter-spacing:.04em}\n.mm-sec .dica{font-size:12px;color:var(--mm-text-3);margin:0}\n.mm-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}\n.mm-gal button{border:1px solid var(--mm-border-2);border-radius:6px;padding:6px 2px 4px;display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;color:var(--mm-text-2);background:#fff}\n.mm-gal button.on{border-color:#2383e2;box-shadow:0 0 0 1px #2383e2;color:var(--mm-text)}\n.mm-gal svg{width:54px;height:34px}\n.mm-temas{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}\n.mm-temas button{border:1px solid var(--mm-border-2);border-radius:6px;padding:6px;background:#fff;display:flex;flex-direction:column;gap:4px;align-items:stretch;font-size:11px;text-align:left}\n.mm-temas button.on{border-color:#2383e2;box-shadow:0 0 0 1px #2383e2}\n.mm-temas .cs{display:flex;height:14px;border-radius:3px;overflow:hidden}\n.mm-temas .cs i{flex:1}\n.mm-cores{display:flex;flex-wrap:wrap;gap:4px;align-items:center}\n.mm-cores button{width:20px;height:20px;border-radius:4px;border:1px solid rgba(0,0,0,.15);padding:0}\n.mm-cores button.on{box-shadow:0 0 0 2px #fff,0 0 0 3.5px #2383e2}\n.mm-cores button.nada{background:linear-gradient(135deg,#fff 45%,#e33 46%,#e33 54%,#fff 55%)!important}\n.mm-cores input[type=color]{width:24px;height:22px;border:0;padding:0;background:none;cursor:pointer}\n.mm-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}\n.mm-row select,.mm-fmt input[type=text],.mm-fmt input[type=url],.mm-fmt textarea{font:inherit;font-size:13px;padding:5px 7px;border:1px solid var(--mm-border-2);border-radius:6px;background:#fff;color:var(--mm-text)}\n.mm-fmt textarea{width:100%;min-height:140px;resize:vertical;box-sizing:border-box;user-select:text}\n.mm-fmt input[type=text],.mm-fmt input[type=url]{width:100%;box-sizing:border-box}\n.mm-seg{display:inline-flex;border:1px solid var(--mm-border-2);border-radius:6px;overflow:hidden;background:#fff}\n.mm-seg button{padding:4px 9px;font-size:12px;border-right:1px solid var(--mm-border-2)}\n.mm-seg button:last-child{border-right:0}\n.mm-seg button.on{background:#e7f0fb;color:#1b72ca}\n.mm-mkgal{display:flex;flex-wrap:wrap;gap:3px}\n.mm-mkgal button{width:28px;height:28px;border-radius:5px;display:flex;align-items:center;justify-content:center;border:1px solid transparent}\n.mm-mkgal button:hover{background:var(--mm-hover)}\n.mm-mkgal button.on{border-color:#2383e2;background:#e7f0fb}\n.mm-mkgal svg{width:18px;height:18px}\n.mm-mkgal .em{font-size:17px}\n.mm-status{flex:none;display:flex;align-items:center;gap:10px;padding:4px 10px;border-top:1px solid var(--mm-border-2);background:#fafaf9;font-size:12px;color:var(--mm-text-2)}\n.mm-status .sp{flex:1}\n.mm-status button{padding:2px 6px;border-radius:4px}\n.mm-status button:hover{background:var(--mm-hover)}\n.mm-status input[type=range]{width:110px}\n.mm-busca{position:absolute;top:10px;right:10px;z-index:7;background:#fff;border-radius:8px;box-shadow:var(--mm-shadow);padding:6px;display:flex;gap:4px;align-items:center;font-size:12px}\n.mm-busca input{font:inherit;font-size:13px;border:1px solid var(--mm-border-2);border-radius:5px;padding:4px 7px;width:180px;user-select:text}\n.mm-vazio{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--mm-text-2);text-align:center;padding:20px}\n.mm-modelos{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;width:100%;max-width:720px}\n.mm-modelos button{border:1px solid var(--mm-border-2);border-radius:8px;background:#fff;padding:10px;display:flex;flex-direction:column;gap:6px;align-items:flex-start;text-align:left;font-size:13px}\n.mm-modelos button:hover{border-color:#2383e2}\n.mm-modelos b{font-weight:600}\n.mm-modelos span{font-size:11.5px;color:var(--mm-text-2)}\n.mm-modelos svg{width:100%;height:60px;background:#faf8f3;border-radius:5px}\n.mm-out{position:absolute;inset:0;overflow:auto;padding:24px 32px;background:#fff;user-select:text}\n.mm-out-l{display:flex;align-items:flex-start;gap:6px;padding:2px 0}\n.mm-out-l .bl{width:16px;height:22px;flex:none;display:flex;align-items:center;justify-content:center;color:var(--mm-text-3);cursor:pointer;font-size:10px}\n.mm-out-l .bl i{width:6px;height:6px;border-radius:50%;background:currentColor;display:block}\n.mm-out-l .bl.fech i{box-shadow:0 0 0 3px rgba(55,53,47,.18)}\n.mm-out-l input{flex:1;border:0;font:inherit;padding:2px 4px;border-radius:4px;background:transparent;color:var(--mm-text);min-width:0}\n.mm-out-l input:focus{background:#f3f7fc;outline:none}\n.mm-out-l.n0 input{font-size:20px;font-weight:700}\n.mm-out-l.n1 input{font-size:15px;font-weight:600}\n.mm-out .dica{font-size:12px;color:var(--mm-text-3);margin:0 0 14px}\n.mm-apres-bar{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);z-index:8;background:rgba(20,19,15,.88);color:#F2EDE3;border-radius:20px;display:flex;align-items:center;gap:6px;padding:4px 8px;font-size:13px}\n.mm-apres-bar button{color:#F2EDE3;padding:4px 10px;border-radius:14px}\n.mm-apres-bar button:hover{background:rgba(255,255,255,.12)}\n.mm.apres .mm-rib,.mm.apres .mm-arq,.mm.apres .mm-fmt,.mm.apres .mm-status,.mm.apres .mm-tg{display:none!important}\n.mm-dlg-lista{max-height:320px;overflow:auto;border:1px solid var(--mm-border-2);border-radius:6px;margin-bottom:10px}\n.mm-dlg-lista button{display:flex;width:100%;text-align:left;padding:7px 10px;border-bottom:1px solid var(--mm-border);font-size:13px;gap:8px}\n.mm-dlg-lista button:hover{background:var(--mm-hover)}\n.mm-dlg-lista small{color:var(--mm-text-3);margin-left:auto;white-space:nowrap}\n@media (max-width:900px){.mm-fmt{position:absolute;right:0;top:0;bottom:0;z-index:9;box-shadow:-4px 0 14px rgba(0,0,0,.12)}.mm-arq{position:absolute;left:0;top:0;bottom:0;z-index:9;box-shadow:4px 0 14px rgba(0,0,0,.12)}.mm-corpo{position:relative}}\n"; document.head.appendChild(st); }
if(!document.getElementById("mapa-mental-css2")){ const st = document.createElement("style"); st.id = "mapa-mental-css2"; st.textContent = "\n/* ---- Mapa mental: interface limpa (barras flutuantes) ---- */\n.mm.mm2{display:block;position:relative;height:calc(100vh - 190px);min-height:560px;border:1px solid var(--mm-border-2);border-radius:10px;overflow:hidden;background:#fff;margin-top:12px}\n.mm.mm2.cheia{position:fixed;inset:0;height:auto;margin:0;border-radius:0;border:0;z-index:38}\nhtml.mm-sem-rolagem,html.mm-sem-rolagem body{overflow:hidden}\n.mm2 .mm-tela{position:absolute;inset:0}\n.mm-bar{position:absolute;z-index:8;background:#fff;border-radius:14px;box-shadow:0 1px 3px rgba(15,15,30,.08),0 4px 18px rgba(15,15,30,.08);border:1px solid rgba(15,15,30,.06);display:flex;align-items:center;gap:2px;padding:6px}\n.mm-top-e{top:12px;left:12px;max-width:calc(100% - 340px)}\n.mm-top-d{top:12px;right:12px;gap:8px;background:none;box-shadow:none;border:0;padding:0}\n.mm-grp2{display:flex;align-items:center;gap:2px;background:#fff;border-radius:14px;box-shadow:0 1px 3px rgba(15,15,30,.08),0 4px 18px rgba(15,15,30,.08);border:1px solid rgba(15,15,30,.06);padding:6px}\n.mm-zoom{right:12px;bottom:12px;padding:4px}\n.mm-ctx{left:0;top:0;padding:5px 6px;border-radius:12px}\n.mm-ib{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#2f2f33;flex:none}\n.mm-ib:hover{background:#f1f2f6}\n.mm-ib.on{background:#e8edfd;color:#3d58d8}\n.mm-ib:disabled{opacity:.3;background:none;cursor:default}\n.mm-ib .ic{width:20px;height:20px}\n.mm-ib.destaque{background:#4F6BED;color:#fff;width:auto;padding:0 12px;gap:6px}\n.mm-ib.destaque:hover{background:#3d58d8}\n.mm-sep{width:1px;height:22px;background:rgba(15,15,30,.1);margin:0 4px;flex:none}\n.mm-logo{width:30px;height:30px;border-radius:8px;object-fit:contain;margin:0 4px}\n.mm-titulo{font:inherit;font-size:15px;font-weight:650;color:#1f1f23;border:0;background:transparent;padding:6px 8px;border-radius:8px;min-width:80px;max-width:360px}\n.mm-titulo:hover{background:#f1f2f6}\n.mm-titulo:focus{outline:2px solid #4F6BED;background:#fff}\n.mm-nuvem{display:flex;color:#8b8d98;padding:0 6px}\n.mm-nuvem .ic{width:20px;height:20px}\n.mm-nuvem.sync{color:#4F6BED}\n.mm-zt{font-size:12.5px;color:#55575f;min-width:46px;height:32px;border-radius:8px}\n.mm-zt:hover{background:#f1f2f6}\n.mm-mais{position:absolute;left:0;top:0;z-index:7;width:24px;height:24px;border-radius:50%;background:#4F6BED;color:#fff;font-size:18px;line-height:22px;font-weight:500;padding:0;box-shadow:0 2px 6px rgba(79,107,237,.35);display:flex;align-items:center;justify-content:center}\n.mm-mais:hover{background:#3d58d8;transform-origin:center}\n.mm-dica{position:absolute;left:0;top:0;z-index:6;font-size:13px;color:#7b7d86;display:flex;flex-direction:column;gap:8px;pointer-events:none;white-space:nowrap}\n.mm-dica kbd{font:inherit;font-size:12px;font-weight:600;color:#6b6d76;border:1.5px solid #d6d8e0;border-radius:5px;padding:1px 7px;margin-right:4px;background:#fff}\n.mm-toast{position:absolute;top:70px;left:50%;transform:translateX(-50%);z-index:9;background:#2f2f33;color:#fff;font-size:13px;padding:7px 14px;border-radius:18px;box-shadow:0 4px 14px rgba(0,0,0,.2)}\n.mm-pop{position:absolute;z-index:11;background:#fff;border-radius:12px;box-shadow:0 2px 6px rgba(15,15,30,.08),0 12px 32px rgba(15,15,30,.16);border:1px solid rgba(15,15,30,.07);width:300px;max-height:min(460px,calc(100% - 24px));overflow:auto}\n.mm-pop-corpo{padding:14px;display:flex;flex-direction:column;gap:14px}\n.mm-pop-corpo textarea{width:100%;min-height:120px;box-sizing:border-box;font:inherit;font-size:13px;padding:7px 9px;border:1px solid var(--mm-border-2);border-radius:8px;resize:vertical;user-select:text}\n.mm-pop-corpo input[type=text],.mm-pop-corpo input[type=url]{width:100%;box-sizing:border-box;font:inherit;font-size:13px;padding:6px 8px;border:1px solid var(--mm-border-2);border-radius:8px}\n.mm-pop-corpo select{font:inherit;font-size:13px;padding:5px 7px;border:1px solid var(--mm-border-2);border-radius:8px;background:#fff}\n.mm-painel-f{position:absolute;z-index:9;top:70px;bottom:64px;border-radius:12px;box-shadow:0 2px 6px rgba(15,15,30,.08),0 12px 32px rgba(15,15,30,.14);border:1px solid rgba(15,15,30,.07)!important;background:#fff!important;overflow:hidden}\n.mm2 .mm-arq.mm-painel-f{left:12px;width:250px}\n.mm2 .mm-fmt.mm-painel-f{right:12px;width:270px}\n.mm2 .mm-no.sel{box-shadow:none;outline:3px solid #4F8EF7;outline-offset:-3px}\n.mm2 .mm-no.sel::after{content:\"\";position:absolute;right:-8px;bottom:-8px;width:9px;height:9px;border-radius:50%;background:#fff;border:2px solid #4F8EF7}\n.mm2 .mm-no{transition:none}\n.mm2 .mm-no.f-sem.sel{outline-offset:3px;border-radius:10px}\n.mm2 .mm-no.f-sem:hover:not(.sel){background:rgba(15,15,30,.04)!important;border-radius:10px}\n.mm2 .mm-tg{width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid var(--cl,#AD1815);font-size:0;padding:0;color:transparent}\n.mm2 .mm-tg:hover{transform-origin:center;box-shadow:0 0 0 3px rgba(173,24,21,.15)}\n.mm2 .mm-tg.fech{width:auto;min-width:24px;height:18px;border-radius:9px;font-size:11px;font-weight:600;color:var(--cl,#AD1815);line-height:14px;padding:0 6px}\n.mm2 .mm-tg::after{content:attr(data-dica);position:absolute;left:50%;top:22px;transform:translateX(-50%);background:#4a4a52;color:#fff;font-size:13px;font-weight:500;padding:6px 12px;border-radius:16px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity .12s}\n.mm2 .mm-tg:hover::after{opacity:1}\n.mm2 .mm-arq.mm-painel-f{top:72px;bottom:12px;left:12px;width:240px;display:flex;flex-direction:column}\n.mm2 .mm-arq .mm-arq-top{border-bottom:1px solid rgba(15,15,30,.07)}\n.mm2 .mm-arq .mm-arq-top .btn{background:#4F6BED;border-color:#4F6BED;color:#fff;border-radius:9px}\n.mm2 .mm-arq-it{border-radius:9px;padding:8px 10px}\n.mm2 .mm-arq-it.on{background:#eef1fe}\n.mm2 .mm-arq-it.on .nm{color:#3d58d8}\n.mm-cat{font-size:11.5px;font-weight:600;color:#8b8d98;text-transform:uppercase;letter-spacing:.06em;margin:14px 0 8px}\n.mm-modelos svg{background:#fbfaf7!important}\n.mm2 .mm-tg{opacity:0;transition:opacity .12s}\n.mm2 .mm-tg.vis,.mm2 .mm-tg.hov,.mm2 .mm-tg.fech,.mm2 .mm-tg:hover{opacity:1}\n.mmw{display:grid;grid-template-columns:250px minmax(0,1fr);gap:18px;margin-top:12px;height:calc(100vh - 190px);min-height:560px}\n.mmw.sem-lado{grid-template-columns:minmax(0,1fr)}\n.mmw.sem-lado .mm-lado{display:none}\n.mm-lado{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--mm-border);padding-right:14px}\n.mm-lado .mm-arq-top{display:flex;flex-direction:column;gap:8px;padding:2px 0 12px;border-bottom:1px solid var(--mm-border)}\n.mm-lado-tit{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:650;color:var(--mm-text);padding:4px 2px 6px}\n.mm-lado-tit .ic{width:18px;height:18px;color:#AD1815}\n.mm-lado-nav{display:flex;align-items:center;gap:8px;padding:7px 8px;border-radius:7px;font-size:14px;color:var(--mm-text-2);text-align:left}\n.mm-lado-nav:hover{background:var(--mm-hover)}\n.mm-lado-nav.on{background:var(--mm-active);color:var(--mm-text);font-weight:500}\n.mm-lado-nav .ic{width:17px;height:17px}\n.mm-lado .btn{justify-content:center;background:#4F6BED;border-color:#4F6BED;color:#fff;border-radius:8px}\n.mm-lado input{font:inherit;font-size:13px;padding:7px 9px;border:1px solid var(--mm-border-2);border-radius:7px;width:100%;box-sizing:border-box;background:#fff}\n.mm-lado-sec{font-size:11.5px;font-weight:600;color:var(--mm-text-3);text-transform:uppercase;letter-spacing:.05em;margin:14px 2px 6px}\n.mm-lado .mm-arq-lista{flex:1;overflow:auto;padding:0;margin:0 -6px}\n.mm-lado .mm-arq-it{border-radius:7px;padding:7px 8px;margin:0 6px}\n.mm-lado .mm-arq-it.on{background:#eef1fe}\n.mm-lado .mm-arq-it.on .nm{color:#3d58d8}\n.mm-principal{position:relative;min-width:0;min-height:0}\n.mm-principal .mm.mm2{height:100%;margin:0;min-height:0}\n.mm-home{height:100%;overflow:auto;padding:4px 4px 40px}\n.mm-home-topo{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:8px}\n.mm-home-topo h2{margin:0 0 4px;font-size:22px;font-weight:700}\n.mm-home-topo p{margin:0;color:var(--mm-text-2);font-size:14px}\n.mm-home-topo .btn{background:#4F6BED;border-color:#4F6BED;color:#fff;border-radius:8px;flex:none}\n.mm-home-sec{font-size:12px;font-weight:600;color:var(--mm-text-3);text-transform:uppercase;letter-spacing:.06em;margin:22px 0 10px}\n.mm-home-grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px}\n.mm-card{display:flex;flex-direction:column;align-items:stretch;gap:4px;text-align:left;border:1px solid var(--mm-border-2);border-radius:12px;padding:10px;background:#fff;transition:box-shadow .15s,border-color .15s}\n.mm-card:hover{border-color:#c9cff7;box-shadow:0 6px 18px rgba(15,15,30,.08)}\n.mm-card-fig{background:#fbfaf7;border-radius:8px;margin-bottom:6px}\n.mm-card-fig svg{display:block;width:100%;height:auto}\n.mm-card b{font-size:14px;font-weight:600;color:var(--mm-text)}\n.mm-card span{font-size:12px;color:var(--mm-text-3)}\n.mm-card.mod span{color:var(--mm-text-2)}\n.mm-home-vazio{color:var(--mm-text-3);font-size:13px;padding:20px 0}\n@media (max-width:800px){.mmw{grid-template-columns:minmax(0,1fr)}.mm-lado{display:none}}\n.mm-home-lista{border:1px solid var(--mm-border-2);border-radius:10px;overflow:hidden;background:#fff}\n.mm-linha{display:grid;grid-template-columns:34px minmax(0,1fr) 70px 150px 110px 290px;align-items:center;gap:10px;padding:10px 14px;border-top:1px solid var(--mm-border);cursor:pointer;font-size:14px}\n.mm-linha:first-child{border-top:0}\n.mm-linha:hover{background:#f7f8fd}\n.mm-linha:focus-visible{outline:2px solid #4F6BED;outline-offset:-2px}\n.mm-linha.cab{cursor:default;font-size:11.5px;font-weight:600;color:var(--mm-text-3);text-transform:uppercase;letter-spacing:.05em;background:#fafaf9;padding:8px 14px}\n.mm-linha.cab:hover{background:#fafaf9}\n.mm-linha-ic{display:flex;color:#AD1815}\n.mm-linha-ic .ic{width:18px;height:18px}\n.mm-linha-nome{font-weight:550;color:var(--mm-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.mm-linha-n,.mm-linha-d,.mm-linha-p{color:var(--mm-text-2);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.mm-linha-acoes{display:flex;gap:4px;justify-content:flex-end}\n.mm-acao{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:var(--mm-text-2);padding:5px 9px;border-radius:7px;border:1px solid transparent}\n.mm-acao:hover{background:#fff;border-color:var(--mm-border-2);color:var(--mm-text)}\n.mm-acao.perigo:hover{color:#c0392b;border-color:#f1c5c0;background:#fff5f4}\n.mm-acao .ic{width:14px;height:14px}\n@media (max-width:900px){.mm-linha{grid-template-columns:28px minmax(0,1fr) auto}.mm-linha-n,.mm-linha-d,.mm-linha-p{display:none}.mm-acao{font-size:0;gap:0}}\n.mm-estrela{display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;color:#b9bcc6;flex:none;padding:0}\n.mm-estrela:hover{background:#fff6dc;color:#E8B030}\n.mm-estrela.on{color:#E8B030}\n.mm-estrela .ic{width:17px;height:17px}\n.mm-abas{position:absolute;top:0;left:0;right:0;height:40px;z-index:9;display:flex;align-items:flex-end;gap:2px;padding:0 10px;background:#f4f4f6;border-bottom:1px solid #e4e4ea;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}\n.mm-abas::-webkit-scrollbar{display:none}\n.mm-aba{display:flex;align-items:center;gap:6px;height:32px;max-width:220px;padding:0 8px 0 12px;border-radius:8px 8px 0 0;font-size:13px;color:#5a5c66;flex:none;border:1px solid transparent;border-bottom:0;margin-bottom:-1px}\n.mm-aba:hover{background:#ebebef}\n.mm-aba.on{background:#fff;color:#1f1f23;font-weight:550;border-color:#e4e4ea;height:33px}\n.mm-aba-nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.mm-aba-x{display:flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:5px;font-size:15px;color:#9a9ca6;flex:none}\n.mm-aba-x:hover{background:#dedee4;color:#2f2f33}\n.mm-aba-nova{width:28px;height:28px;margin:0 0 3px 4px;border-radius:7px;font-size:18px;color:#6b6d76;flex:none}\n.mm-aba-nova:hover{background:#e6e6eb;color:#1f1f23}\n.mm2 .mm-top-e,.mm2 .mm-top-d{top:52px}\n.mm2 .mm-busca{top:110px!important}\n.mm2 .mm-toast{top:110px}\n.mm2 .mm-out{padding-top:120px}\n.mm2.apres .mm-abas{display:none}\n.mm2 .mm-mundo{z-index:1}\n.mm2 .mm-busca{top:70px;right:12px}\n.mm2 .mm-vazio{padding-top:80px}\n.mm2.apres .mm-bar,.mm2.apres .mm-mais,.mm2.apres .mm-dica,.mm2.apres .mm-pop,.mm2.apres .mm-painel-f{display:none!important}\n.mm2 .mm-out{padding-top:80px}\n@media (max-width:700px){.mm-top-e{max-width:calc(100% - 24px)}.mm-top-d{top:auto;bottom:12px;left:12px;right:auto}.mm-titulo{max-width:150px}.mm-dica{display:none}}\n"; document.head.appendChild(st); }
/* ============================== Mapa mental (estilo MindMaster) ============================== */
const MM = { mapas:new Map(), atual:null, el:null, sel:new Set(), selRel:null, selRes:null, zoom:1, px:0, py:0,
  desfazer:[], refazer:[], salvarT:null, sujo:false, editando:null, modoRel:null, painel:"pagina", rib:"inicio",
  outline:false, cheia:false, apres:null, clip:null, busca:null, B:new Map(), est:new Map(), nos:new Map(),
  arrastando:false, ajustarPend:false, filtroArq:"", carregado:false, mostrarArq:true, mostrarFmt:true };
const LS_MAPAS = "painel-mapas-v1";
const mmUid = ()=> Math.random().toString(36).slice(2,8) + Date.now().toString(36).slice(-4);
const mmNo = (t, filhos)=> ({id:mmUid(), t, filhos:(filhos||[]).map(f=> typeof f==="string" ? mmNo(f) : f)});
const mmClone = o => JSON.parse(JSON.stringify(o));

const MM_TEMAS = {
  limpo:   {nome:"Limpo", fundo:"#ffffff", raiz:{fill:null,cor:"#2f2f33",borda:null,forma:"sem",tam:28,pad:"6px 10px"}, princ:{fill:null,cor:"#2f2f33",borda:null,forma:"sem",tam:18,pad:"7px 12px",b:false}, sub:{fill:null,cor:"#3a3a40",borda:null,forma:"sem",tam:16,pad:"6px 10px"}, ramos:["#4F6BED","#F2557A","#22B39B","#F3A43B","#8B5CF6","#3BA3D9"], lw:[3.2,2.4]},
  esdras:  {nome:"Elegante", fundo:"#F7F4EC", raiz:{fill:"#14130F",cor:"#F2EDE3",borda:"#BFA472"}, princ:{fill:"#ffffff",cor:"#14130F",borda:"ramo"}, sub:{cor:"#14130F"}, ramos:["#BFA472","#26331F","#8C7A4E","#56664A","#AD1815","#6B6458"]},
  classico:{nome:"Clássico", fundo:"#ffffff", raiz:{fill:"#2F6FDF",cor:"#ffffff"}, princ:{fill:"#E8F0FE",cor:"#17325F",borda:"#2F6FDF"}, sub:{cor:"#1f2937"}, ramos:["#2F6FDF"]},
  arco:    {nome:"Arco-íris", fundo:"#ffffff", raiz:{fill:"#3B3B58",cor:"#ffffff"}, princ:{fill:"ramo",cor:"#ffffff",borda:"ramo"}, sub:{cor:"#1f2937"}, ramos:["#E8504D","#F29B30","#E9C53A","#5DB55B","#3BA3D9","#7A62D3","#D35FA6"]},
  pastel:  {nome:"Pastel", fundo:"#FFFDF8", raiz:{fill:"#F6D6AD",cor:"#4A3520",borda:"#E2B57E"}, princ:{fill:"#ffffff",cor:"#3d3d3d",borda:"ramo"}, sub:{cor:"#3d3d3d"}, ramos:["#E9A1A1","#A8C8E8","#B4D9A8","#E6C78F","#C6B0E3","#9FD4CF"]},
  escuro:  {nome:"Noite", fundo:"#1E1F24", raiz:{fill:"#BFA472",cor:"#14130F"}, princ:{fill:"#2C2E35",cor:"#F2EDE3",borda:"ramo"}, sub:{cor:"#E6E2D8"}, ramos:["#BFA472","#6FB3A8","#D98C6A","#8FA4DB","#C792EA","#9CCB6E"]},
  mono:    {nome:"Minimalista", fundo:"#ffffff", raiz:{fill:"#ffffff",cor:"#111111",borda:"#111111"}, princ:{fill:"#ffffff",cor:"#111111",borda:"#111111"}, sub:{cor:"#111111"}, ramos:["#555555"]},
  musgo:   {nome:"Reserva", fundo:"#F2EDE3", raiz:{fill:"#26331F",cor:"#F2EDE3",borda:"#BFA472"}, princ:{fill:"#26331F",cor:"#F2EDE3",borda:"#BFA472"}, sub:{cor:"#26331F"}, ramos:["#BFA472","#7C8C5B","#A68A4F","#4E6140"]},
  fresco:  {nome:"Fresco", fundo:"#F4FAF8", raiz:{fill:"#0F7B6C",cor:"#ffffff"}, princ:{fill:"#ffffff",cor:"#0b3d36",borda:"ramo"}, sub:{cor:"#123"}, ramos:["#0F7B6C","#2A9D8F","#E9C46A","#F4A261","#E76F51","#264653"]}
};
const MM_LAYOUTS = [
  {id:"mapa", nome:"Mapa mental", ic:'<rect x="21" y="13" width="12" height="8" rx="2"/><path d="M33 17h6M39 9v16M39 9h4M39 25h4M21 17h-6M15 9v16M15 9h-4M15 25h-4"/>'},
  {id:"direita", nome:"Para a direita", ic:'<rect x="4" y="13" width="12" height="8" rx="2"/><path d="M16 17h6M22 6v22M22 6h6M22 17h6M22 28h6"/><path d="M30 6h14M30 17h14M30 28h14" stroke-width="2.2"/>'},
  {id:"esquerda", nome:"Para a esquerda", ic:'<rect x="38" y="13" width="12" height="8" rx="2"/><path d="M38 17h-6M32 6v22M32 6h-6M32 17h-6M32 28h-6"/><path d="M24 6H10M24 17H10M24 28H10" stroke-width="2.2"/>'},
  {id:"organograma", nome:"Organograma", ic:'<rect x="21" y="3" width="12" height="7" rx="2"/><path d="M27 10v5M10 15h34M10 15v5M27 15v5M44 15v5"/><rect x="4" y="21" width="12" height="7" rx="2"/><rect x="21" y="21" width="12" height="7" rx="2"/><rect x="38" y="21" width="12" height="7" rx="2"/>'},
  {id:"cima", nome:"Para cima", ic:'<rect x="21" y="24" width="12" height="7" rx="2"/><path d="M27 24v-5M10 19h34M10 19v-5M27 19v-5M44 19v-5"/><rect x="4" y="6" width="12" height="7" rx="2"/><rect x="21" y="6" width="12" height="7" rx="2"/><rect x="38" y="6" width="12" height="7" rx="2"/>'},
  {id:"arvore", nome:"Árvore", ic:'<rect x="21" y="2" width="12" height="7" rx="2"/><path d="M27 9v4M12 13h30M12 13v3M42 13v3"/><rect x="6" y="16" width="12" height="5" rx="1.5"/><rect x="36" y="16" width="12" height="5" rx="1.5"/><path d="M9 21v8h5M9 25h5M39 21v8h5M39 25h5"/>'},
  {id:"linha", nome:"Linha do tempo", ic:'<rect x="2" y="13" width="10" height="8" rx="2"/><path d="M12 17h40" stroke-width="2"/><circle cx="20" cy="17" r="2.5"/><circle cx="33" cy="17" r="2.5"/><circle cx="46" cy="17" r="2.5"/><path d="M20 20v9h5M33 20v9h5M46 20v5"/>'}
];
const MM_RAMOS = [{id:"afunilado",nome:"Afunilado"},{id:"curva",nome:"Curva"},{id:"cotovelo",nome:"Cotovelo"},{id:"reta",nome:"Reta"}];
const MM_FORMAS = [{id:"arredondado",nome:"Arredondado"},{id:"retangulo",nome:"Retângulo"},{id:"capsula",nome:"Cápsula"},{id:"elipse",nome:"Elipse"},{id:"sublinhado",nome:"Sublinhado"},{id:"sem",nome:"Sem borda"}];
const MM_CORES = ["#14130F","#F2EDE3","#BFA472","#26331F","#AD1815","#ffffff","#E8504D","#F29B30","#E9C53A","#5DB55B","#3BA3D9","#2F6FDF","#7A62D3","#D35FA6","#8a8a8a","#E8F0FE","#FDECC8","#DBEDDB","#FFE2DD","#E8DEEE"];
const MM_PRIO = ["#E5484D","#F2843A","#E8B830","#5BAE4F","#2BA6A0","#2F6FDF","#7A57D1","#8B6A4A","#7A7A7A"];
const MM_FLAG = {vermelha:"#E5484D",laranja:"#F2843A",amarela:"#E8B830",verde:"#5BAE4F",azul:"#2F6FDF",roxa:"#7A57D1"};
const MM_EMOJI = {
  "Estrelas":["⭐","🌟","💫"],
  "Rostos":["😀","🙂","😐","🙁","😡","🤔"],
  "Símbolos":["✅","❌","❓","❗","💡","📌","⚠️","🔒"],
  "Marketing":["📷","🎬","📣","📱","🗓️","🎯","🏗️","🏌️","🎾","🐾","🤝","✍️"]
};
const MM_P = "…";   // espaço para preencher
const mmF = (t, n)=> mmNo(t, Array.from({length:n||2}, ()=>MM_P));   // ramo com campos em branco
const MM_MODELOS_TODOS = [
  {id:"branco", cat:"Começar", nome:"Em branco", desc:"Só o tópico central, para começar do zero", gerar:()=>mmNo("Meu novo mapa mental")},
  {id:"brainstorm", cat:"Começar", nome:"Brainstorm", desc:"Problema, ideias, referências e próximos passos", gerar:()=>mmNo("Ideia central",[mmF("Problema ou oportunidade"),mmF("Ideias",3),mmF("Referências"),mmNo("Próximos passos",["Quem","O quê","Até quando"])])},

  {id:"captacao", cat:"Imóveis", nome:"Captação de imóvel", desc:"Proprietário, ficha, documentos, valor e material", gerar:()=>mmNo("Captação · endereço do imóvel",[
    mmNo("Proprietário",[mmF("Nome e contato",1),mmF("Motivo da venda",1),mmF("Exclusividade",1)]),
    mmNo("Ficha do imóvel",[mmF("Tipo e metragem",1),mmF("Quartos, suítes e vagas",1),mmF("Diferenciais",3),mmF("Condomínio e IPTU",1)]),
    mmNo("Documentação",[mmF("Matrícula",1),mmF("IPTU em dia",1),mmF("Habite-se / averbação",1)]),
    mmNo("Valor",[mmF("Pedida do proprietário",1),mmF("Comparáveis da região",2),mmF("Valor sugerido",1)]),
    mmNo("Material",[mmF("Fotos",1),mmF("Vídeo / tour",1),mmF("Drone",1)]),
    mmNo("Próximos passos",[mmF("Quem",1),mmF("Até quando",1)])])},
  {id:"divulgacao", cat:"Imóveis", nome:"Divulgação de imóvel", desc:"Do material pronto até os anúncios e o resultado", gerar:()=>mmNo("Divulgação · nome do imóvel",[
    mmNo("Material",[mmF("Fotos tratadas",1),mmF("Vídeo editado",1),mmF("Texto do anúncio",1)]),
    mmNo("Site",[mmF("Ficha completa",1),mmF("Capa / destaque",1)]),
    mmNo("Instagram",[mmF("Carrossel",1),mmF("Reels",1),mmF("Stories",1)]),
    mmNo("Meta Ads",[mmF("Público",1),mmF("Orçamento",1),mmF("Criativos",2)]),
    mmNo("WhatsApp",[mmF("Lista de transmissão",1),mmF("Clientes da carteira",1)]),
    mmNo("Resultado",[mmF("Leads",1),mmF("Visitas",1),mmF("Propostas",1)])])},

  {id:"ceo", cat:"Gestão", nome:"Imobiliária · Visão do CEO", desc:"As 10 áreas da empresa: estratégia, captação, comercial…", extra:EXTRA_VISAO_CEO, gerar:raizVisaoCeo},

  {id:"campanha", cat:"Marketing", nome:"Campanha de anúncios", desc:"Objetivo, público, criativos, verba e métricas", gerar:()=>mmNo("Campanha · nome",[
    mmNo("Objetivo",[mmF("O que a pessoa deve fazer",1),mmF("Como vamos medir",1)]),
    mmNo("Público",[mmF("Quem é",1),mmF("Região",1),mmF("Objeções",2)]),
    mmNo("Mensagem",[mmF("Ideia principal",1),mmF("Provas e diferenciais",2),mmF("Chamada (CTA)",1)]),
    mmNo("Criativos",[MM_P,MM_P,MM_P]),
    mmNo("Verba e prazo",[mmF("Orçamento diário",1),mmF("Duração",1)]),
    mmNo("Métricas",[mmF("Custo por lead",1),mmF("Leads",1),mmF("Visitas agendadas",1)])])},
  {id:"semana", cat:"Marketing", nome:"Pauta da semana", desc:"Um ramo por dia, de segunda a domingo", gerar:()=>mmNo("Pauta da semana",["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"].map(d=>mmNo(d,[mmF("Feed",1),mmF("Stories",1)])))},

  {id:"jornada", cat:"Comercial", nome:"Jornada do cliente", desc:"Do primeiro contato ao pós-venda e indicação", gerar:()=>mmNo("Jornada do cliente",[
    mmNo("Primeiro contato",[mmF("Origem do lead",1),mmF("Tempo de resposta",1)]),
    mmNo("Qualificação",[mmF("Perfil e região",1),mmF("Renda / financiamento",1),mmF("Prazo de mudança",1)]),
    mmNo("Visitas",[mmF("Imóveis selecionados",2),mmF("Agenda",1)]),
    mmNo("Proposta",[mmF("Valor e condições",1),mmF("Negociação",1)]),
    mmNo("Documentação",[mmF("Comprador",1),mmF("Vendedor",1),mmF("Cartório / banco",1)]),
    mmNo("Pós-venda",[mmF("Entrega das chaves",1),mmF("Depoimento",1),mmF("Indicação",1)])])},
  {id:"reuniao", cat:"Comercial", nome:"Reunião de alinhamento", desc:"Pauta, decisões, responsáveis e próximos passos", gerar:()=>mmNo("Reunião · data",[
    mmNo("Pauta",[MM_P,MM_P,MM_P]), mmNo("Participantes",[MM_P]), mmNo("Decisões",[MM_P,MM_P]),
    mmNo("Tarefas",[mmF("Quem",1),mmF("O quê",1),mmF("Até quando",1)]), mmNo("Pendências",[MM_P])])}
];
const MM_MODELOS_USADOS = ["branco","brainstorm","captacao","divulgacao","ceo","campanha","semana","jornada","reuniao"];
const MM_MODELOS = MM_MODELOS_USADOS.map(id=>MM_MODELOS_TODOS.find(m=>m.id===id)).filter(Boolean);

const MM_IC = {
  pincel:'<path d="M9.5 2.5l4 4-5.5 5.5-4-4z"/><path d="M4 8l-1.5 1.5a2 2 0 000 2.8l1.2 1.2a2 2 0 002.8 0L8 12"/><path d="M12.6 10.4c.6.9 1.2 1.6 1.2 2.3a1.2 1.2 0 01-2.4 0c0-.7.6-1.4 1.2-2.3z"/>',
  texto:'<path d="M3.5 11.5L8 2.5l4.5 9M5.2 8.2h5.6"/><path d="M2.5 14h11"/>',
  rosto:'<circle cx="8" cy="8" r="6"/><path d="M5.6 9.6a3 3 0 004.8 0"/><path d="M6 6.4h.01M10 6.4h.01" stroke-width="2"/>',
  mais3:'<circle cx="3" cy="8" r="1.1" fill="currentColor"/><circle cx="8" cy="8" r="1.1" fill="currentColor"/><circle cx="13" cy="8" r="1.1" fill="currentColor"/>',
  tema:'<circle cx="8" cy="4.6" r="2.4" fill="#F2557A" stroke="none"/><circle cx="4.8" cy="9.6" r="2.4" fill="#4F6BED" stroke="none"/><circle cx="11.2" cy="9.6" r="2.4" fill="#22B39B" stroke="none"/><circle cx="8" cy="8" r="1.5" fill="#F3A43B" stroke="none"/>',
  voltar:'<path d="M9.5 3.5L5 8l4.5 4.5"/><path d="M5.5 8H13"/>',
  casa:'<path d="M2.5 7.5L8 3l5.5 4.5"/><path d="M4 6.5V13h8V6.5"/><path d="M6.8 13V9.8h2.4V13"/>',
  rede:'<circle cx="8" cy="8" r="2"/><circle cx="2.8" cy="3.5" r="1.3"/><circle cx="13.2" cy="3.5" r="1.3"/><circle cx="2.8" cy="12.5" r="1.3"/><circle cx="13.2" cy="12.5" r="1.3"/><path d="M6.4 6.8L3.8 4.4M9.6 6.8l2.6-2.4M6.4 9.2l-2.6 2.4M9.6 9.2l2.6 2.4"/>',
  painelE:'<rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M6.2 2.5v11"/>',
  lista:'<rect x="2" y="2.5" width="12" height="11" rx="2"/><path d="M5 6h6M5 8.5h6M5 11h3.5"/>',
  baixar:'<path d="M4.5 11.5H4a3 3 0 01-.4-6A4.2 4.2 0 0111.8 5a2.9 2.9 0 01.4 6.5h-.7"/><path d="M8 7.5v6M5.8 11.5L8 13.7l2.2-2.2"/>',
  minimizar:'<path d="M2.5 6.5h4v-4M13.5 9.5h-4v4M6.5 6.5l-4-4M9.5 9.5l4 4"/>',
  menos:'<path d="M3.5 8h9"/>',
  plus:'<path d="M8 3.5v9M3.5 8h9"/>',
  nuvemOk:'<path d="M4.5 12.5H4a3 3 0 01-.4-6A4.2 4.2 0 0111.8 6a2.9 2.9 0 01.4 6.5z"/><path d="M6 9.4l1.4 1.4 2.8-2.8"/>',
  nuvemSync:'<path d="M4.5 12.5H4a3 3 0 01-.4-6A4.2 4.2 0 0111.8 6a2.9 2.9 0 01.4 6.5z"/><path d="M6 9.5h.01M8 9.5h.01M10 9.5h.01" stroke-width="1.8"/>',
  topico:'<rect x="2" y="5" width="12" height="6" rx="2"/>',
  sub:'<rect x="1.5" y="2.5" width="7" height="4.5" rx="1.4"/><path d="M5 7v5.5h3"/><rect x="8" y="10.5" width="6.5" height="4" rx="1.3"/>',
  pai:'<rect x="5" y="1.5" width="7" height="4.5" rx="1.4"/><path d="M8.5 6v3"/><rect x="2" y="9" width="12" height="5.5" rx="1.5" stroke-dasharray="2 1.6"/>',
  flut:'<rect x="3" y="4" width="10" height="6" rx="2"/><path d="M4 13h8" stroke-dasharray="1.5 1.5"/>',
  rel:'<path d="M3 12C3 5 13 5 13 10"/><path d="M11 8.6l2 1.6 1.2-2.3"/><circle cx="3" cy="12.5" r="1.3"/>',
  resumo:'<path d="M3 3h4M3 8h4M3 13h4"/><path d="M8.5 3c1.5 0 1.5 5 3 5-1.5 0-1.5 5-3 5"/><path d="M12 8h2.5"/>',
  limite:'<rect x="2" y="2.5" width="12" height="11" rx="3" stroke-dasharray="2.2 1.6"/><rect x="5" y="6" width="6" height="4" rx="1"/>',
  nota:'<path d="M3 2.5h7.5L13 5v8.5H3z"/><path d="M5.5 7h5M5.5 9.5h5M5.5 12h3"/>',
  link:'<path d="M6.6 9.4a2.6 2.6 0 003.9.3l2-2a2.6 2.6 0 00-3.7-3.7l-1 1"/><path d="M9.4 6.6a2.6 2.6 0 00-3.9-.3l-2 2a2.6 2.6 0 003.7 3.7l1-1"/>',
  dem:'<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5 6h6M5 8.5h6M5 11h3.5"/>',
  tag:'<path d="M2.5 2.5h5.5l5.5 5.5-5.5 5.5-5.5-5.5z"/><circle cx="5.4" cy="5.4" r="1"/>',
  undo:'<path d="M5 4L2 7l3 3"/><path d="M2 7h7.5a4 4 0 010 8H7"/>',
  redo:'<path d="M11 4l3 3-3 3"/><path d="M14 7H6.5a4 4 0 000 8H9"/>',
  cortar:'<circle cx="4.5" cy="12" r="2"/><circle cx="11.5" cy="12" r="2"/><path d="M5.8 10.5L12 2.5M10.2 10.5L4 2.5"/>',
  copiar:'<rect x="5" y="5" width="8.5" height="8.5" rx="1.4"/><path d="M11 5V3.6A1.1 1.1 0 009.9 2.5H3.6A1.1 1.1 0 002.5 3.6v6.3A1.1 1.1 0 003.6 11H5"/>',
  colar:'<rect x="3" y="3" width="10" height="11" rx="1.5"/><rect x="5.5" y="1.5" width="5" height="3" rx="1"/>',
  apagar:'<path d="M3 4.4h10M6.4 4.4V3h3.2v1.4M4.4 4.4l.6 8.2h6l.6-8.2"/>',
  ajustar:'<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/><rect x="5.5" y="5.5" width="5" height="5" rx="1"/>',
  outline:'<path d="M2.2 3.5h1.4M5.5 3.5h8.3M4.2 8h1.4M7.5 8h6.3M4.2 12.5h1.4M7.5 12.5h6.3"/>',
  apres:'<rect x="1.5" y="2.5" width="13" height="8.5" rx="1.2"/><path d="M8 11v2.5M5 14h6M6.5 5l3.5 1.8-3.5 1.8z"/>',
  cheia:'<path d="M9.6 2.4H14v4.4M6.4 13.6H2V9.2M14 2.4l-5 5M2 13.6l5-5"/>',
  expandir:'<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M8 5.5v5M5.5 8h5"/>',
  recolher:'<rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M5.5 8h5"/>',
  png:'<rect x="2" y="2.5" width="12" height="11" rx="1.6"/><circle cx="6" cy="6.2" r="1.3"/><path d="M2.4 12l3.6-3.4 2.6 2.4 2.2-1.8 2.8 2.6"/>',
  svgx:'<path d="M5 4L1.5 8 5 12M11 4l3.5 4-3.5 4M9.5 3l-3 10"/>',
  md:'<rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="M4 10.5v-5l2 2.5 2-2.5v5M11 5.5v5M9.5 9l1.5 1.5L12.5 9"/>',
  importar:'<path d="M8 10.5V2.5M5 7.5L8 10.5l3-3M2.8 12.8h10.4"/>',
  novo:'<path d="M3.5 1.8h6l3 3v9.4h-9z"/><path d="M8 7v5M5.5 9.5h5"/>',
  duplicar:'<rect x="5" y="5" width="8.5" height="8.5" rx="1.4"/><path d="M9.2 7.5v4M7.2 9.5h4"/><path d="M11 5V3.6A1.1 1.1 0 009.9 2.5H3.6A1.1 1.1 0 002.5 3.6v6.3A1.1 1.1 0 003.6 11H5"/>',
  renomear:'<path d="M11.3 2.6l2.1 2.1-7.6 7.6-2.8.7.7-2.8z"/>',
  buscar:'<circle cx="7.2" cy="7.2" r="4.4"/><path d="M10.6 10.6L14 14"/>',
  painel:'<rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><path d="M5.5 2.5v11M10.5 2.5v11"/>',
  nivel:'<path d="M2.5 3.5h4M5 8h4M7.5 12.5h4"/><circle cx="2.5" cy="8" r=".6"/>'
};
function mmIc(n, sw){ return svg(MM_IC[n]||MM_IC.topico, {sw:sw||1.3}); }

/* ---------- dados ---------- */
function mmAtual(){ return MM.atual ? MM.mapas.get(MM.atual) : null; }
function mmNovoMapa(nome, raiz){
  const id = "mapa-"+mmUid();
  return {id, nome:nome||"Mapa sem título", raiz:raiz||MM_MODELOS[0].gerar(), flut:[], rel:[], res:[], lim:[],
    layout:"mapa", tema:"limpo", ramo:"curva", fundo:null, espaco:1, criado:Date.now(), atualizado:Date.now(), por:G.sessao()?G.sessao().nome:""};
}
/* salvamento por mapa: guarda o que falta salvar, tenta de novo se falhar e nunca deixa uma atualização atrasada desfazer a edição */
MM.pend = new Map(); MM.salvarTs = {};
// diagnóstico: qualquer erro de script aparece no aviso do mapa
window.addEventListener("error", e=>{ try{ if(MM.el && MM.el.isConnected) mmStatus("Erro no mapa: " + (e.message||"") + " · " + String(e.filename||"").split("/").pop() + ":" + (e.lineno||"")); }catch(_){} });
window.addEventListener("unhandledrejection", e=>{ try{ if(MM.el && MM.el.isConnected) mmStatus("Erro no mapa: " + String(e.reason && (e.reason.message||e.reason)).slice(0,160)); }catch(_){} });
function mmGravar(m, imediato){
  if(!m) return;
  const id = m.id;
  clearTimeout(MM.salvarTs[id]);
  MM.pend.set(id, (MM.pend.get(id)||0) + 1);
  MM.sujo = true; mmStatus();
  const tentar = (n)=>{
    const marca = MM.pend.get(id);
    m.atualizado = Date.now(); m.editadoPor = G.sessao() ? G.sessao().nome : "";
    const copia = mmClone(m);
    if(!G.db()){
      try{ const all = {}; MM.mapas.forEach((v,k)=>all[k]=v); localStorage.setItem(LS_MAPAS, JSON.stringify(all)); }catch(e){}
      MM.pend.delete(id); MM.sujo = MM.pend.size > 0; mmStatus(); return;
    }
    G.db().doc("mapas/"+id).set(copia).then(()=>{
      if(MM.pend.get(id) === marca) MM.pend.delete(id);
      MM.sujo = MM.pend.size > 0;
      mmStatus(MM.msg && /^Não foi possível salvar/.test(MM.msg) ? null : undefined);
    }, e=>{
      console.warn("mapa: erro ao salvar", id, e);
      if(n < 3){ MM.salvarTs[id] = setTimeout(()=>tentar(n+1), [1500, 4000, 9000][n]); return; }
      const motivo = (e && (e.message || e.code)) ? " (" + String(e.message || e.code).slice(0,120) + ")" : "";
      mmStatus("Não foi possível salvar o mapa" + motivo + ". Sua edição continua na tela; tente de novo.");
    });
  };
  if(imediato) tentar(0); else MM.salvarTs[id] = setTimeout(()=>tentar(0), 700);
}
/* uma única vez: cria no banco um mapa de cada modelo da construtora (marca em config/mapas_modelos) */
function mmSemear(){
  if(MM.semeado || !G.db() || !G.semear) return; MM.semeado = true;
  let feito = false;
  const un = G.db().doc("config/mapas_modelos").onSnapshot(sn=>{
    if(feito) return; feito = true; try{ un && un(); }catch(e){}
    if(sn.exists) return;
    const pular = new Set(["branco","brainstorm","swot","semana","campanha"]);
    const nomes = new Set([...MM.mapas.values()].map(m=>String(m.nome||"").toLowerCase()));
    const agora = Date.now(); let i = 0;
    MM_MODELOS.filter(md=>!pular.has(md.id) && !nomes.has(md.nome.toLowerCase())).forEach(md=>{
      const m = Object.assign(mmNovoMapa(md.nome, md.gerar()), {id:"mapa-"+md.id, corLinha:"#AD1815", criado:agora - i*1000});
      m.atualizado = agora - (i++)*1000;
      MM.mapas.set(m.id, m);
      G.db().doc("mapas/"+m.id).set(mmClone(m)).catch(()=>{});
    });
    G.db().doc("config/mapas_modelos").set({em:agora, por:G.sessao() ? G.sessao().nome : "", total:i}).catch(()=>{});
    if(MM.el) mmArquivos();
  }, ()=>{});
}
function mmReceber(lista){
  MM.carregado = true;
  setTimeout(mmSemear, 0);
  const atual = MM.atual;
  const vistos = new Set();
  lista.forEach(d=>{
    if(!d || !d.id || !d.raiz) return;
    vistos.add(d.id);
    if(MM.pend.has(d.id)) return;                       // edição local ainda não salva: vale a da tela
    if(d.id === atual && (MM.editando || MM.arrastando)) return;
    const ant = MM.mapas.get(d.id);
    if(ant && ((ant.atualizado||0) > (d.atualizado||0) || (d.id === atual && ant.atualizado === d.atualizado && !!ant.fav === !!d.fav))) return;   // versão atrasada ou nada novo
    MM.mapas.set(d.id, mmNorm(d));
  });
  [...MM.mapas.keys()].forEach(k=>{ if(!vistos.has(k) && !MM.pend.has(k) && !(k===atual && MM.sujo)) MM.mapas.delete(k); });
  if(atual && !MM.mapas.has(atual)) MM.atual = null;
  if(state.view === "mapa" && MM.el && !editingNow()) renderMapa(null, true);
  else if(MM.home && !MM.atual) mmHome();
}
function mmNorm(d){
  // cópia profunda: o banco entrega objetos congelados (não aceitam edição)
  const m = Object.assign({flut:[], rel:[], res:[], lim:[], layout:"mapa", tema:"esdras", ramo:"afunilado", espaco:1}, JSON.parse(JSON.stringify(d)));
  const fix = n=>{ if(!Array.isArray(n.filhos)) n.filhos = []; n.filhos.forEach(fix); };
  fix(m.raiz); m.flut.forEach(fix);
  return m;
}
function mmAntes(){
  const m = mmAtual(); if(!m) return;
  MM.desfazer.push(JSON.stringify(m)); if(MM.desfazer.length > 120) MM.desfazer.shift();
  MM.refazer = [];
}
function mmMudou(semDesenho){
  const m = mmAtual(); if(!m) return;
  mmGravar(m);
  if(!semDesenho) mmDesenhar();
  mmRibbon(); mmFormato();
}
function mmVoltar(refazer){
  const m = mmAtual(); if(!m) return;
  const de = refazer ? MM.refazer : MM.desfazer, para = refazer ? MM.desfazer : MM.refazer;
  if(!de.length) return;
  para.push(JSON.stringify(m));
  const v = JSON.parse(de.pop());
  MM.mapas.set(m.id, v);
  MM.sel = new Set([...MM.sel].filter(id=>mmAchar(v,id)));
  if(!MM.sel.size) MM.sel.add(v.raiz.id);
  mmGravar(v); mmDesenhar(); mmRibbon(); mmFormato();
}
/* procura um tópico: devolve {n, pai, lista, idx, flut, nivel} */
function mmAchar(m, id){
  let r = null;
  const vai = (n, pai, lista, idx, flut, nivel)=>{
    if(r) return;
    if(n.id === id){ r = {n, pai, lista, idx, flut, nivel}; return; }
    n.filhos.forEach((c,i)=>vai(c, n, n.filhos, i, flut, nivel+1));
  };
  vai(m.raiz, null, null, -1, false, 0);
  m.flut.forEach((f,i)=>vai(f, null, m.flut, i, true, 0));
  if(!r) (m.res||[]).forEach(s=>{ if(s.no && s.no.id===id) r = {n:s.no, resumo:s, nivel:9}; });
  return r;
}
function mmIdsSub(n, out){ out = out||new Set(); out.add(n.id); n.filhos.forEach(c=>mmIdsSub(c,out)); return out; }
function mmLimparRefs(m, ids){
  m.rel = m.rel.filter(r=>!ids.has(r.de) && !ids.has(r.para));
  m.lim = m.lim.filter(l=>!ids.has(l.alvo));
  m.res = m.res.filter(s=>{ s.ids = s.ids.filter(i=>!ids.has(i)); return s.ids.length && !ids.has(s.pai); });
}
function mmContar(m){ let n=0; const c = x=>{ n++; x.filhos.forEach(c); }; c(m.raiz); m.flut.forEach(c); return n; }

/* ---------- montagem da tela ---------- */
function renderMapa(root, soAtualizar){
  if(!MM.el) mmMontar();
  if(!soAtualizar){ root.appendChild(MM.el); }
  if(MM.atual && !MM.mapas.has(MM.atual)) MM.atual = null;
  mmArquivos(); mmRibbon(); mmFormato(); mmVisao(); mmAbas();
  if(!MM.editando && !MM.arrastando) mmDesenhar();
  if(MM.ajustarPend) requestAnimationFrame(()=>{ if(MM.tela.clientWidth){ MM.ajustarPend = false; mmAjustar(); } });
}
function mmMontar(){
  MM.el = h("div",{class:"mmw"});
  MM.lado = h("aside",{class:"mm-lado"});
  MM.principal = h("div",{class:"mm-principal"});
  MM.home = h("div",{class:"mm-home"});
  const el = h("div",{class:"mm mm2"});
  MM.bloco = el;
  MM.principal.appendChild(MM.home); MM.principal.appendChild(el);
  MM.el.appendChild(MM.lado); MM.el.appendChild(MM.principal);
  MM.tela = h("div",{class:"mm-tela",tabindex:"0"});
  MM.mundo = h("div",{class:"mm-mundo"});
  MM.svgEl = document.createElementNS("http://www.w3.org/2000/svg","svg");
  MM.svgEl.setAttribute("class","mm-svg");
  MM.camNos = h("div",{style:"position:absolute;left:0;top:0"});
  MM.mundo.appendChild(MM.svgEl); MM.mundo.appendChild(MM.camNos);
  MM.tela.appendChild(MM.mundo);
  el.appendChild(MM.tela);
  // círculo de recolher aparece ao passar o mouse no tópico (como no modelo)
  MM.camNos.addEventListener("pointerover", e=>{ const no = e.target.closest(".mm-no"); MM.camNos.querySelectorAll(".mm-tg.hov").forEach(t=>{ if(!no || t.dataset.no !== no.dataset.id) t.classList.remove("hov"); }); if(no){ const t = MM.camNos.querySelector('.mm-tg[data-no="'+no.dataset.id+'"]'); if(t) t.classList.add("hov"); } });
  MM.mostrarFmt = false;
  try{ MM.mostrarArq = localStorage.getItem("painel-mapa-lista") !== "0"; }catch(e){ MM.mostrarArq = true; }
  if(window.innerWidth < 800) MM.mostrarArq = false;
  MM.arq = MM.lado;
  MM.fmt = h("div",{class:"mm-fmt mm-painel-f"}); MM.fmt.hidden = true;
  MM.abasEl = h("div",{class:"mm-abas"});
  MM.abasEl.onpointerdown = e=>e.stopPropagation();
  try{ MM.abas = JSON.parse(localStorage.getItem("painel-mapa-abas")||"[]"); }catch(e){ MM.abas = []; }
  if(!Array.isArray(MM.abas)) MM.abas = [];
  MM.topE = h("div",{class:"mm-bar mm-top-e"});
  MM.topD = h("div",{class:"mm-bar mm-top-d"});
  MM.zoomBar = h("div",{class:"mm-bar mm-zoom"});
  MM.ctx = h("div",{class:"mm-bar mm-ctx"});
  MM.maisD = h("button",{class:"mm-mais",type:"button",title:"Subtópico (Tab)"}, "+");
  MM.maisB = h("button",{class:"mm-mais",type:"button",title:"Tópico irmão (Enter)"}, "+");
  MM.dica = h("div",{class:"mm-dica"}, h("div",{}, h("kbd",{},"Tab"), " para criar tópico filho"), h("div",{}, h("kbd",{},"Enter"), " para criar tópico irmão"));
  MM.toast = h("div",{class:"mm-toast"}); MM.toast.hidden = true;
  [MM.maisD, MM.maisB].forEach(b=>{ b.onpointerdown = e=>e.stopPropagation(); });
  MM.maisD.onclick = ()=>mmFilho();
  MM.maisB.onclick = ()=>mmIrmao(false);
  MM.status = h("div",{hidden:""});
  [MM.abasEl, MM.topE, MM.topD, MM.zoomBar, MM.ctx, MM.maisD, MM.maisB, MM.dica, MM.toast, MM.fmt].forEach(x=>el.appendChild(x));
  mmMontarCtx();
  mmEventos();
  document.addEventListener("pointerdown", e=>{ if(MM.pop && !MM.pop.el.contains(e.target) && !(MM.pop.ancora && MM.pop.ancora.contains(e.target))) mmFecharPop(); }, true);
  document.addEventListener("fullscreenchange", ()=>{ if(!document.fullscreenElement && MM.cheia && MM.cheiaReal){ MM.cheiaReal = false; mmTelaCheia(false); } });
}
function mmB(ic, dica, run, extra){
  const b = h("button",{class:"mm-ib"+(extra&&extra.cls?" "+extra.cls:""),type:"button",title:dica,"aria-label":dica}, typeof ic === "string" ? mmIc(ic, 1.5) : ic);
  if(extra && extra.off) b.disabled = true;
  b.onclick = (e)=>{ e.stopPropagation(); run(b, e); };
  return b;
}
function mmSep(){ return h("i",{class:"mm-sep"}); }
function mmMontarCtx(){
  const C = MM.ctx; C.innerHTML = "";
  C.onpointerdown = e=>e.stopPropagation();
  C.appendChild(mmB("pincel","Estilo do tópico", b=>mmPop(b,"estilo")));
  C.appendChild(mmB("texto","Texto", b=>mmPop(b,"texto")));
  C.appendChild(mmSep());
  C.appendChild(mmB("rosto","Ícones e marcas", b=>mmPop(b,"marcas")));
  C.appendChild(mmB("nota","Nota", b=>mmPop(b,"nota")));
  C.appendChild(mmB("link","Link", ()=>mmPedirLink()));
  C.appendChild(mmB("rel","Conectar a outro tópico", ()=>mmIniciarRel()));
  C.appendChild(mmSep());
  C.appendChild(mmB("dem","Vincular imóvel", ()=>mmVincularDemanda()));
  if(G.novaSolicitacao) C.appendChild(mmB("novo","Criar imóvel (rascunho) a partir do tópico", ()=>mmVirarSolicitacao()));
  C.appendChild(mmSep());
  C.appendChild(mmB("mais3","Mais opções", b=>{
    const m = mmAtual(), s = mmSelUm(); if(!m || !s) return;
    const r = mmAchar(m, s.id), raiz = s.id === m.raiz.id;
    menuPopup(b, [
      {label:"Editar texto  (F2)", icon:"edit", run:()=>mmEditar(s.id)},
      {label:"Etiqueta", icon:"list", run:()=>mmPedirTag()},
      ...(!raiz && !r.resumo ? [{label:"Resumo", icon:"props", run:()=>mmResumo()}, {label:"Tópico pai  (Ctrl+Enter)", icon:"plus", run:()=>mmPai()}] : []),
      {label:m.lim.some(l=>l.alvo===s.id) ? "Tirar limite" : "Limite em volta do ramo", icon:"table", run:()=>mmLimite()},
      ...(s.filhos.length ? [{label:s.col ? "Expandir ramo  (Espaço)" : "Recolher ramo  (Espaço)", icon:"down", run:()=>mmAlternar(s.id)}] : []),
      "-",
      {label:"Copiar  (Ctrl+C)", icon:"copy", run:()=>mmCopiar(false)},
      ...(!raiz ? [{label:"Recortar  (Ctrl+X)", icon:"copy", run:()=>mmCopiar(true)}] : []),
      ...(MM.clip ? [{label:"Colar como subtópico  (Ctrl+V)", icon:"copy", run:()=>mmColar()}] : []),
      ...(!raiz ? ["-", {label:"Excluir  (Delete)", icon:"trash", danger:true, run:()=>mmApagar()}] : [])
    ], "left");
  }));
}
/* balão de opções (estilo, texto, marcas, nota, página) */
function mmPop(ancora, painel){
  if(MM.pop && MM.pop.painel === painel && MM.pop.ancora === ancora){ mmFecharPop(); return; }
  mmFecharPop();
  const corpo = h("div",{class:"mm-pop-corpo"});
  const el = h("div",{class:"mm-pop"}, corpo);
  el.onpointerdown = e=>e.stopPropagation();
  el.onkeydown = e=>{ if(e.key === "Escape"){ e.stopPropagation(); mmFecharPop(); MM.tela.focus({preventScroll:true}); } else e.stopPropagation(); };
  MM.bloco.appendChild(el);
  MM.pop = {el, corpo, painel, ancora};
  mmFormato(corpo, painel);
  mmPosPop();
}
function mmPosPop(){
  const P = MM.pop; if(!P) return;
  const r = P.ancora.getBoundingClientRect(), R = MM.bloco.getBoundingClientRect();
  const w = P.el.offsetWidth, hh = P.el.offsetHeight;
  let x = r.left - R.left + r.width/2 - w/2; x = Math.max(8, Math.min(R.width - w - 8, x));
  let y = r.bottom - R.top + 8; if(y + hh > R.height - 8) y = Math.max(8, r.top - R.top - hh - 8);
  P.el.style.left = x+"px"; P.el.style.top = y+"px";
}
function mmFecharPop(){ if(MM.pop){ MM.pop.el.remove(); MM.pop = null; } }
function mmListaOrdenada(){ return [...MM.mapas.values()].sort((a,b)=>((b.fav?1:0)-(a.fav?1:0)) || (b.atualizado||0)-(a.atualizado||0)); }
/* favoritar: não mexe na data de atualização */
function mmFav(id){
  const m = MM.mapas.get(id); if(!m) return;
  if(m.fav) delete m.fav; else m.fav = true;
  if(G.db()) G.db().doc("mapas/"+m.id).set(mmClone(m)).catch(onDbErr);
  else { try{ const all = {}; MM.mapas.forEach((v,k)=>all[k]=v); localStorage.setItem(LS_MAPAS, JSON.stringify(all)); }catch(e){} }
  mmArquivos(); if(!MM.atual) mmHome();
}
function mmEstrela(m){
  const b = h("button",{class:"mm-estrela"+(m.fav?" on":""),type:"button",title:m.fav?"Tirar dos favoritos":"Favoritar (aparece primeiro)","aria-label":m.fav?"Tirar dos favoritos":"Favoritar"});
  b.innerHTML = '<svg viewBox="0 0 16 16" class="ic"><path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" fill="'+(m.fav?"currentColor":"none")+'"/></svg>';
  b.onclick = e=>{ e.stopPropagation(); mmFav(m.id); };
  b.onkeydown = e=>e.stopPropagation();
  return b;
}
function mmLista(v){
  MM.mostrarArq = v === undefined ? !MM.mostrarArq : !!v;
  try{ localStorage.setItem("painel-mapa-lista", MM.mostrarArq ? "1" : "0"); }catch(e){}
  mmArquivos(); mmRibbon(); requestAnimationFrame(()=>mmAjustar(null, true));
}
function mmArquivos(){
  const box = MM.arq; box.innerHTML = ""; box.hidden = !MM.mostrarArq;
  if(MM.el) MM.el.classList.toggle("sem-lado", !MM.mostrarArq || !mmAtual());
  const busca = h("input",{type:"text",placeholder:"Buscar mapa…",value:MM.filtroArq});
  busca.oninput = ()=>{ MM.filtroArq = busca.value; pinta(); };
  const novo = h("button",{class:"btn",type:"button",onclick:()=>mmEscolherModelo()}, icon("plus"), "Novo mapa");
  const inicio = h("button",{class:"mm-lado-nav"+(!MM.atual?" on":""),type:"button",onclick:()=>mmInicio()}, mmIc("casa",1.5), "Início dos mapas");
  box.appendChild(h("div",{class:"mm-arq-top"}, h("div",{class:"mm-lado-tit"}, mmIc("rede",1.5), "Mapa mental"), inicio, novo, busca));
  box.appendChild(h("div",{class:"mm-lado-sec"}, "Meus mapas · "+MM.mapas.size));
  const lista = h("div",{class:"mm-arq-lista"}); box.appendChild(lista);
  function pinta(){
    lista.innerHTML = "";
    const q = MM.filtroArq.trim().toLowerCase();
    const l = mmListaOrdenada().filter(m=>!q || String(m.nome).toLowerCase().includes(q));
    if(!l.length) lista.appendChild(h("div",{class:"mm-arq-vazio"}, MM.carregado || !G.db() ? (q ? "Nenhum mapa com esse nome." : "Nenhum mapa ainda.") : "Carregando…"));
    l.forEach(m=>{
      const mn = h("button",{class:"mn",type:"button",title:"Opções"}, icon("dots"));
      mn.onclick = (e)=>{ e.stopPropagation(); menuPopup(mn, [
        {label:"Renomear", icon:"edit", run:()=>mmRenomear(m.id)},
        {label:"Duplicar", icon:"copy", run:()=>mmDuplicar(m.id)},
        "-",
        {label:"Excluir mapa", icon:"trash", danger:true, run:()=>mmExcluir(m.id)}], "left"); };
      const dt = new Date(m.atualizado||m.criado||Date.now());
      lista.appendChild(h("div",{class:"mm-arq-it"+(m.id===MM.atual?" on":""), onclick:()=>{ mmAbrir(m.id); }},
        mmEstrela(m),
        h("span",{class:"nm"}, m.nome, h("span",{class:"dt"}, dt.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"})+" · "+(m.editadoPor||m.por||"—"))), mn));
    });
  }
  pinta();
}
function mmSalvarAbas(){ try{ localStorage.setItem("painel-mapa-abas", JSON.stringify(MM.abas)); }catch(e){} }
function mmAbas(){
  const A = MM.abasEl; if(!A) return;
  MM.abas = (MM.abas||[]).filter(id=>MM.mapas.has(id) || !MM.carregado);
  A.innerHTML = "";
  MM.abas.forEach(id=>{
    const m = MM.mapas.get(id); if(!m) return;
    const fechar = h("span",{class:"mm-aba-x",role:"button",title:"Fechar aba"}, "×");
    fechar.onclick = e=>{ e.stopPropagation(); mmFecharAba(id); };
    const aba = h("button",{class:"mm-aba"+(id===MM.atual?" on":""),type:"button",title:m.nome}, h("span",{class:"mm-aba-nm"}, m.nome), fechar);
    aba.onclick = ()=>{ if(id !== MM.atual) mmAbrir(id); };
    aba.onauxclick = e=>{ if(e.button === 1){ e.preventDefault(); mmFecharAba(id); } };
    A.appendChild(aba);
  });
  const nova = h("button",{class:"mm-aba-nova",type:"button",title:"Novo mapa"}, "+");
  nova.onclick = ()=>mmEscolherModelo();
  A.appendChild(nova);
  const atual = A.querySelector(".mm-aba.on"); if(atual) atual.scrollIntoView({block:"nearest", inline:"nearest"});
}
function mmFecharAba(id){
  const i = MM.abas.indexOf(id); if(i < 0) return;
  MM.abas.splice(i, 1); mmSalvarAbas();
  if(id === MM.atual){
    const prox = MM.abas[Math.min(i, MM.abas.length-1)];
    if(prox) mmAbrir(prox); else mmInicio();
  }else mmAbas();
}
function mmAbrir(id, quieto){
  if(MM.editando) mmFimEdicao(true);
  if(!MM.abas) MM.abas = [];
  if(!MM.abas.includes(id)){ const i = MM.abas.indexOf(MM.atual); MM.abas.splice(i < 0 ? MM.abas.length : i+1, 0, id); mmSalvarAbas(); }
  MM.atual = id; MM.sel = new Set(); MM.selRel = null; MM.selRes = null; MM.desfazer = []; MM.refazer = []; MM.modoRel = null; MM.busca = null;
  const m = mmAtual(); if(m) MM.sel.add(m.raiz.id);
  try{ localStorage.setItem("painel-mapa-ultimo", id); }catch(e){}
  MM.ajustarPend = true;
  mmVisao(); mmAbas();
  if(!quieto){ mmArquivos(); mmRibbon(); mmFormato(); mmDesenhar(); }
  requestAnimationFrame(()=>{ if(MM.tela && MM.tela.clientWidth){ MM.ajustarPend = false; mmAjustar(); } });
}
function mmInicio(){
  if(MM.editando) mmFimEdicao(true);
  if(MM.apres) mmSairApres();
  if(MM.cheia) mmTelaCheia(false);
  mmFecharPop();
  MM.atual = null; MM.sel = new Set(); MM.outline = false;
  mmVisao(); mmArquivos(); mmRibbon();
  if(MM.home) MM.home.scrollTop = 0;
}
function mmVisao(){
  if(!MM.home) return;
  const m = mmAtual();
  MM.home.hidden = !!m; MM.bloco.hidden = !m;
  MM.el.classList.toggle("sem-lado", !m || !MM.mostrarArq);
  if(!m) mmHome();
}
function mmMiniMapa(m){
  const n = Math.max(0, Math.min(8, (m.raiz && m.raiz.filhos || []).length));
  const dir = m.layout === "esquerda" ? 0 : m.layout === "direita" ? n : Math.ceil(n/2), esq = n - dir; let p = "";
  const ramo = (k, tot, lado)=>{ const y = tot === 1 ? 40 : 14 + k*(52/(tot-1)); const x0 = lado > 0 ? 112 : 68, x1 = lado > 0 ? 142 : 38;
    p += '<path d="M'+x0+' 40C'+((x0+x1)/2)+' 40 '+((x0+x1)/2)+' '+y+' '+x1+' '+y+'"/><rect x="'+(lado > 0 ? x1+4 : x1-24)+'" y="'+(y-2.5)+'" width="20" height="5" rx="2.5" fill="#cfc9bd" stroke="none"/>'; };
  for(let k=0;k<dir;k++) ramo(k, dir, 1);
  for(let k=0;k<esq;k++) ramo(k, esq, -1);
  return '<svg viewBox="0 0 180 80"><g stroke="'+(m.corLinha||"#AD1815")+'" stroke-width="2" fill="none" stroke-linecap="round">'+p+'</g><rect x="68" y="35" width="44" height="10" rx="5" fill="#2f2f33"/></svg>';
}
function mmHome(){
  const H = MM.home; H.innerHTML = "";
  const topo = h("div",{class:"mm-home-topo"},
    h("div",{}, h("h2",{},"Mapa mental"), h("p",{},"Organize ideias, captações, campanhas e rotinas"+(G.marca ? " de "+G.marca : "")+".")),
    h("button",{class:"btn",type:"button",onclick:()=>mmEscolherModelo()}, icon("plus"), "Novo mapa"));
  H.appendChild(topo);
  const l = mmListaOrdenada();
  H.appendChild(h("div",{class:"mm-home-sec"}, "Seus mapas · "+l.length));
  const g = h("div",{class:"mm-home-lista"});
  if(!l.length) g.appendChild(h("div",{class:"mm-home-vazio"}, MM.carregado || !G.db() ? "Nenhum mapa ainda. Crie o primeiro a partir de um modelo abaixo." : "Carregando mapas…"));
  else g.appendChild(h("div",{class:"mm-linha cab"}, h("span",{}), h("span",{},"Nome"), h("span",{},"Tópicos"), h("span",{},"Atualizado"), h("span",{},"Por"), h("span",{})));
  l.forEach(m=>{
    const dt = new Date(m.atualizado||m.criado||Date.now());
    const acao = (rot, ic, run, perigo)=>{ const b = h("button",{class:"mm-acao"+(perigo?" perigo":""),type:"button",title:rot}, icon(ic), rot); b.onclick = e=>{ e.stopPropagation(); run(); }; return b; };
    const linha = h("div",{class:"mm-linha",role:"button",tabindex:"0",title:"Abrir "+m.nome},
      h("span",{class:"mm-linha-ic"}, mmEstrela(m)),
      h("span",{class:"mm-linha-nome"}, m.nome),
      h("span",{class:"mm-linha-n"}, String(mmContar(m))),
      h("span",{class:"mm-linha-d"}, dt.toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})),
      h("span",{class:"mm-linha-p"}, m.editadoPor||m.por||"—"),
      h("span",{class:"mm-linha-acoes"}, acao("Editar nome","edit",()=>mmRenomear(m.id)), acao("Duplicar","copy",()=>mmDuplicar(m.id)), acao("Excluir","trash",()=>mmExcluir(m.id), true)));
    linha.onclick = ()=>mmAbrir(m.id);
    linha.onkeydown = e=>{ if(e.key==="Enter"){ e.preventDefault(); mmAbrir(m.id); } };
    g.appendChild(linha);
  });
  H.appendChild(g);
  H.appendChild(h("div",{class:"mm-home-sec"}, "Começar de um modelo"));
  const gm = h("div",{class:"mm-home-grade mod"});
  MM_MODELOS.forEach(md=>{
    const b = h("button",{class:"mm-card mod",type:"button"});
    const fig = h("div",{class:"mm-card-fig"}); fig.innerHTML = mmMiniatura(md.id); b.appendChild(fig);
    b.appendChild(h("b",{}, md.nome)); b.appendChild(h("span",{}, md.cat+" · "+md.desc));
    b.onclick = async ()=>{ const nome = await caixaDialogo("Nome do mapa", true); if(nome===null) return; mmCriar(nome.trim() || (md.id==="branco" ? "Meu novo mapa mental" : md.nome), md.gerar(), md.extra); };
    gm.appendChild(b);
  });
  H.appendChild(gm);
}
function mmCriar(nome, raiz, extra, ficar){
  const m = Object.assign(mmNovoMapa(nome, raiz), extra||{});
  MM.mapas.set(m.id, m); mmGravar(m, true);
  if(ficar){ mmArquivos(); mmHome(); return m; }
  mmAbrir(m.id);
  setTimeout(()=>MM.tela.focus(), 30);
  return m;
}
function mmEscolherModelo(){
  const ov = h("div",{style:"position:fixed;inset:0;background:rgba(15,15,15,.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px"});
  const cx = h("div",{style:"background:#fff;border-radius:10px;max-width:760px;width:100%;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.25);max-height:90vh;overflow:auto"});
  cx.appendChild(h("div",{style:"font-weight:600;font-size:15px;margin-bottom:4px"},"Novo mapa mental"));
  cx.appendChild(h("div",{class:"peek-hint",style:"margin:0 0 12px"},"Escolha um modelo para começar. Dá para mudar layout e tema depois."));
  let g = null, catAtual = null;
  MM_MODELOS.forEach(md=>{
    if(md.cat !== catAtual){ catAtual = md.cat; cx.appendChild(h("div",{class:"mm-cat"}, md.cat)); g = h("div",{class:"mm-modelos"}); cx.appendChild(g); }
    const b = h("button",{type:"button"}); b.innerHTML = mmMiniatura(md.id);
    b.appendChild(h("b",{}, md.nome)); b.appendChild(h("span",{}, md.desc));
    b.onclick = async ()=>{ ov.remove(); const nome = await caixaDialogo("Nome do mapa", true); if(nome===null) return; mmCriar(nome.trim() || (md.id==="branco" ? "Meu novo mapa mental" : md.nome), md.gerar(), md.extra); };
    g.appendChild(b);
  });
  const imp = h("button",{type:"button"}); imp.innerHTML = '<svg viewBox="0 0 150 60"><path d="M30 18h60M42 30h60M42 42h50" stroke="#BFA472" stroke-width="3" stroke-linecap="round"/></svg>';
  imp.appendChild(h("b",{},"Importar texto")); imp.appendChild(h("span",{},"Cole uma lista com recuo ou Markdown"));
  imp.onclick = ()=>{ ov.remove(); mmImportar(); };
  cx.appendChild(h("div",{class:"mm-cat"}, "Outros")); const gi = h("div",{class:"mm-modelos"}); gi.appendChild(imp); cx.appendChild(gi);
  cx.appendChild(h("div",{style:"display:flex;justify-content:flex-end;margin-top:12px"}, h("button",{class:"btn ghost",type:"button",onclick:()=>ov.remove()},"Cancelar")));
  ov.appendChild(cx); ov.addEventListener("click", e=>{ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov);
}
function mmMiniatura(tipo){
  const md = MM_MODELOS.find(x=>x.id===tipo); let n = 4;
  try{ n = md ? Math.max(1, Math.min(8, md.gerar().filhos.length)) : 4; }catch(e){}
  if(tipo === "branco") n = 0;
  const dir = Math.ceil(n/2), esq = n - dir; let p = "";
  const ramo = (k, tot, lado)=>{ const y = tot === 1 ? 30 : 10 + k*(40/(tot-1)); const x0 = lado > 0 ? 96 : 54, x1 = lado > 0 ? 122 : 28;
    p += '<path d="M'+x0+' 30C'+((x0+x1)/2)+' 30 '+((x0+x1)/2)+' '+y+' '+x1+' '+y+'"/><rect x="'+(lado > 0 ? x1+3 : x1-19)+'" y="'+(y-2)+'" width="16" height="4" rx="2" fill="#c9c3b6" stroke="none"/>'; };
  for(let k=0;k<dir;k++) ramo(k, dir, 1);
  for(let k=0;k<esq;k++) ramo(k, esq, -1);
  return '<svg viewBox="0 0 150 60"><g stroke="#AD1815" stroke-width="2" fill="none" stroke-linecap="round">'+p+'</g><rect x="56" y="26" width="38" height="8" rx="4" fill="#2f2f33"/></svg>';
}
async function mmRenomear(id){
  const m = MM.mapas.get(id); if(!m) return;
  const n = await caixaDialogo("Novo nome do mapa", true); if(!n || !n.trim()) return;
  m.nome = n.trim(); mmGravar(m, true); mmArquivos(); mmAbas(); if(!MM.atual) mmHome(); else mmRibbon();
}
function mmDuplicar(id){
  const m = MM.mapas.get(id); if(!m) return;
  const c = mmClone(m);
  const troca = new Map();
  const novaId = n=>{ const v = mmUid(); troca.set(n.id, v); n.id = v; n.filhos.forEach(novaId); };
  novaId(c.raiz); c.flut.forEach(novaId); (c.res||[]).forEach(s=>{ if(s.no) s.no.id = mmUid(); s.ids = s.ids.map(i=>troca.get(i)||i); s.pai = troca.get(s.pai)||s.pai; s.id = mmUid(); });
  c.rel.forEach(r=>{ r.id = mmUid(); r.de = troca.get(r.de)||r.de; r.para = troca.get(r.para)||r.para; });
  c.lim.forEach(l=>{ l.id = mmUid(); l.alvo = troca.get(l.alvo)||l.alvo; });
  delete c.id;
  mmCriar(m.nome+" (cópia)", c.raiz, {flut:c.flut, rel:c.rel, res:c.res, lim:c.lim, layout:c.layout, tema:c.tema, ramo:c.ramo, fundo:c.fundo, espaco:c.espaco, corLinha:c.corLinha}, !MM.atual);
}
async function mmExcluir(id){
  const m = MM.mapas.get(id); if(!m) return;
  const ok = await caixaDialogo("Excluir o mapa \""+m.nome+"\"? Isso não pode ser desfeito.");
  if(!ok) return;
  MM.mapas.delete(id);
  if(G.db()) G.db().doc("mapas/"+id).delete().catch(onDbErr);
  else { try{ const all = {}; MM.mapas.forEach((v,k)=>all[k]=v); localStorage.setItem(LS_MAPAS, JSON.stringify(all)); }catch(e){} }
  MM.abas = (MM.abas||[]).filter(x=>x!==id); mmSalvarAbas();
  if(MM.atual === id){ const prox = MM.abas[0]; if(prox) mmAbrir(prox); else { MM.atual = null; mmVisao(); } }
  mmArquivos(); mmRibbon(); mmFormato(); mmDesenhar();
}

/* ---------- faixa de comandos (ribbon) ---------- */
function mmBtn(ic, rotulo, run, opt){
  opt = opt||{};
  const b = h("button",{class:"mm-b"+(opt.on?" on":""),type:"button",title:opt.dica||rotulo, disabled:opt.off||false}, mmIc(ic), rotulo);
  b.onclick = (e)=>{ run(b, e); if(!opt.manterFoco) setTimeout(()=>{ if(!MM.editando && !MM.outline) MM.tela.focus({preventScroll:true}); }, 0); };
  return b;
}
function mmRibbon(){
  if(!MM.el || !MM.topE) return;
  const m = mmAtual();
  const E = MM.topE; E.innerHTML = "";
  E.appendChild(mmB("voltar","Voltar ao início dos mapas", ()=>mmInicio()));
  if(G.logo) E.appendChild(h("img",{class:"mm-logo",src:G.logo,alt:"",title:"Mapa mental"+(G.marca ? " · "+G.marca : "")}));
  E.appendChild(mmSep());
  if(!MM.cheia) E.appendChild(mmB("painelE", MM.mostrarArq ? "Esconder a lista de mapas" : "Mostrar a lista de mapas", ()=>mmLista(), {cls:MM.mostrarArq?"on":""}));
  E.appendChild(mmB("mais3","Menu do mapa", b=>mmMenuMapa(b)));
  E.appendChild(mmSep());
  const nome = h("input",{class:"mm-titulo",type:"text",value:m ? m.nome : "Mapa mental",title:"Clique para renomear",disabled:!m});
  nome.onkeydown = e=>{ e.stopPropagation(); if(e.key==="Enter"){ e.preventDefault(); nome.blur(); } if(e.key==="Escape"){ nome.value = m ? m.nome : ""; nome.blur(); } };
  nome.onblur = ()=>{ const v = nome.value.trim(); if(m && v && v !== m.nome){ m.nome = v; mmGravar(m, true); mmArquivos(); mmAbas(); } else if(m) nome.value = m.nome; };
  nome.oninput = ()=>{ nome.style.width = Math.min(360, Math.max(80, nome.value.length*9+24))+"px"; }; nome.oninput();
  E.appendChild(nome);
  MM.nuvem = null;
  E.appendChild(mmB("tema","Layout, tema e ramos", b=>mmPop(b,"pagina"), {off:!m}));
  E.appendChild(mmB("buscar","Localizar (Ctrl+F)", ()=>mmAbrirBusca(), {off:!m}));
  const D = MM.topD; D.innerHTML = "";
  const g1 = h("div",{class:"mm-grp2"}, mmB("undo","Desfazer (Ctrl+Z)", ()=>mmVoltar(false), {off:!MM.desfazer.length}), mmB("redo","Refazer (Ctrl+Y)", ()=>mmVoltar(true), {off:!MM.refazer.length}));
  const g2 = h("div",{class:"mm-grp2"},
    mmB("baixar","Exportar", b=>menuPopup(b, [{label:"Imagem PNG", icon:"image", run:()=>mmExportarImagem("png")},{label:"Imagem SVG", icon:"image", run:()=>mmExportarImagem("svg")},{label:"Texto em Markdown", icon:"title", run:()=>mmExportarTexto()}], "right"), {off:!m}),
    mmB("apres","Apresentar", ()=>mmApresentar(), {off:!m}),
    MM.cheia ? mmB("minimizar","Minimizar e voltar ao sistema (Esc)", ()=>mmTelaCheia(false), {cls:"destaque"}) : mmB("cheia","Tela cheia", ()=>mmTelaCheia(true), {cls:"destaque"}));
  D.appendChild(g1); D.appendChild(g2);
  const Z = MM.zoomBar; Z.innerHTML = "";
  if(m && !MM.outline){
    Z.appendChild(mmB("menos","Diminuir (Ctrl −)", ()=>mmZoomEm(MM.zoom/1.2)));
    MM.zoomTx = h("button",{class:"mm-zt",type:"button",title:"Voltar a 100%"}, Math.round(MM.zoom*100)+"%"); MM.zoomTx.onclick = ()=>mmZoomEm(1);
    Z.appendChild(MM.zoomTx);
    Z.appendChild(mmB("plus","Aumentar (Ctrl +)", ()=>mmZoomEm(MM.zoom*1.2)));
    Z.appendChild(mmSep());
    Z.appendChild(mmB("ajustar","Centralizar o mapa", ()=>mmAjustar()));
    Z.appendChild(mmB("outline","Estrutura de tópicos", ()=>{ MM.outline = !MM.outline; mmDesenhar(); mmRibbon(); }));
  }else if(m){ Z.appendChild(mmB("outline","Voltar ao mapa", ()=>{ MM.outline = false; mmDesenhar(); mmRibbon(); }, {cls:"on"})); }
  Z.hidden = !m;
  mmStatus(); mmCtx();
}
function mmMenuMapa(b){
  const m = mmAtual();
  menuPopup(b, [
    {label:"Novo mapa", icon:"plus", run:()=>mmEscolherModelo()},
    {label:MM.mostrarArq ? "Esconder a lista de mapas" : "Mostrar a lista de mapas", icon:"list", run:()=>mmLista()},
    ...(m ? [
      "-",
      {label:"Renomear", icon:"edit", run:()=>mmRenomear(m.id)},
      {label:"Duplicar", icon:"copy", run:()=>mmDuplicar(m.id)},
      {label:"Layout, tema e ramos", icon:"props", run:()=>mmPop(MM.topE.querySelector('[aria-label="Layout, tema e ramos"]'), "pagina")},
      {label:"Estrutura de tópicos", icon:"list", run:()=>{ MM.outline = !MM.outline; mmDesenhar(); mmRibbon(); }},
      {label:"Expandir tudo", icon:"down", run:()=>mmNivel(99)},
      {label:"Mostrar só o 1º nível", icon:"up", run:()=>mmNivel(1)},
      {label:"Painel de formatação", icon:"props", run:()=>{ MM.mostrarFmt = true; MM.painel = "topico"; mmFormato(); }},
      "-",
      {label:"Importar texto", icon:"download", run:()=>mmImportar()},
      {label:"Exportar Markdown", icon:"title", run:()=>mmExportarTexto()},
      "-",
      {label:"Excluir este mapa", icon:"trash", danger:true, run:()=>mmExcluir(m.id)}
    ] : [{label:"Importar texto", icon:"download", run:()=>mmImportar()}])
  ], "left");
}
/* barra de contexto acima do tópico selecionado + botões "+" */
function mmCtx(){
  if(!MM.ctx) return;
  const m = mmAtual();
  const s = (m && MM.sel.size === 1 && !MM.apres && !MM.outline && !MM.arrastando && !MM.modoRel) ? mmSelUm() : null;
  const b = s && MM.B.get(s.id);
  const vis = !!b;
  MM.ctx.hidden = !vis; MM.maisD.hidden = !vis; MM.maisB.hidden = !vis; MM.dica.hidden = !vis;
  if(!vis){ if(MM.pop && MM.pop.painel !== "pagina") mmFecharPop(); return; }
  const r = mmAchar(m, s.id);
  const W = MM.tela.clientWidth, H = MM.tela.clientHeight;
  const x1 = b.x*MM.zoom + MM.px, y1 = b.y*MM.zoom + MM.py, w = b.w*MM.zoom, hh = b.h*MM.zoom;
  const cw = MM.ctx.offsetWidth || 420, ch = MM.ctx.offsetHeight || 44;
  let cx = x1 + w/2 - cw/2; cx = Math.max(8, Math.min(W - cw - 8, cx));
  const outros = [];
  MM.B.forEach((o,id)=>{ if(id !== s.id) outros.push({x:o.x*MM.zoom+MM.px-4, y:o.y*MM.zoom+MM.py-4, w:o.w*MM.zoom+8, h:o.h*MM.zoom+8}); });
  const cobre = (x,y)=> outros.some(c=>x < c.x+c.w && x+cw > c.x && y < c.y+c.h && y+ch > c.y);
  const opcoes = [y1 - ch - 14, y1 + hh + 48, y1 - ch - 14 - 40, y1 + hh + 90].filter(y=>y >= 104 && y + ch <= H - 8);
  let cy = opcoes.find(y=>!cobre(cx, y)); if(cy === undefined) cy = opcoes[0] !== undefined ? opcoes[0] : Math.max(104, y1 - ch - 14);
  MM.ctx.style.transform = "translate("+cx+"px,"+cy+"px)";
  const vert = b.modo === "v" || b.modo === "t1" || b.modo === "tl1" || b.modo === "l";
  const d = b.modo === "h" && b.dir < 0 ? -1 : 1;
  const resumo = !!r.resumo;
  MM.maisD.hidden = resumo;
  MM.maisB.hidden = resumo || !r.pai;
  if(vert && b.modo === "v"){ MM.maisD.style.transform = "translate("+(x1+w/2-12)+"px,"+(y1+hh+10)+"px)"; MM.maisB.style.transform = "translate("+(x1+w+10)+"px,"+(y1+hh/2-12)+"px)"; }
  else {
    const temFilhos = s.filhos.length && !s.col;
    // com filhos à vista, o "+" sobe para o canto e deixa livre o círculo de recolher
    if(temFilhos) MM.maisD.style.transform = "translate("+(d > 0 ? x1+w+4 : x1-28)+"px,"+(y1-26)+"px)";
    else MM.maisD.style.transform = "translate("+(d > 0 ? x1+w+10 : x1-34)+"px,"+(y1+hh/2-12)+"px)";
    MM.maisB.style.transform = "translate("+(x1+w/2-12)+"px,"+(y1+hh+10)+"px)";
  }
  // dica Tab/Enter: só em tópico sem filhos visíveis e onde não cobre nenhum outro tópico
  let mostra = mmContar(m) <= 8 && !MM.editando && !resumo && (!s.filhos.length || s.col);
  if(mostra){
    MM.dica.hidden = false;
    const dw = MM.dica.offsetWidth || 230, dh = MM.dica.offsetHeight || 52;
    const caixas = [];
    MM.B.forEach((o,id)=>{ if(id !== s.id) caixas.push({x:o.x*MM.zoom+MM.px-6, y:o.y*MM.zoom+MM.py-6, w:o.w*MM.zoom+12, h:o.h*MM.zoom+12}); });
    const livre = (x,y)=> x >= 4 && y >= 100 && x+dw <= W-4 && y+dh <= H-4 && !caixas.some(c=>x < c.x+c.w && x+dw > c.x && y < c.y+c.h && y+dh > c.y);
    const cands = (d > 0 && !(vert && b.modo==="v"))
      ? [[x1+w+46, y1+hh/2-dh/2], [x1+w/2-dw/2, y1+hh+44], [x1-dw-46, y1+hh/2-dh/2]]
      : [[x1-dw-46, y1+hh/2-dh/2], [x1+w/2-dw/2, y1+hh+44], [x1+w+46, y1+hh/2-dh/2]];
    const ok = cands.find(([x,y])=>livre(x,y));
    if(ok) MM.dica.style.transform = "translate("+ok[0]+"px,"+ok[1]+"px)"; else mostra = false;
  }
  MM.dica.hidden = !mostra;
  if(MM.pop) mmPosPop();
}
function svgGrande(l){ const s = '<svg class="ic" viewBox="0 0 54 34" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+l.ic+'</svg>'; const w = document.createElement("span"); w.style.display="flex"; w.innerHTML = s; const e = w.firstChild; e.style.width="26px"; e.style.height="20px"; return e; }
function mmPagina(mud){ const m = mmAtual(); if(!m) return; mmAntes(); Object.assign(m, mud); mmMudou(); if(mud.layout) requestAnimationFrame(()=>mmAjustar()); }

/* ---------- seleção ---------- */
function mmSelUm(){ const m = mmAtual(); if(!m || !MM.sel.size) return null; const id = [...MM.sel].pop(); const r = mmAchar(m, id); return r ? r.n : null; }
function mmSelecionar(id, somar){
  MM.selRel = null;
  if(somar){ if(MM.sel.has(id)) MM.sel.delete(id); else MM.sel.add(id); }
  else MM.sel = new Set([id]);
  mmPintarSel(); mmRibbon(); mmFormato();
}
function mmPintarSel(){
  MM.nos.forEach((el,id)=>el.classList.toggle("sel", MM.sel.has(id)));
  if(MM.camNos) MM.camNos.querySelectorAll(".mm-tg").forEach(t=>t.classList.toggle("vis", MM.sel.has(t.dataset.no)));
  mmDesenharLinhas(); mmCtx();
}

/* ---------- edição de tópicos ---------- */
function mmNovoTopico(){ return {id:mmUid(), t:"", filhos:[]}; }
function mmFilho(){
  const m = mmAtual(), s = mmSelUm(); if(!m || !s) return;
  if(mmAchar(m, s.id).resumo) return;
  mmAntes();
  const n = mmNovoTopico(); n.t = s.id===m.raiz.id ? "Tópico principal" : "Subtópico";
  if(s.id === m.raiz.id && m.layout === "mapa") n.lado = "d";
  s.col = false; s.filhos.push(n);
  MM.sel = new Set([n.id]); mmMudou(); mmEditar(n.id, true);
}
function mmIrmao(antes){
  const m = mmAtual(), s = mmSelUm(); if(!m || !s) return;
  const r = mmAchar(m, s.id);
  if(r.resumo) return;
  if(!r.pai){ mmFilho(); return; }
  mmAntes();
  const n = mmNovoTopico(); n.t = r.nivel===1 ? "Tópico principal" : "Subtópico";
  if(s.lado) n.lado = s.lado;
  else if(r.nivel === 1 && !r.flut && m.layout === "mapa"){ const bs = MM.B.get(s.id); n.lado = s.lado = (bs && bs.dir < 0) ? "e" : "d"; }
  r.lista.splice(r.idx + (antes?0:1), 0, n);
  MM.sel = new Set([n.id]); mmMudou(); mmEditar(n.id, true);
}
function mmPai(){
  const m = mmAtual(), s = mmSelUm(); if(!m || !s) return;
  const r = mmAchar(m, s.id); if(!r.pai) return;
  mmAntes();
  const n = mmNovoTopico(); n.t = "Tópico"; n.filhos = [s]; if(s.lado){ n.lado = s.lado; delete s.lado; }
  r.lista.splice(r.idx, 1, n);
  MM.sel = new Set([n.id]); mmMudou(); mmEditar(n.id, true);
}
function mmFlutuante(x, y){
  const m = mmAtual(); if(!m) return;
  mmAntes();
  const n = mmNovoTopico(); n.t = "Tópico flutuante";
  if(x == null){ const r = MM.tela.getBoundingClientRect(); const p = mmTelaParaMundo(r.left + r.width*0.72, r.top + r.height*0.25); x = p.x; y = p.y; }
  n.x = Math.round(x); n.y = Math.round(y);
  m.flut.push(n);
  MM.sel = new Set([n.id]); mmMudou(); mmEditar(n.id, true);
}
function mmApagar(){
  const m = mmAtual(); if(!m) return;
  if(MM.selRel){ mmAntes(); m.rel = m.rel.filter(r=>r.id!==MM.selRel); MM.selRel = null; mmMudou(); return; }
  if(MM.selLim){ mmAntes(); m.lim = m.lim.filter(r=>r.id!==MM.selLim); MM.selLim = null; mmMudou(); return; }
  const ids = [...MM.sel].filter(id=>id!==m.raiz.id);
  if(!ids.length) return;
  mmAntes();
  let prox = null;
  ids.forEach(id=>{
    const r = mmAchar(m, id); if(!r) return;
    if(r.resumo){ m.res = m.res.filter(s=>s!==r.resumo); return; }
    const sub = mmIdsSub(r.n);
    r.lista.splice(r.idx, 1);
    mmLimparRefs(m, sub);
    prox = r.lista[Math.min(r.idx, r.lista.length-1)] || r.pai;
  });
  MM.sel = new Set([prox && mmAchar(m, prox.id) ? prox.id : m.raiz.id]);
  mmMudou();
}
function mmMoverIrmao(d){
  const m = mmAtual(), s = mmSelUm(); if(!m || !s) return;
  const r = mmAchar(m, s.id); if(!r.lista || r.flut && !r.pai) return;
  const j = r.idx + d; if(j < 0 || j >= r.lista.length) return;
  mmAntes(); r.lista.splice(r.idx,1); r.lista.splice(j,0,s); mmMudou();
}
function mmAlternar(id){
  const m = mmAtual(); const r = mmAchar(m, id); if(!r || !r.n.filhos.length) return;
  mmAntes(); r.n.col = !r.n.col;
  if(r.n.col){ const sub = mmIdsSub(r.n); sub.delete(r.n.id); MM.sel = new Set([...MM.sel].filter(i=>!sub.has(i))); if(!MM.sel.size) MM.sel.add(id); }
  mmMudou();
}
function mmNivel(k){
  const m = mmAtual(); if(!m) return; mmAntes();
  const vai = (n, nv)=>{ if(n.filhos.length) n.col = nv >= k; n.filhos.forEach(c=>vai(c, nv+1)); };
  vai(m.raiz, 0); m.raiz.col = false; m.flut.forEach(f=>vai(f, 1));
  MM.sel = new Set([m.raiz.id]); mmMudou(); requestAnimationFrame(()=>mmAjustar());
}
function mmCopiar(cortar){
  const m = mmAtual(); if(!m) return;
  const ids = [...MM.sel].filter(id=>{ const r = mmAchar(m,id); return r && !r.resumo; });
  if(!ids.length) return;
  MM.clip = ids.map(id=>mmClone(mmAchar(m,id).n));
  copiarTexto(MM.clip.map(n=>mmParaTexto(n,0,"  ")).join("\n")).catch?.(()=>{});
  if(cortar){ MM.sel = new Set(ids.filter(i=>i!==m.raiz.id)); mmApagar(); }
  mmRibbon();
}
function mmColar(){
  const m = mmAtual(), s = mmSelUm(); if(!m || !s || !MM.clip) return;
  if(mmAchar(m, s.id).resumo) return;
  mmAntes();
  const novos = MM.clip.map(n=>{ const c = mmClone(n); const re = x=>{ x.id = mmUid(); delete x.x; delete x.y; delete x.lado; x.filhos.forEach(re); }; re(c); return c; });
  s.col = false; s.filhos.push(...novos);
  MM.sel = new Set(novos.map(n=>n.id)); mmMudou();
}
function mmEditar(id, novo){
  const el = MM.nos.get(id); if(!el) return;
  const tx = el.querySelector(".tx"); if(!tx) return;
  const m = mmAtual(); const r = mmAchar(m, id); if(!r) return;
  MM.editando = {id, antes:r.n.t, novo:!!novo, snap:JSON.stringify(m)};
  tx.textContent = r.n.t || "";
  tx.setAttribute("contenteditable","true");
  tx.focus();
  const sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(tx); sel.removeAllRanges(); sel.addRange(rg);
  tx.oninput = ()=>{ r.n.t = tx.innerText.replace(/\n$/,""); mmPosicionar(); };
  tx.onkeydown = (e)=>{
    e.stopPropagation();
    if(e.key === "Escape"){ e.preventDefault(); r.n.t = MM.editando.antes; mmFimEdicao(false); }
    else if(e.key === "Enter" && !e.shiftKey){ e.preventDefault(); mmFimEdicao(true); }
    else if(e.key === "Tab"){ e.preventDefault(); mmFimEdicao(true); mmFilho(); }
  };
  tx.onblur = ()=>{ if(MM.editando && MM.editando.id === id) mmFimEdicao(true, true); };
}
function mmFimEdicao(salvar, porBlur){
  const ed = MM.editando; if(!ed) return;
  MM.editando = null;
  const m = mmAtual(); const r = m && mmAchar(m, ed.id);
  if(r){
    let t = (r.n.t||"").replace(/\u00a0/g," ").replace(/\s+$/,"");
    if(!t.trim()) t = ed.antes || "Tópico";
    r.n.t = salvar ? t : ed.antes;
    if(r.n.t !== ed.antes && !ed.novo){ MM.desfazer.push(ed.snap); MM.refazer = []; }
  }
  mmDesenhar(); mmGravar(m); mmFormato(); mmRibbon();
  if(!porBlur) MM.tela.focus({preventScroll:true});
}
async function mmPedirLink(){
  const s = mmSelUm(); if(!s) return;
  const v = await caixaDialogo("Link do tópico (deixe vazio para remover)", true);
  if(v === null) return;
  mmAntes(); let u = v.trim(); if(u && !/^https?:\/\//i.test(u)) u = "https://"+u;
  if(u) s.link = u; else delete s.link; mmMudou();
}
async function mmPedirTag(){
  const s = mmSelUm(); if(!s) return;
  const v = await caixaDialogo("Etiqueta (separe várias por vírgula)", true);
  if(!v || !v.trim()) return;
  mmAntes(); s.tags = [...new Set((s.tags||[]).concat(v.split(",").map(x=>x.trim()).filter(Boolean)))]; mmMudou();
}
function mmVincularDemanda(){
  const s = mmSelUm(); if(!s) return;
  const ov = h("div",{style:"position:fixed;inset:0;background:rgba(15,15,15,.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px"});
  const cx = h("div",{style:"background:#fff;border-radius:10px;max-width:520px;width:100%;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.25)"});
  cx.appendChild(h("div",{style:"font-weight:600;margin-bottom:8px"},"Vincular imóvel ao tópico"));
  const q = h("input",{type:"text",placeholder:"Buscar por código, título ou bairro…",style:"width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid rgba(55,53,47,.2);border-radius:6px;font:inherit;margin-bottom:10px"});
  const lista = h("div",{class:"mm-dlg-lista"});
  const pinta = ()=>{
    lista.innerHTML = "";
    const t = q.value.trim().toLowerCase();
    const itens = [...state.items.values()].filter(it=>!t || String(it.busca||it.nome||"").toLowerCase().includes(t))
      .sort((a,b)=>String(b.postagem||b.entrega||"").localeCompare(String(a.postagem||a.entrega||""))).slice(0,80);
    if(!itens.length) lista.appendChild(h("div",{style:"padding:14px;color:var(--mm-text-3);font-size:13px"},"Nenhum imóvel encontrado."));
    itens.forEach(it=>lista.appendChild(h("button",{type:"button",onclick:()=>{ ov.remove(); mmAntes(); s.dem = it.id; if(!s.t || /^(Tópico|Subtópico|Tópico principal)$/.test(s.t)) s.t = it.nome||s.t; mmMudou(); }},
      h("span",{}, it.nome||"Sem nome"), h("small",{}, (it.postagem||it.entrega||"").slice(0,10)))));
  };
  q.oninput = pinta; pinta();
  cx.appendChild(q); cx.appendChild(lista);
  const bar = h("div",{style:"display:flex;gap:8px;justify-content:flex-end"});
  if(s.dem) bar.appendChild(h("button",{class:"btn ghost",type:"button",onclick:()=>{ ov.remove(); mmAntes(); delete s.dem; mmMudou(); }},"Remover vínculo"));
  bar.appendChild(h("button",{class:"btn ghost",type:"button",onclick:()=>ov.remove()},"Cancelar"));
  cx.appendChild(bar); ov.appendChild(cx); ov.addEventListener("click", e=>{ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov); q.focus();
}
function mmVirarSolicitacao(){
  const s = mmSelUm(); if(!s) return;
  if(!G.novaSolicitacao){ mmStatus("Criar imóvel indisponível nesta versão."); return; }
  if(G.podeCriar && !G.podeCriar()){ mmStatus("Seu acesso não cria imóveis."); return; }
  if(s.dem && state.items.has(s.dem)){ G.openPeek(s.dem); return; }
  const m = mmAtual(); if(!m) return;
  // caminho do tópico até a raiz vira contexto do briefing
  const cam = []; let id = s.id, guarda = 0;
  while(id && guarda++ < 50){ const r = mmAchar(m, id); if(!r) break; cam.unshift(String(r.n.t||"").trim()); id = r.pai ? r.pai.id : null; }
  const tema = String(s.t||"").trim();
  const filhos = (s.filhos||[]).map(f=>String(f.t||"").trim()).filter(t=>t && t!==MM_P);
  const brief = ["Do mapa mental \""+(m.nome||"")+"\": "+cam.filter(Boolean).join(" › "), filhos.length ? "Pontos: "+filhos.join(" · ") : "", s.nota ? "Nota: "+s.nota : ""].filter(Boolean).join("\n");
  const idNo = s.id, idMapa = m.id;
  G.novaSolicitacao({tema, brief, onCriada:(idDem)=>{
    const mm = MM.mapas.get(idMapa); if(!mm) return;
    const r = mmAchar(mm, idNo); if(!r) return;
    const eraAtual = MM.atual === idMapa;
    if(eraAtual) mmAntes();
    r.n.dem = idDem;
    if(eraAtual){ mmMudou(); mmStatus("Imóvel criado como rascunho e ligado ao tópico."); }
    else{ mm.atualizado = Date.now(); if(G.db()) G.db().doc("mapas/"+mm.id).set(mmClone(mm)).catch(()=>{}); }
  }});
}
function mmIniciarRel(){
  const s = mmSelUm(); if(!s) return;
  MM.modoRel = MM.modoRel ? null : s.id;
  MM.tela.classList.toggle("rel", !!MM.modoRel);
  mmStatus(MM.modoRel ? "Clique no tópico de destino da relação (Esc cancela)" : null);
  mmRibbon();
}
function mmCriarRel(para){
  const m = mmAtual(); const de = MM.modoRel; MM.modoRel = null; MM.tela.classList.remove("rel"); mmStatus(null);
  if(!de || de === para) { mmRibbon(); return; }
  mmAntes();
  const a = MM.B.get(de), b = MM.B.get(para);
  const dx = b && a ? (b.x+b.w/2)-(a.x+a.w/2) : 100;
  const r = {id:mmUid(), de, para, t:"", c1:[dx*0.3, -70], c2:[-dx*0.3, -70]};
  m.rel.push(r); MM.selRel = r.id; MM.sel = new Set(); mmMudou();
}
function mmResumo(){
  const m = mmAtual(); if(!m) return;
  const rs = [...MM.sel].map(id=>mmAchar(m,id)).filter(r=>r && r.pai && !r.resumo);
  if(!rs.length) return;
  const pai = rs[0].pai; const doMesmo = rs.filter(r=>r.pai===pai);
  mmAntes();
  const no = {id:mmUid(), t:"Resumo", filhos:[]};
  m.res.push({id:mmUid(), pai:pai.id, ids:doMesmo.map(r=>r.n.id), no});
  MM.sel = new Set([no.id]); mmMudou(); mmEditar(no.id, true);
}
function mmLimite(){
  const m = mmAtual(), s = mmSelUm(); if(!m || !s) return;
  mmAntes();
  const ex = m.lim.find(l=>l.alvo===s.id);
  if(ex) m.lim = m.lim.filter(l=>l!==ex);
  else m.lim.push({id:mmUid(), alvo:s.id, cor:"#BFA472", t:""});
  mmMudou();
}

/* ---------- layout ---------- */
function mmTipo(m, id, r){
  if(r.resumo) return "res";
  if(id === m.raiz.id) return "raiz";
  if(r.flut && r.nivel === 0) return "flut";
  if(r.nivel === 1 && !r.flut) return "princ";
  return "sub";
}
function mmEstilo(m, n, tipo, cor){
  const T = MM_TEMAS[m.tema] || MM_TEMAS.esdras;
  const base = tipo==="raiz" ? T.raiz : (tipo==="princ"||tipo==="flut"||tipo==="res") ? T.princ : T.sub;
  const rc = v => v==="ramo" ? cor : v;
  const e = n.est || {};
  const forma = e.forma || base.forma || (tipo==="sub" ? "sublinhado" : tipo==="raiz" ? "arredondado" : tipo==="flut" ? "capsula" : "arredondado");
  let fill = e.fill !== undefined ? e.fill : rc(base.fill || null);
  let borda = e.borda !== undefined ? e.borda : rc(base.borda || (forma==="sublinhado" ? "ramo" : null));
  if(forma === "sublinhado" && e.fill === undefined) fill = null;
  if(forma === "sublinhado" && !borda) borda = cor;
  return {forma, fill, borda, cor: e.cor || rc(base.cor) || "#14130F",
    tam: e.tam || base.tam || (tipo==="raiz" ? 21 : (tipo==="princ"||tipo==="flut") ? 15 : tipo==="res" ? 14 : 13.5),
    b: e.b !== undefined ? e.b : base.b !== undefined ? (tipo==="raiz" || base.b) : (tipo==="raiz" || tipo==="princ"), i: !!e.i,
    bw: base.bw || (tipo==="raiz" ? 2 : 1.5), rad: base.rad, pad: base.pad};
}
function mmCorRamo(m, idx){ const T = MM_TEMAS[m.tema] || MM_TEMAS.esdras; return T.ramos[idx % T.ramos.length]; }
function mmMarcaSVG(c){
  if(/^p\d$/.test(c)){ const k = +c[1]; return '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.3" fill="'+MM_PRIO[k-1]+'"/><text x="8" y="11.6" text-anchor="middle" font-size="10" font-weight="700" fill="#fff" font-family="Arial,sans-serif">'+k+'</text></svg>'; }
  if(/^g\d$/.test(c)){ const k = +c[1]; if(k===8) return '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7.3" fill="#5BAE4F"/><path d="M4.6 8.3l2.3 2.3 4.6-4.8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>';
    const a = k/8*Math.PI*2, x = 8+6*Math.sin(a), y = 8-6*Math.cos(a);
    const fat = k===0 ? "" : '<path d="M8 8V2A6 6 0 0 1 '+x.toFixed(2)+' '+y.toFixed(2)+'Z" fill="#5BAE4F"/>';
    return '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="#fff" stroke="#5BAE4F" stroke-width="1.4"/>'+(k===4?'<path d="M8 2A6 6 0 0 1 8 14Z" fill="#5BAE4F"/>':fat)+'</svg>'; }
  if(c.startsWith("f:")){ const cor = MM_FLAG[c.slice(2)]||"#E5484D"; return '<svg viewBox="0 0 16 16"><path d="M3.5 1.5v13" stroke="#555" stroke-width="1.4" stroke-linecap="round"/><path d="M4 2h8.5l-2 3 2 3H4z" fill="'+cor+'"/></svg>'; }
  return null;
}
function mmNoEl(m, n, tipo, cor){
  const e = mmEstilo(m, n, tipo, cor);
  MM.est.set(n.id, Object.assign({tipo, ramo:cor}, e));
  const el = h("div",{class:"mm-no"+(MM.sel.has(n.id)?" sel":"")+((e.forma==="sem"||e.forma==="sublinhado") && !e.fill ? " f-sem" : ""), dataset:{id:n.id}});
  const pad = e.pad && !n.est ? e.pad : tipo==="raiz" ? "13px 24px" : e.forma==="sublinhado" ? "3px 5px 4px" : e.forma==="sem" ? "4px 6px" : e.forma==="elipse" ? "14px 26px" : (tipo==="princ"||tipo==="flut") ? "8px 16px" : "6px 12px";
  const rad = (e.forma==="arredondado" && e.rad) ? e.rad : {arredondado:"9px", retangulo:"2px", capsula:"999px", elipse:"50%", sublinhado:"0", sem:"0"}[e.forma] || "8px";
  el.style.cssText = "padding:"+pad+";border-radius:"+rad+";background:"+(e.fill||"transparent")+";color:"+e.cor+";font-size:"+e.tam+"px;font-weight:"+(e.b?650:400)+";font-style:"+(e.i?"italic":"normal")+";"
    + (e.forma==="sublinhado" ? "border:0;border-bottom:2px solid "+(e.borda||cor)+";" : e.forma==="sem" ? "border:0;" : "border:"+e.bw+"px solid "+(e.borda||"transparent")+";");
  const ln = h("div",{class:"ln"});
  const mk = (n.mk||[]);
  if(mk.length){
    const box = h("span",{class:"mm-mk"});
    mk.forEach(c=>{ const s = mmMarcaSVG(c); if(s){ const w = document.createElement("span"); w.style.display="flex"; w.innerHTML = s; box.appendChild(w.firstChild); } else box.appendChild(h("span",{class:"em"}, c.replace(/^e:/,""))); });
    ln.appendChild(box);
  }
  ln.appendChild(h("span",{class:"tx",style:tipo==="raiz" ? "max-width:560px" : null}, n.t || " "));
  const ics = [];
  if(n.nota){ const b = h("button",{type:"button",title:n.nota.slice(0,300)}, mmIc("nota")); b.onclick = (ev)=>{ ev.stopPropagation(); mmSelecionar(n.id); MM.painel="nota"; MM.mostrarFmt=true; mmFormato(); }; ics.push(b); }
  if(n.link){ const a = h("a",{href:n.link,target:"_blank",rel:"noopener",title:n.link}, mmIc("link")); a.onpointerdown = ev=>ev.stopPropagation(); ics.push(a); }
  if(ics.length) ln.appendChild(h("span",{class:"mm-ics"}, ics));
  el.appendChild(ln);
  const extra = [];
  if(n.dem){ const it = state.items.get(n.dem); const d = h("span",{class:"mm-dem",title:"Abrir imóvel"}, mmIc("dem"), it ? (it.nome||"Imóvel") : "Imóvel removido"); d.onpointerdown = ev=>ev.stopPropagation(); d.onclick = ev=>{ ev.stopPropagation(); if(it) openPeek(n.dem); }; extra.push(d); }
  if(n.tags && n.tags.length) extra.push(h("div",{class:"mm-tags"}, n.tags.map(t=>h("span",{}, t))));
  extra.forEach(x=>el.appendChild(x));
  return el;
}
function mmDesenhar(){
  if(!MM.el) return;
  const m = mmAtual();
  MM.camNos.innerHTML = ""; MM.nos = new Map(); MM.est = new Map();
  [...MM.tela.querySelectorAll(".mm-vazio,.mm-out,.mm-busca-dummy")].forEach(x=>x.remove());
  MM.svgEl.innerHTML = "";
  if(!m){ if(MM.home) { mmVisao(); return; }
    MM.tela.style.background = "#fff";
    const v = h("div",{class:"mm-vazio"}, h("div",{style:"font-size:17px;font-weight:600;color:var(--mm-text)"},"Mapa mental"),
      h("div",{style:"max-width:420px"}, MM.carregado || !G.db() ? "Organize ideias, campanhas e pautas em mapas. Escolha um modelo para começar." : "Carregando mapas…"));
    const g = h("div",{class:"mm-modelos"});
    MM_MODELOS.forEach(md=>{ const b = h("button",{type:"button"}); b.innerHTML = mmMiniatura(md.id); b.appendChild(h("b",{}, md.nome)); b.appendChild(h("span",{}, md.desc)); b.onclick = ()=>mmCriar(md.id==="branco" ? "Meu novo mapa mental" : md.nome, md.gerar()); g.appendChild(b); });
    v.appendChild(g); MM.tela.appendChild(v); mmStatus(); return;
  }
  const T = MM_TEMAS[m.tema] || MM_TEMAS.esdras;
  MM.tela.style.background = m.fundo || (m.tema === "escuro" ? T.fundo : "#ffffff");
  if(MM.outline){ mmOutline(m); mmStatus(); return; }
  const add = (n, tipo, cor)=>{ const el = mmNoEl(m, n, tipo, cor); MM.nos.set(n.id, el); MM.camNos.appendChild(el); };
  add(m.raiz, "raiz", mmCorRamo(m,0));
  const vai = (n, cor)=>{ if(n.col) return; n.filhos.forEach(c=>{ add(c, "sub", cor); vai(c, cor); }); };
  if(!m.raiz.col) m.raiz.filhos.forEach((c,i)=>{ const cor = (c.est&&c.est.ramo) || mmCorRamo(m,i); add(c, "princ", cor); vai(c, cor); });
  m.flut.forEach((f,i)=>{ const cor = mmCorRamo(m, i+3); add(f, "flut", cor); vai(f, cor); });
  (m.res||[]).forEach(s=>{ if(s.no) add(s.no, "res", mmCorRamo(m,1)); });
  mmPosicionar();
  if(MM.busca) mmMarcarBusca();
  mmStatus();
}
function mmPosicionar(){
  const m = mmAtual(); if(!m || MM.outline) return;
  const med = new Map();
  MM.nos.forEach((el,id)=>med.set(id, {w:el.offsetWidth, h:el.offsetHeight}));
  MM.B = mmLayout(m, med);
  MM.nos.forEach((el,id)=>{ const b = MM.B.get(id); if(!b){ el.style.display = "none"; return; } el.style.display = ""; el.style.transform = "translate("+b.x.toFixed(1)+"px,"+b.y.toFixed(1)+"px)"; });
  mmAplicarCam();
  mmDesenharLinhas();
}
function mmLayout(m, med){
  const esp = m.espaco || 1, L = m.layout || "mapa";
  const HG = 44*esp, HG1 = 64*esp, VG = 12*esp, VGP = 22*esp, VG2 = 44*esp, HG2 = 22*esp, IND = 26*esp, LG = 9*esp;
  const B = new Map();
  const tam = n => med.get(n.id) || {w:60,h:24};
  const vis = n => n.col ? [] : n.filhos;
  const hS = new Map();
  const hSub = (n, g)=>{ const s = tam(n), f = vis(n); let t = 0; f.forEach((c,i)=>{ t += hSub(c, VG) + (i ? VG : 0); }); const v = Math.max(s.h, t); hS.set(n.id, v); return v; };
  const hPos = (n, ax, top, dir, nivel, filhoGap)=>{
    const s = tam(n), sh = hS.get(n.id);
    const y = top + sh/2 - s.h/2, x = dir > 0 ? ax : ax - s.w;
    B.set(n.id, {x, y, w:s.w, h:s.h, dir, nivel, modo:"h"});
    const f = vis(n); let tot = 0; f.forEach((c,i)=>tot += hS.get(c.id) + (i ? VG : 0));
    let ct = top + (sh - tot)/2; const nx = dir > 0 ? x + s.w + HG : x - HG;
    f.forEach(c=>{ hPos(c, nx, ct, dir, nivel+1); ct += hS.get(c.id) + VG; });
  };
  const vS = new Map();
  const vSub = n=>{ const s = tam(n), f = vis(n); let t = 0; f.forEach((c,i)=>t += vSub(c) + (i ? HG2 : 0)); const v = Math.max(s.w, t); vS.set(n.id, v); return v; };
  const vPos = (n, left, y, dy, nivel)=>{
    const s = tam(n), sw = vS.get(n.id);
    const x = left + sw/2 - s.w/2, yy = dy > 0 ? y : y - s.h;
    B.set(n.id, {x, y:yy, w:s.w, h:s.h, dirV:dy, nivel, modo:"v"});
    const f = vis(n); let tot = 0; f.forEach((c,i)=>tot += vS.get(c.id) + (i ? HG2 : 0));
    let cl = left + (sw - tot)/2; const ny = dy > 0 ? yy + s.h + VG2 : yy - VG2;
    f.forEach(c=>{ vPos(c, cl, ny, dy, nivel+1); cl += vS.get(c.id) + HG2; });
  };
  const lS = new Map(), lW = new Map();
  const lSub = n=>{ const s = tam(n); let hh = s.h, w = s.w; vis(n).forEach(c=>{ hh += LG + lSub(c); w = Math.max(w, IND + lW.get(c.id)); }); lS.set(n.id, hh); lW.set(n.id, w); return hh; };
  const lPos = (n, x, y, nivel)=>{ const s = tam(n); B.set(n.id, {x, y, w:s.w, h:s.h, nivel, modo:"l"}); let cy = y + s.h + LG; vis(n).forEach(c=>{ lPos(c, x + IND, cy, nivel+1); cy += lS.get(c.id) + LG; }); };

  const r = m.raiz, rs = tam(r);
  const filhos = vis(r);
  if(L === "mapa" || L === "direita" || L === "esquerda"){
    B.set(r.id, {x:-rs.w/2, y:-rs.h/2, w:rs.w, h:rs.h, nivel:0, modo:"h", dir:0});
    filhos.forEach(c=>hSub(c));
    let dir = [], esq = [];
    if(L === "direita") dir = filhos.slice();
    else if(L === "esquerda") esq = filhos.slice();
    else{
      const total = filhos.reduce((a,c)=>a + hS.get(c.id) + VGP, 0);
      let acc = 0;
      filhos.forEach(c=>{
        if(c.lado === "e") esq.push(c); else if(c.lado === "d") dir.push(c);
        else if(acc < total/2 || filhos.length < 2){ dir.push(c); acc += hS.get(c.id) + VGP; }
        else esq.push(c);
      });
      esq.reverse();
    }
    const col = (lista, d)=>{
      let tot = 0; lista.forEach((c,i)=>tot += hS.get(c.id) + (i ? VGP : 0));
      let top = -tot/2;
      const ax = d > 0 ? rs.w/2 + HG1 : -rs.w/2 - HG1;
      lista.forEach(c=>{ hPos(c, ax, top, d, 1); top += hS.get(c.id) + VGP; });
    };
    col(dir, 1); col(esq, -1);
  }else if(L === "organograma" || L === "cima"){
    const dy = L === "cima" ? -1 : 1;
    const sw = vSub(r);
    vPos(r, -sw/2, dy > 0 ? -rs.h/2 : rs.h/2, dy, 0);
  }else if(L === "arvore"){
    B.set(r.id, {x:-rs.w/2, y:-rs.h/2, w:rs.w, h:rs.h, nivel:0, modo:"t"});
    filhos.forEach(c=>lSub(c));
    const tot = filhos.reduce((a,c,i)=>a + lW.get(c.id) + (i ? HG2*1.6 : 0), 0);
    let x = -tot/2; const y = rs.h/2 + VG2;
    filhos.forEach(c=>{ lPos(c, x, y, 1); B.get(c.id).modo = "t1"; x += lW.get(c.id) + HG2*1.6; });
  }else if(L === "linha"){
    B.set(r.id, {x:-rs.w, y:-rs.h/2, w:rs.w, h:rs.h, nivel:0, modo:"tl"});
    filhos.forEach(c=>lSub(c));
    let x = HG1;
    filhos.forEach(c=>{ const s = tam(c); lPos(c, x, -s.h/2, 1); B.get(c.id).modo = "tl1"; x += Math.max(lW.get(c.id), s.w) + HG1*0.8; });
  }
  // tópicos flutuantes
  m.flut.forEach(f=>{
    hSub(f); const s = tam(f);
    hPos(f, f.x||0, (f.y||0) + s.h/2 - hS.get(f.id)/2, 1, 0);
    B.get(f.id).flut = true;
  });
  // resumos
  (m.res||[]).forEach(s=>{
    const bs = s.ids.map(id=>mmCaixaSub(B, m, id)).filter(Boolean);
    if(!bs.length || !s.no || !med.get(s.no.id)) return;
    const b0 = B.get(s.ids[0]); const d = b0 && b0.dir < 0 ? -1 : 1;
    const minY = Math.min(...bs.map(b=>b.y)), maxY = Math.max(...bs.map(b=>b.y+b.h));
    const bx = d > 0 ? Math.max(...bs.map(b=>b.x+b.w)) + 10 : Math.min(...bs.map(b=>b.x)) - 10;
    const t = tam(s.no);
    const x = d > 0 ? bx + 26 : bx - 26 - t.w;
    B.set(s.no.id, {x, y:(minY+maxY)/2 - t.h/2, w:t.w, h:t.h, nivel:9, modo:"res", chave:{x:bx, y1:minY, y2:maxY, d}});
  });
  return B;
}
function mmCaixaSub(B, m, id){
  const r = mmAchar(m, id); if(!r) return null;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  const vai = n=>{ const b = B.get(n.id); if(!b) return; x1 = Math.min(x1,b.x); y1 = Math.min(y1,b.y); x2 = Math.max(x2,b.x+b.w); y2 = Math.max(y2,b.y+b.h); if(!n.col) n.filhos.forEach(vai); };
  vai(r.n);
  if(x1 === Infinity) return null;
  return {x:x1, y:y1, w:x2-x1, h:y2-y1};
}
function mmLimites(){
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  MM.B.forEach(b=>{ x1 = Math.min(x1,b.x); y1 = Math.min(y1,b.y); x2 = Math.max(x2,b.x+b.w); y2 = Math.max(y2,b.y+b.h); });
  if(x1 === Infinity) return {x:-100,y:-50,w:200,h:100};
  return {x:x1, y:y1, w:x2-x1, h:y2-y1};
}

/* ---------- linhas (ramos, relações, resumos, limites) ---------- */
function mmSvgEl(tag, at){ const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for(const k in at) if(at[k]!=null) e.setAttribute(k, at[k]); return e; }
function mmY(b, est, papel){ return est && est.forma === "sublinhado" && papel !== "raiz" ? b.y + b.h - 1 : b.y + b.h/2; }
function mmCaminhoRamo(m, p, c, ep, ec, ehRaiz){
  const R = m.ramo || "afunilado";
  if(c.modo === "h" || (p.modo === "h" && c.modo === "h")){
    const d = c.dir || 1;
    let sx = d > 0 ? p.x + p.w : p.x, sy = mmY(p, ep, ehRaiz ? "raiz" : "");
    if(ehRaiz){ if(ep && !ep.fill){ sx = d > 0 ? p.x + p.w + 6 : p.x - 6; } else sx = p.x + p.w/2 + d*Math.min(p.w/2-6, 10); sy = p.y + p.h/2; }
    if(ep && ep.forma === "sublinhado" && !ehRaiz) sx = d > 0 ? p.x + p.w : p.x;
    const ex = d > 0 ? c.x : c.x + c.w, ey = mmY(c, ec);
    const mx = (sx+ex)/2;
    if(R === "reta") return {d:"M"+sx+" "+sy+"L"+ex+" "+ey};
    if(R === "cotovelo"){ const k = sx + d*Math.min(18, Math.abs(ex-sx)/2); const rr = Math.min(6, Math.abs(ey-sy)/2); const sg = ey > sy ? 1 : -1;
      return {d: Math.abs(ey-sy) < 1 ? "M"+sx+" "+sy+"L"+ex+" "+ey : "M"+sx+" "+sy+"H"+(k-d*rr)+"Q"+k+" "+sy+" "+k+" "+(sy+sg*rr)+"V"+(ey-sg*rr)+"Q"+k+" "+ey+" "+(k+d*rr)+" "+ey+"H"+ex}; }
    if(R === "afunilado" && ehRaiz && ep && ep.fill){ const w0 = 5, w1 = 1;
      return {fill:true, d:"M"+sx+" "+(sy-w0)+"C"+mx+" "+(sy-w0)+" "+mx+" "+(ey-w1)+" "+ex+" "+(ey-w1)+"L"+ex+" "+(ey+w1)+"C"+mx+" "+(ey+w1)+" "+mx+" "+(sy+w0)+" "+sx+" "+(sy+w0)+"Z"}; }
    return {d:"M"+sx+" "+sy+"C"+(sx + d*Math.abs(ex-sx)*.5)+" "+sy+" "+(ex - d*Math.abs(ex-sx)*.5)+" "+ey+" "+ex+" "+ey};
  }
  if(c.modo === "v"){
    const dy = c.dirV || 1;
    const sx = p.x + p.w/2, sy = dy > 0 ? p.y + p.h : p.y, ex = c.x + c.w/2, ey = dy > 0 ? c.y : c.y + c.h, my = (sy+ey)/2;
    if(R === "reta") return {d:"M"+sx+" "+sy+"L"+ex+" "+ey};
    if(R === "curva" || (R === "afunilado" && !ehRaiz)) return {d:"M"+sx+" "+sy+"C"+sx+" "+my+" "+ex+" "+my+" "+ex+" "+ey};
    if(R === "afunilado"){ const w0 = 4.5, w1 = 1; return {fill:true, d:"M"+(sx-w0)+" "+sy+"C"+(sx-w0)+" "+my+" "+(ex-w1)+" "+my+" "+(ex-w1)+" "+ey+"L"+(ex+w1)+" "+ey+"C"+(ex+w1)+" "+my+" "+(sx+w0)+" "+my+" "+(sx+w0)+" "+sy+"Z"}; }
    return {d:"M"+sx+" "+sy+"V"+my+"H"+ex+"V"+ey};
  }
  if(c.modo === "t1"){
    const sx = p.x + p.w/2, sy = p.y + p.h, ex = c.x + Math.min(c.w/2, 40), ey = c.y, my = sy + (ey-sy)/2;
    if(R === "curva" || R === "afunilado") return {d:"M"+sx+" "+sy+"C"+sx+" "+my+" "+ex+" "+my+" "+ex+" "+ey};
    if(R === "reta") return {d:"M"+sx+" "+sy+"L"+ex+" "+ey};
    return {d:"M"+sx+" "+sy+"V"+my+"H"+ex+"V"+ey};
  }
  if(c.modo === "tl1") return null;
  // lista recuada
  const sx = p.x + Math.min(13, p.w/2), sy = p.y + p.h, ex = c.x, ey = mmY(c, ec);
  if(R === "reta") return {d:"M"+sx+" "+sy+"L"+ex+" "+ey};
  if(R === "cotovelo") return {d:"M"+sx+" "+sy+"V"+ey+"H"+ex};
  const rr = Math.min(8, ey - sy, ex - sx);
  return {d:"M"+sx+" "+sy+"V"+(ey-rr)+"Q"+sx+" "+ey+" "+(sx+rr)+" "+ey+"H"+ex};
}
function mmDesenharLinhas(){
  const m = mmAtual(); const S = MM.svgEl; if(!m || !S) return;
  S.innerHTML = "";
  const defs = mmSvgEl("defs",{});
  S.appendChild(defs);
  const seta = cor=>{ const id = "mm-s"+String(cor).replace(/[^a-z0-9]/gi,""); if(!defs.querySelector("#"+id)) defs.insertAdjacentHTML("beforeend", '<marker id="'+id+'" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="'+cor+'"/></marker>'); return "url(#"+id+")"; };
  const B = MM.B;
  // limites (atrás de tudo)
  (m.lim||[]).forEach(l=>{
    const bb = mmCaixaSub(B, m, l.alvo); if(!bb) return;
    const on = MM.selLim === l.id;
    const r = mmSvgEl("rect",{x:bb.x-10, y:bb.y-10, width:bb.w+20, height:bb.h+20, rx:12, fill:(l.cor||"#BFA472")+"14", stroke:on?"#2383e2":(l.cor||"#BFA472"), "stroke-width":on?2:1.4, "stroke-dasharray":"6 4", class:"rel-hit", "data-lim":l.id});
    r.style.pointerEvents = "stroke";
    S.appendChild(r);
  });
  // ramos
  const dims = MM.apres && MM.apres.foco ? MM.apres.foco : null;
  const corLinha = m.corLinha || "#AD1815";
  const liga = (p, c, cor0, ehRaiz)=>{ const cor = corLinha;
    const bp = B.get(p.id), bc = B.get(c.id); if(!bp || !bc) return;
    const cm = mmCaminhoRamo(m, bp, bc, MM.est.get(p.id), MM.est.get(c.id), ehRaiz); if(!cm) return;
    const op = dims && !dims.has(c.id) ? .12 : 1;
    S.appendChild(mmSvgEl("path", cm.fill ? {d:cm.d, fill:cor, stroke:"none", opacity:op} : {d:cm.d, fill:"none", stroke:cor, "stroke-width":ehRaiz ? ((MM_TEMAS[m.tema]||{}).lw||[2.6])[0] : (MM.est.get(p.id)||{}).tipo==="princ" ? ((MM_TEMAS[m.tema]||{}).lw||[0,1.9])[1] : ((MM_TEMAS[m.tema]||{}).lw ? 2 : 1.5), "stroke-linecap":"round", opacity:op}));
  };
  const vai = (n, cor, raizDe)=>{ if(n.col) return; n.filhos.forEach((c,i)=>{ const k = raizDe ? ((c.est&&c.est.ramo) || mmCorRamo(m, i)) : cor; liga(n, c, k, raizDe); vai(c, k, false); }); };
  vai(m.raiz, null, true);
  m.flut.forEach((f,i)=>vai(f, mmCorRamo(m, i+3), false));
  // espinha da linha do tempo
  if(m.layout === "linha" && !m.raiz.col && m.raiz.filhos.length){
    const br = B.get(m.raiz.id); const ult = B.get(m.raiz.filhos[m.raiz.filhos.length-1].id);
    if(br && ult){
      const cor = mmCorRamo(m,0);
      S.insertBefore(mmSvgEl("path",{d:"M"+(br.x+br.w)+" 0H"+(ult.x+ult.w+30), stroke:cor, "stroke-width":3, fill:"none", "marker-end":seta(cor)}), S.children[1]);
    }
  }
  // resumos (chave)
  (m.res||[]).forEach(s=>{
    const b = s.no && B.get(s.no.id); if(!b || !b.chave) return;
    const {x, y1, y2, d} = b.chave, my = (y1+y2)/2, k = 9*d;
    S.appendChild(mmSvgEl("path",{d:"M"+x+" "+y1+"Q"+(x+k)+" "+y1+" "+(x+k)+" "+(y1+10)+"V"+(my-8)+"Q"+(x+k)+" "+my+" "+(x+k*2)+" "+my+"Q"+(x+k)+" "+my+" "+(x+k)+" "+(my+8)+"V"+(y2-10)+"Q"+(x+k)+" "+y2+" "+x+" "+y2,
      fill:"none", stroke:mmCorRamo(m,1), "stroke-width":1.6}));
    S.appendChild(mmSvgEl("path",{d:"M"+(x+k*2)+" "+my+"L"+(d>0?b.x:b.x+b.w)+" "+(b.y+b.h/2), stroke:mmCorRamo(m,1), "stroke-width":1.4, fill:"none"}));
  });
  // relações
  (m.rel||[]).forEach(r=>{
    const a = B.get(r.de), b = B.get(r.para); if(!a || !b) return;
    const ca = {x:a.x+a.w/2, y:a.y+a.h/2}, cb = {x:b.x+b.w/2, y:b.y+b.h/2};
    const c1 = {x:ca.x+(r.c1?r.c1[0]:0), y:ca.y+(r.c1?r.c1[1]:-60)}, c2 = {x:cb.x+(r.c2?r.c2[0]:0), y:cb.y+(r.c2?r.c2[1]:-60)};
    const s = mmBorda(a, c1), e = mmBorda(b, c2);
    const on = MM.selRel === r.id, cor = on ? "#2383e2" : (r.cor || "#8C7A4E");
    const dd = "M"+s.x+" "+s.y+"C"+c1.x+" "+c1.y+" "+c2.x+" "+c2.y+" "+e.x+" "+e.y;
    S.appendChild(mmSvgEl("path",{d:dd, fill:"none", stroke:cor, "stroke-width":on?2:1.6, "stroke-dasharray":"6 4", "marker-end":seta(cor)}));
    S.appendChild(mmSvgEl("path",{d:dd, fill:"none", stroke:"transparent", "stroke-width":12, class:"rel-hit", "data-rel":r.id}));
    const t = .5, mt = 1-t;
    const lx = mt*mt*mt*s.x + 3*mt*mt*t*c1.x + 3*mt*t*t*c2.x + t*t*t*e.x, ly = mt*mt*mt*s.y + 3*mt*mt*t*c1.y + 3*mt*t*t*c2.y + t*t*t*e.y;
    if(r.t || on){
      const tx = mmSvgEl("text",{x:lx, y:ly-6, "text-anchor":"middle", "font-size":12, fill:r.t?"#4a4436":"#9aa", "font-family":"-apple-system,Segoe UI,Arial,sans-serif", class:"rel-tx", "data-rel":r.id, "data-reltx":"1", "paint-order":"stroke", stroke:"#fff", "stroke-width":4});
      tx.textContent = r.t || "Duplo clique para escrever";
      S.appendChild(tx);
    }
    if(on){
      [[s,c1,"c1",r.de],[e,c2,"c2",r.para]].forEach(([p,c,k])=>{
        S.appendChild(mmSvgEl("line",{x1:p.x,y1:p.y,x2:c.x,y2:c.y,stroke:"#2383e2","stroke-width":1,"stroke-dasharray":"3 3"}));
        S.appendChild(mmSvgEl("circle",{cx:c.x,cy:c.y,r:6,fill:"#fff",stroke:"#2383e2","stroke-width":1.6,class:"rel-h","data-rel":r.id,"data-h":k}));
      });
    }
  });
  // botões de recolher
  [...MM.camNos.querySelectorAll(".mm-tg")].forEach(x=>x.remove());
  if(!MM.apres){
    const tg = (n)=>{
      const b = B.get(n.id); if(!b || !n.filhos.length) return;
      if(n.id === m.raiz.id && (m.layout==="mapa")) return;
      const fech = !!n.col;
      let x, y;
      if(b.modo === "h"){ const d = b.dir || (m.layout==="esquerda" ? -1 : 1); x = fech ? (d > 0 ? b.x + b.w + 4 : b.x - 30) : (d > 0 ? b.x + b.w + 6 : b.x - 20); y = mmY(b, MM.est.get(n.id)) - 7.5; }
      else if(b.modo === "v"){ x = b.x + b.w/2 - 7.5; y = (b.dirV||1) > 0 ? b.y + b.h + 2 : b.y - 17; }
      else { x = b.x + Math.min(13, b.w/2) - 7.5; y = b.y + b.h + 1; }
      const el = h("button",{class:"mm-tg"+(fech?" fech":""),type:"button","data-dica":fech?"Expandir":"Recolher","aria-label":fech?"Expandir":"Recolher"}, fech ? String(mmContarSub(n)) : "");
      el.style.setProperty("--cl", m.corLinha || "#AD1815"); el.dataset.no = n.id; if(MM.sel.has(n.id)) el.classList.add("vis");
      el.style.transform = "translate("+x+"px,"+y+"px)";
      el.onpointerdown = e=>e.stopPropagation();
      el.onclick = e=>{ e.stopPropagation(); mmAlternar(n.id); };
      MM.camNos.appendChild(el);
    };
    const vai2 = n=>{ tg(n); if(!n.col) n.filhos.forEach(vai2); };
    vai2(m.raiz); m.flut.forEach(vai2);
  }
}
function mmContarSub(n){ let k = 0; const c = x=>{ x.filhos.forEach(y=>{ k++; c(y); }); }; c(n); return k; }
function mmBorda(b, alvo){
  const cx = b.x+b.w/2, cy = b.y+b.h/2, dx = alvo.x-cx, dy = alvo.y-cy;
  if(!dx && !dy) return {x:cx, y:b.y};
  const sx = (b.w/2+3)/Math.abs(dx||1e-9), sy = (b.h/2+3)/Math.abs(dy||1e-9), s = Math.min(sx, sy);
  return {x:cx+dx*s, y:cy+dy*s};
}

/* ---------- câmera ---------- */
function mmAplicarCam(){ if(MM.mundo) MM.mundo.style.transform = "translate("+MM.px+"px,"+MM.py+"px) scale("+MM.zoom+")"; mmStatusZoom(); mmCtx(); }
function mmTelaParaMundo(cx, cy){ const r = MM.tela.getBoundingClientRect(); return {x:(cx - r.left - MM.px)/MM.zoom, y:(cy - r.top - MM.py)/MM.zoom}; }
function mmZoomEm(z, cx, cy){
  z = Math.max(.15, Math.min(3, z));
  const r = MM.tela.getBoundingClientRect();
  if(cx == null){ cx = r.left + r.width/2; cy = r.top + r.height/2; }
  const p = mmTelaParaMundo(cx, cy);
  MM.zoom = z; MM.px = cx - r.left - p.x*z; MM.py = cy - r.top - p.y*z; mmAplicarCam();
}
function mmAjustar(caixa, anim){
  if(!MM.tela || !MM.tela.clientWidth) { MM.ajustarPend = true; return; }
  const b = caixa || mmLimites();
  const esq = 0;
  const W = MM.tela.clientWidth - esq, H = MM.tela.clientHeight - 110;
  const z = Math.max(.15, Math.min(caixa ? 1.6 : 1, (W-80)/Math.max(b.w,1), (H-80)/Math.max(b.h,1)));
  MM.zoom = z; MM.px = esq + W/2 - (b.x + b.w/2)*z; MM.py = 110 + H/2 - (b.y + b.h/2)*z;
  if(anim){ MM.mundo.classList.add("anim"); setTimeout(()=>MM.mundo.classList.remove("anim"), 480); }
  mmAplicarCam();
}
function mmMostrar(id){
  const b = MM.B.get(id); if(!b) return;
  const W = MM.tela.clientWidth, H = MM.tela.clientHeight;
  const x1 = b.x*MM.zoom + MM.px, y1 = b.y*MM.zoom + MM.py, x2 = x1 + b.w*MM.zoom, y2 = y1 + b.h*MM.zoom;
  if(x1 < 30) MM.px += 30 - x1; else if(x2 > W-30) MM.px -= x2 - (W-30);
  if(y1 < 30) MM.py += 30 - y1; else if(y2 > H-30) MM.py -= y2 - (H-30);
  mmAplicarCam();
}
function mmTelaCheia(ligar){
  if(ligar === undefined) ligar = !MM.cheia;
  MM.cheia = !!ligar; MM.bloco.classList.toggle("cheia", MM.cheia);
  document.documentElement.classList.toggle("mm-sem-rolagem", MM.cheia);
  if(MM.cheia){
    try{ const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); if(p && p.then) p.then(()=>{ MM.cheiaReal = true; }, ()=>{ MM.cheiaReal = false; }); }catch(e){ MM.cheiaReal = false; }
  }else{
    if(document.fullscreenElement){ try{ const p = document.exitFullscreen(); if(p && p.catch) p.catch(()=>{}); }catch(e){} }
    MM.cheiaReal = false;
  }
  mmRibbon(); requestAnimationFrame(()=>{ mmAjustar(); setTimeout(()=>mmAjustar(), 250); });
  MM.tela.focus({preventScroll:true});
}

/* ---------- barra de status ---------- */
function mmStatus(msg){
  if(msg !== undefined){
    MM.msg = msg; clearTimeout(MM.msgT);
    // avisos somem sozinhos (exceto o do modo "conectar", que fica até concluir ou Esc)
    if(msg && !MM.modoRel) MM.msgT = setTimeout(()=>{ if(MM.msg === msg) mmStatus(null); }, 5000);
  }
  if(MM.nuvem){ MM.nuvem.innerHTML = ""; MM.nuvem.appendChild(mmIc(MM.sujo ? "nuvemSync" : "nuvemOk", 1.5)); MM.nuvem.title = MM.sujo ? "Salvando…" : "Tudo salvo"; MM.nuvem.classList.toggle("sync", !!MM.sujo); }
  if(MM.toast){ MM.toast.textContent = MM.msg || ""; MM.toast.hidden = !MM.msg; }
}
function mmStatusZoom(){ if(MM.zoomTx) MM.zoomTx.textContent = Math.round(MM.zoom*100)+"%"; }

/* ---------- painel de formatação ---------- */
function mmFormato(alvo, painelF){
  if(!alvo && MM.pop && MM.pop.corpo){ const ae = document.activeElement; if(!(ae && MM.pop.corpo.contains(ae) && (ae.tagName==="TEXTAREA"||ae.tagName==="INPUT"))){ mmFormato(MM.pop.corpo, MM.pop.painel); mmPosPop(); } }
  const F = alvo || MM.fmt; if(!F) return;
  F.innerHTML = ""; if(!alvo) F.hidden = !MM.mostrarFmt;
  if(!alvo && !MM.mostrarFmt) return;
  const m = mmAtual();
  const painel = painelF || MM.painel;
  const tabs = h("div",{class:"mm-fmt-tabs"});
  [["pagina","Página"],["topico","Tópico"],["marcas","Marcas"],["nota","Nota"]].forEach(([id,n])=>{
    const b = h("button",{type:"button","aria-selected":String(MM.painel===id)}, n); b.onclick = ()=>{ MM.painel = id; mmFormato(); }; tabs.appendChild(b);
  });
  const fechar = h("button",{type:"button",title:"Fechar painel",style:"flex:none;padding:8px"}, "×"); fechar.onclick = ()=>{ MM.mostrarFmt = false; mmFormato(); mmRibbon(); };
  tabs.appendChild(fechar);
  if(!alvo) F.appendChild(tabs);
  const body = alvo ? F : h("div",{class:"mm-fmt-body"}); if(!alvo) F.appendChild(body);
  if(!m){ body.appendChild(h("p",{class:"dica"},"Abra ou crie um mapa.")); return; }
  const sec = (t, ...k)=>h("div",{class:"mm-sec"}, h("h4",{}, t), ...k);
  const sels = [...MM.sel].map(id=>mmAchar(m,id)).filter(Boolean);
  if(painel === "pagina"){
    const gl = h("div",{class:"mm-gal"});
    MM_LAYOUTS.forEach(l=>{ const b = h("button",{type:"button",class:m.layout===l.id?"on":""}); b.innerHTML = '<svg viewBox="0 0 54 34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+l.ic+'</svg>'; b.appendChild(document.createTextNode(l.nome)); b.onclick = ()=>mmPagina({layout:l.id}); gl.appendChild(b); });
    body.appendChild(sec("Layout", gl));
    const tm = h("div",{class:"mm-temas"});
    Object.entries(MM_TEMAS).forEach(([k,t])=>{ const cs = h("div",{class:"cs"}, h("i",{style:"background:"+t.raiz.fill}), ...t.ramos.slice(0,4).map(c=>h("i",{style:"background:"+c})), h("i",{style:"background:"+t.fundo}));
      tm.appendChild(h("button",{type:"button",class:m.tema===k?"on":"",onclick:()=>mmPagina({tema:k})}, cs, t.nome)); });
    body.appendChild(sec("Tema", tm));
    const rm = h("div",{class:"mm-seg"}); MM_RAMOS.forEach(r=>rm.appendChild(h("button",{type:"button",class:m.ramo===r.id?"on":"",onclick:()=>mmPagina({ramo:r.id})}, r.nome)));
    body.appendChild(sec("Estilo dos ramos", rm));
    const es = h("div",{class:"mm-seg"}); [[.75,"Compacto"],[1,"Normal"],[1.4,"Espaçoso"]].forEach(([v,n])=>es.appendChild(h("button",{type:"button",class:(m.espaco||1)===v?"on":"",onclick:()=>mmPagina({espaco:v})}, n)));
    body.appendChild(sec("Espaçamento", es));
    body.appendChild(sec("Cor das linhas", mmPaleta(m.corLinha || "#AD1815", v=>mmPagina({corLinha:v||"#AD1815"}), false, ["#AD1815","#14130F","#BFA472","#26331F","#4F6BED","#8a8a8a"])));
    body.appendChild(sec("Cor de fundo", mmPaleta(m.fundo, v=>mmPagina({fundo:v}), true, ["#ffffff","#F7F4EC","#F2EDE3","#F4FAF8","#F5F7FB","#1E1F24","#14130F"])));
    body.appendChild(sec("Atalhos", h("p",{class:"dica",style:"line-height:1.7"},"Tab: subtópico · Enter: tópico irmão · Shift+Enter: irmão acima · Ctrl+Enter: tópico pai · F2 ou duplo clique: editar · Delete: excluir · Espaço: recolher · Setas: navegar · Alt+↑/↓: mover · Ctrl+Z/Y: desfazer/refazer · Ctrl+C/X/V: copiar/recortar/colar · Ctrl+F: localizar · Ctrl+roda: zoom · Arraste o fundo para mover a tela · Shift+arraste: selecionar vários · Arraste um tópico sobre outro para mudar de lugar")));
    return;
  }
  if(!sels.length){ body.appendChild(h("p",{class:"dica"}, MM.selRel ? "Relação selecionada. Arraste as alças azuis para curvar; duplo clique no texto para escrever; Delete exclui." : "Selecione um ou mais tópicos."));
    if(MM.selRel){ const r = m.rel.find(x=>x.id===MM.selRel); if(r){ body.appendChild(sec("Texto da relação", (()=>{ const i = h("input",{type:"text",value:r.t||""}); i.onchange = ()=>{ mmAntes(); r.t = i.value; mmMudou(); }; return i; })())); body.appendChild(sec("Cor", mmPaleta(r.cor||null, v=>{ mmAntes(); r.cor = v; mmMudou(); }, true))); } }
    return; }
  const ns = sels.map(r=>r.n), um = ns[ns.length-1];
  const aplicar = (fn)=>{ mmAntes(); ns.forEach(fn); mmMudou(); };
  if(painel === "topico" || painel === "estilo" || painel === "texto"){
    const e0 = MM.est.get(um.id) || {};
    const quer = k => painel === "topico" || (painel === "texto") === (k === "texto");
    const body0 = body; const corpoTxt = h("div",{}), corpoEst = h("div",{});
    { const body = { appendChild:(x)=>{ (x && x.__txt ? corpoTxt : corpoEst).appendChild(x); } };
    const fm = h("div",{class:"mm-seg",style:"flex-wrap:wrap"}); MM_FORMAS.forEach(f=>fm.appendChild(h("button",{type:"button",class:e0.forma===f.id?"on":"",onclick:()=>aplicar(n=>{ n.est = Object.assign({}, n.est, {forma:f.id}); })}, f.nome)));
    body.appendChild(sec("Forma", fm));
    body.appendChild(sec("Preenchimento", mmPaleta(e0.fill, v=>aplicar(n=>{ n.est = Object.assign({}, n.est, {fill:v}); }), true)));
    body.appendChild(sec("Borda", mmPaleta(e0.borda, v=>aplicar(n=>{ n.est = Object.assign({}, n.est, {borda:v}); }), true)));
    { const x = sec("Cor do texto", mmPaleta(e0.cor, v=>aplicar(n=>{ n.est = Object.assign({}, n.est, {cor:v||undefined}); }), false)); x.__txt = true; body.appendChild(x); }
    const tam = h("select",{}); [11,12,13,13.5,14,15,16,18,20,22,24,28,32].forEach(v=>{ const o = h("option",{value:String(v)}, v+" px"); if(+e0.tam===v) o.selected = true; tam.appendChild(o); });
    tam.onchange = ()=>aplicar(n=>{ n.est = Object.assign({}, n.est, {tam:+tam.value}); });
    const bB = h("button",{type:"button",class:e0.b?"on":"",style:"font-weight:700"},"N"); bB.onclick = ()=>aplicar(n=>{ n.est = Object.assign({}, n.est, {b:!e0.b}); });
    const bI = h("button",{type:"button",class:e0.i?"on":"",style:"font-style:italic"},"I"); bI.onclick = ()=>aplicar(n=>{ n.est = Object.assign({}, n.est, {i:!e0.i}); });
    { const x = sec("Tamanho e estilo", h("div",{class:"mm-row"}, tam, h("div",{class:"mm-seg"}, bB, bI))); x.__txt = true; body.appendChild(x); }
    const ehPrinc = sels.every(r=>r.nivel===1 && !r.flut);
    if(ehPrinc) body.appendChild(sec("Cor do ramo", mmPaleta((um.est&&um.est.ramo)||null, v=>aplicar(n=>{ n.est = Object.assign({}, n.est, {ramo:v||undefined}); }), true)));
    if(ehPrinc && m.layout === "mapa"){ const ld = h("div",{class:"mm-seg"}); [["","Automático"],["d","Direita"],["e","Esquerda"]].forEach(([v,n])=>ld.appendChild(h("button",{type:"button",class:(um.lado||"")===v?"on":"",onclick:()=>aplicar(x=>{ if(v) x.lado = v; else delete x.lado; })}, n))); body.appendChild(sec("Lado", ld)); }
    const lim = m.lim.find(l=>l.alvo===um.id);
    if(lim) body.appendChild(sec("Cor do limite", mmPaleta(lim.cor, v=>{ mmAntes(); lim.cor = v||"#BFA472"; mmMudou(); }, false)));
    body.appendChild(h("button",{class:"btn ghost",type:"button",onclick:()=>aplicar(n=>{ delete n.est; })}, "Restaurar estilo do tema"));
    }
    if(quer("texto")) [...corpoTxt.childNodes].forEach(x=>body0.appendChild(x));
    if(quer("estilo")) [...corpoEst.childNodes].forEach(x=>body0.appendChild(x));
    return;
  }
  if(painel === "marcas"){
    const tem = c=>(um.mk||[]).includes(c);
    const marcar = (c, grupo)=>aplicar(n=>{ let l = (n.mk||[]).slice(); const ja = l.includes(c); if(grupo) l = l.filter(x=>!grupo.test(x)); else l = l.filter(x=>x!==c); if(!ja) l.push(c); if(l.length) n.mk = l; else delete n.mk; });
    const gal = (cods, grupo)=>{ const g = h("div",{class:"mm-mkgal"}); cods.forEach(c=>{ const b = h("button",{type:"button",class:tem(c)?"on":"",title:c}); const s = mmMarcaSVG(c); if(s) b.innerHTML = s; else b.appendChild(h("span",{class:"em"}, c.slice(2))); b.onclick = ()=>marcar(c, grupo); g.appendChild(b); }); return g; };
    body.appendChild(sec("Prioridade", gal([1,2,3,4,5,6,7,8,9].map(k=>"p"+k), /^p\d$/)));
    body.appendChild(sec("Progresso", gal([0,1,2,3,4,5,6,7,8].map(k=>"g"+k), /^g\d$/)));
    body.appendChild(sec("Bandeira", gal(Object.keys(MM_FLAG).map(k=>"f:"+k), /^f:/)));
    Object.entries(MM_EMOJI).forEach(([t,l])=>body.appendChild(sec(t, gal(l.map(e=>"e:"+e), null))));
    if(um.mk && um.mk.length) body.appendChild(h("button",{class:"btn ghost",type:"button",onclick:()=>aplicar(n=>{ delete n.mk; })}, "Remover todas as marcas"));
    return;
  }
  // nota, link, etiquetas, imóvel vinculado
  const ta = h("textarea",{placeholder:"Escreva uma nota para este tópico…"}, um.nota||"");
  ta.onfocus = ()=>{ ta._antes = um.nota||""; };
  ta.oninput = ()=>{ if(ta.value) um.nota = ta.value; else delete um.nota; mmGravar(m); };
  ta.onblur = ()=>{ if((ta._antes||"") !== (um.nota||"")){ MM.desfazer.push(JSON.stringify(m)); mmDesenhar(); } };
  body.appendChild(sec("Nota · "+(um.t||"").slice(0,40), ta));
  const li = h("input",{type:"url",placeholder:"https://…",value:um.link||""});
  li.onchange = ()=>{ mmAntes(); let u = li.value.trim(); if(u && !/^https?:\/\//i.test(u)) u = "https://"+u; if(u) um.link = u; else delete um.link; mmMudou(); };
  body.appendChild(sec("Link", li));
  const tg = h("input",{type:"text",placeholder:"Separe por vírgula",value:(um.tags||[]).join(", ")});
  tg.onchange = ()=>{ mmAntes(); const l = tg.value.split(",").map(x=>x.trim()).filter(Boolean); if(l.length) um.tags = l; else delete um.tags; mmMudou(); };
  body.appendChild(sec("Etiquetas", tg));
  const it = um.dem ? state.items.get(um.dem) : null;
  body.appendChild(sec("Imóvel vinculado", h("div",{class:"mm-row"},
    it ? h("button",{class:"btn ghost",type:"button",onclick:()=>openPeek(um.dem)}, mmIc("dem"), (it.nome||"Imóvel").slice(0,28)) : h("span",{class:"dica"}, um.dem ? "Imóvel removido" : "Nenhum"),
    h("button",{class:"btn ghost",type:"button",onclick:()=>mmVincularDemanda()}, um.dem ? "Trocar" : "Vincular"))));
}
function mmPaleta(atual, onPick, comNada, cores){
  const box = h("div",{class:"mm-cores"});
  if(comNada){ const n = h("button",{type:"button",class:"nada"+(atual===null||atual==="transparent"?" on":""),title:"Sem cor"}); n.onclick = ()=>onPick(null); box.appendChild(n); }
  (cores||MM_CORES).forEach(c=>{ const b = h("button",{type:"button",title:c,style:"background:"+c,class:String(atual||"").toLowerCase()===c.toLowerCase()?"on":""}); b.onclick = ()=>onPick(c); box.appendChild(b); });
  const ci = h("input",{type:"color",title:"Outra cor",value:/^#[0-9a-f]{6}$/i.test(atual||"") ? atual : "#bfa472"}); ci.onchange = ()=>onPick(ci.value);
  box.appendChild(ci);
  return box;
}

/* ---------- estrutura de tópicos (outline) ---------- */
function mmOutline(m, focar){
  const box = h("div",{class:"mm-out"});
  box.appendChild(h("p",{class:"dica"},"Estrutura de tópicos · Enter cria tópico · Tab aumenta o recuo · Shift+Tab diminui · Backspace num tópico vazio exclui"));
  const linhas = [];
  const vai = (n, nv, flut)=>{
    linhas.push(n.id);
    const bl = h("span",{class:"bl"+(n.col?" fech":""),title:n.filhos.length?(n.col?"Expandir":"Recolher"):""}, h("i"));
    if(n.filhos.length) bl.onclick = ()=>{ n.col = !n.col; mmGravar(m); mmDesenhar(); };
    const inp = h("input",{type:"text",value:n.t||"",dataset:{id:n.id}});
    inp.oninput = ()=>{ n.t = inp.value; mmGravar(m); };
    inp.onfocus = ()=>{ inp._antes = n.t; MM.sel = new Set([n.id]); };
    inp.onkeydown = (e)=>{
      e.stopPropagation();
      const r = mmAchar(m, n.id);
      if(e.key === "Enter"){ e.preventDefault(); mmAntes(); const novo = mmNovoTopico(); novo.t = "";
        if(!r.pai || (e.ctrlKey||e.metaKey)){ n.col = false; n.filhos.unshift(novo); } else r.lista.splice(r.idx+1, 0, novo);
        mmGravar(m); mmOutlineRe(novo.id); }
      else if(e.key === "Tab" && !e.shiftKey){ e.preventDefault(); if(!r.pai || r.idx === 0) return; mmAntes(); const ant = r.lista[r.idx-1]; r.lista.splice(r.idx,1); ant.col = false; ant.filhos.push(n); delete n.lado; mmGravar(m); mmOutlineRe(n.id); }
      else if(e.key === "Tab" && e.shiftKey){ e.preventDefault(); if(!r.pai) return; const rp = mmAchar(m, r.pai.id); if(!rp.pai) return; mmAntes(); r.lista.splice(r.idx,1); rp.lista.splice(rp.idx+1, 0, n); mmGravar(m); mmOutlineRe(n.id); }
      else if(e.key === "Backspace" && !inp.value && r.pai){ e.preventDefault(); mmAntes(); const i = linhas.indexOf(n.id); r.lista.splice(r.idx,1, ...n.filhos); mmLimparRefs(m, new Set([n.id])); mmGravar(m); mmOutlineRe(linhas[Math.max(0,i-1)]); }
      else if(e.key === "ArrowUp" || e.key === "ArrowDown"){ e.preventDefault(); const i = linhas.indexOf(n.id) + (e.key==="ArrowUp"?-1:1); const alvo = box.querySelector('input[data-id="'+linhas[i]+'"]'); if(alvo) alvo.focus(); }
    };
    box.appendChild(h("div",{class:"mm-out-l n"+Math.min(nv,2),style:"padding-left:"+(nv*24)+"px"}, bl, inp));
    if(!n.col) n.filhos.forEach(c=>vai(c, nv+1, flut));
  };
  vai(m.raiz, 0);
  if(m.flut.length){ box.appendChild(h("p",{class:"dica",style:"margin-top:18px"},"Tópicos flutuantes")); m.flut.forEach(f=>vai(f, 1, true)); }
  MM.tela.appendChild(box);
  if(focar){ const alvo = box.querySelector('input[data-id="'+focar+'"]'); if(alvo){ alvo.focus(); alvo.setSelectionRange(alvo.value.length, alvo.value.length); } }
}
function mmOutlineRe(id){ const m = mmAtual(); [...MM.tela.querySelectorAll(".mm-out")].forEach(x=>x.remove()); mmOutline(m, id); mmStatus(); }

/* ---------- localizar ---------- */
function mmAbrirBusca(){
  if(MM.outline){ MM.outline = false; mmDesenhar(); }
  MM.busca = MM.busca || {q:"", i:-1};
  [...MM.tela.querySelectorAll(".mm-busca")].forEach(x=>x.remove());
  const inp = h("input",{type:"text",placeholder:"Localizar tópico…",value:MM.busca.q});
  const cont = h("span",{style:"color:var(--mm-text-3);min-width:36px"});
  const ir = d=>{
    const m = mmAtual(); const q = inp.value.trim().toLowerCase(); MM.busca.q = inp.value;
    const todos = []; const vai = n=>{ if(q && ((n.t||"").toLowerCase().includes(q) || (n.nota||"").toLowerCase().includes(q))) todos.push(n.id); n.filhos.forEach(vai); };
    vai(m.raiz); m.flut.forEach(vai);
    MM.busca.lista = todos;
    if(!todos.length){ cont.textContent = q ? "0" : ""; mmMarcarBusca(); return; }
    MM.busca.i = (MM.busca.i + d + todos.length) % todos.length;
    const id = todos[MM.busca.i];
    let mudou = false; const abre = x=>{ const r = mmAchar(m, x); if(r && r.pai){ if(r.pai.col){ r.pai.col = false; mudou = true; } abre(r.pai.id); } }; abre(id);
    MM.sel = new Set([id]);
    if(mudou){ mmGravar(m); mmDesenhar(); } else mmPintarSel();
    mmMarcarBusca(); mmMostrar(id); mmFormato();
    cont.textContent = (MM.busca.i+1)+"/"+todos.length;
  };
  inp.oninput = ()=>{ MM.busca.i = -1; ir(1); };
  inp.onkeydown = e=>{ e.stopPropagation(); if(e.key==="Enter"){ e.preventDefault(); ir(e.shiftKey?-1:1); } if(e.key==="Escape"){ fecha(); } };
  const fecha = ()=>{ MM.busca = null; box.remove(); mmMarcarBusca(); MM.tela.focus(); };
  const box = h("div",{class:"mm-busca"}, mmIc("buscar"), inp, cont,
    h("button",{class:"tool",type:"button",title:"Anterior",onclick:()=>ir(-1)},"↑"), h("button",{class:"tool",type:"button",title:"Próximo",onclick:()=>ir(1)},"↓"), h("button",{class:"tool",type:"button",title:"Fechar",onclick:fecha},"×"));
  box.onpointerdown = e=>e.stopPropagation();
  MM.tela.appendChild(box); inp.focus(); inp.select();
}
function mmMarcarBusca(){ const l = new Set(MM.busca && MM.busca.lista || []); MM.nos.forEach((el,id)=>el.classList.toggle("achado", l.has(id) && !MM.sel.has(id))); }

/* ---------- apresentação ---------- */
function mmApresentar(){
  const m = mmAtual(); if(!m) return;
  if(MM.outline){ MM.outline = false; }
  m.raiz.col = false;
  const passos = [{id:null}].concat(m.raiz.filhos.map(c=>({id:c.id}))).concat([{id:null, fim:true}]);
  MM.apres = {i:0, passos, cheiaAntes:MM.cheia};
  if(!MM.cheia){ MM.cheia = true; MM.bloco.classList.add("cheia"); document.documentElement.classList.add("mm-sem-rolagem"); }
  MM.bloco.classList.add("apres");
  const bar = h("div",{class:"mm-apres-bar"});
  MM.apres.bar = bar; MM.tela.appendChild(bar);
  mmDesenhar(); requestAnimationFrame(()=>mmPasso(0));
  MM.tela.focus();
}
function mmPasso(d){
  const A = MM.apres; if(!A) return;
  A.i = Math.max(0, Math.min(A.passos.length-1, A.i + d));
  const m = mmAtual(); const p = A.passos[A.i];
  if(p.id){ const r = mmAchar(m, p.id); r.n.col = false; A.foco = mmIdsSub(r.n); A.foco.add(m.raiz.id); (m.res||[]).forEach(s=>{ if(s.no && A.foco.has(s.pai)) A.foco.add(s.no.id); }); }
  else A.foco = null;
  mmDesenhar();
  MM.nos.forEach((el,id)=>el.classList.toggle("dim", !!A.foco && !A.foco.has(id)));
  MM.nos.forEach(el=>el.classList.remove("sel"));
  const caixa = p.id ? mmCaixaSub(MM.B, m, p.id) : null;
  if(caixa){ const rb = MM.B.get(m.raiz.id); const x1 = Math.min(caixa.x, rb.x), y1 = Math.min(caixa.y, rb.y), x2 = Math.max(caixa.x+caixa.w, rb.x+rb.w), y2 = Math.max(caixa.y+caixa.h, rb.y+rb.h); mmAjustar({x:x1,y:y1,w:x2-x1,h:y2-y1}, true); }
  else mmAjustar(null, true);
  const bar = A.bar; bar.innerHTML = ""; bar.onclick = ()=>setTimeout(()=>MM.tela.focus({preventScroll:true}),0); bar.onpointerdown = e=>e.stopPropagation();
  bar.appendChild(h("button",{type:"button",onclick:()=>mmPasso(-1)},"‹ Anterior"));
  bar.appendChild(h("span",{}, (A.i+1)+" / "+A.passos.length));
  bar.appendChild(h("button",{type:"button",onclick:()=>mmPasso(1)},"Próximo ›"));
  bar.appendChild(h("button",{type:"button",onclick:()=>mmSairApres()},"Sair (Esc)"));
  if(!MM.tela.contains(bar)) MM.tela.appendChild(bar);
}
function mmSairApres(){
  const A = MM.apres; if(!A) return;
  MM.apres = null; A.bar.remove(); MM.bloco.classList.remove("apres");
  if(!A.cheiaAntes){ MM.cheia = false; MM.bloco.classList.remove("cheia"); document.documentElement.classList.remove("mm-sem-rolagem"); }
  mmDesenhar(); mmRibbon(); requestAnimationFrame(()=>mmAjustar());
}

/* ---------- importar / exportar ---------- */
function mmParaTexto(n, nv, ind){ let s = ind.repeat(nv) + "- " + (n.t||"").replace(/\n/g," "); n.filhos.forEach(c=>{ s += "\n" + mmParaTexto(c, nv+1, ind); }); return s; }
function mmMarkdown(m){
  let s = "# " + (m.raiz.t||m.nome) + "\n";
  m.raiz.filhos.forEach(c=>{ s += "\n## " + (c.t||"").replace(/\n/g," ") + "\n"; if(c.nota) s += "\n" + c.nota + "\n"; if(c.filhos.length) s += "\n" + c.filhos.map(x=>mmParaTexto(x, 0, "  ")).join("\n") + "\n"; });
  if(m.flut.length){ s += "\n## Tópicos flutuantes\n\n" + m.flut.map(x=>mmParaTexto(x,0,"  ")).join("\n") + "\n"; }
  return s;
}
function mmDialogoTexto(titulo, texto, nomeArq, tipo){
  const ov = h("div",{style:"position:fixed;inset:0;background:rgba(15,15,15,.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px"});
  const cx = h("div",{style:"background:#fff;border-radius:10px;max-width:720px;width:100%;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.25)"});
  cx.appendChild(h("div",{style:"font-weight:600;margin-bottom:8px"}, titulo));
  const ta = h("textarea",{readonly:"",style:"width:100%;box-sizing:border-box;height:300px;font:12px ui-monospace,monospace;border:1px solid rgba(55,53,47,.2);border-radius:6px;padding:8px"}, texto);
  cx.appendChild(ta);
  const bar = h("div",{style:"display:flex;gap:8px;justify-content:flex-end;margin-top:10px"});
  bar.appendChild(h("button",{class:"btn ghost",type:"button",onclick:()=>ov.remove()},"Fechar"));
  const bx = h("button",{class:"btn ghost",type:"button"}, icon("download"), "Baixar"); bx.onclick = ()=>mmBaixar(nomeArq, new Blob([texto],{type:tipo}));
  bar.appendChild(bx);
  const cp = h("button",{class:"btn",type:"button"}, icon("copy"), "Copiar"); cp.onclick = ()=>copiarTexto(ta.value, cp);
  bar.appendChild(cp);
  cx.appendChild(bar); ov.appendChild(cx); ov.addEventListener("click", e=>{ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov); ta.select();
}
async function mmBaixar(nome, blob){
  try{
    const dl = window.claude && window.claude.use ? await window.claude.use("downloads") : null;
    if(dl){ await dl.save({filename:nome, data:blob}); setStatus("Arquivo baixado: "+nome); return true; }
  }catch(e){ console.warn("download", e); }
  try{ const a = h("a",{href:URL.createObjectURL(blob), download:nome}); document.body.appendChild(a); a.click(); a.remove(); return true; }catch(e){}
  setStatus("Não foi possível baixar o arquivo."); return false;
}
function mmNomeArq(m, ext){ return (m.nome||"mapa").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").toLowerCase()+"."+ext; }
function mmExportarTexto(){ const m = mmAtual(); if(!m) return; mmDialogoTexto("Markdown · "+m.nome, mmMarkdown(m), mmNomeArq(m,"md"), "text/markdown;charset=utf-8"); }
function mmImportar(){
  const ov = h("div",{style:"position:fixed;inset:0;background:rgba(15,15,15,.45);z-index:10050;display:flex;align-items:center;justify-content:center;padding:16px"});
  const cx = h("div",{style:"background:#fff;border-radius:10px;max-width:640px;width:100%;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.25)"});
  cx.appendChild(h("div",{style:"font-weight:600;margin-bottom:4px"},"Importar texto como mapa"));
  cx.appendChild(h("div",{class:"peek-hint",style:"margin:0 0 8px"},"Cole uma lista com recuo (tab ou espaços), com marcadores (- ou •) ou Markdown com títulos (#, ##). A primeira linha vira o tópico central."));
  const ta = h("textarea",{style:"width:100%;box-sizing:border-box;height:260px;font:13px ui-monospace,monospace;border:1px solid rgba(55,53,47,.2);border-radius:6px;padding:8px",placeholder:"Apartamento Jardim Aquarius\n  Lazer\n    Piscina\n    Academia\n  Localização\n    Parque da Cidade"});
  cx.appendChild(ta);
  const bar = h("div",{style:"display:flex;gap:8px;justify-content:flex-end;margin-top:10px"});
  bar.appendChild(h("button",{class:"btn ghost",type:"button",onclick:()=>ov.remove()},"Cancelar"));
  bar.appendChild(h("button",{class:"btn",type:"button",onclick:()=>{ const raiz = mmDeTexto(ta.value); if(!raiz){ ta.focus(); return; } ov.remove(); mmCriar(raiz.t.slice(0,60), raiz); }},"Criar mapa"));
  cx.appendChild(bar); ov.appendChild(cx); ov.addEventListener("click", e=>{ if(e.target===ov) ov.remove(); });
  document.body.appendChild(ov); ta.focus();
}
function mmDeTexto(txt){
  const linhas = String(txt||"").replace(/\r/g,"").split("\n").filter(l=>l.trim());
  if(!linhas.length) return null;
  const itens = linhas.map(l=>{
    const hm = l.match(/^\s*(#{1,6})\s+(.*)$/);
    if(hm) return {nv:hm[1].length-1, t:hm[2].trim(), h:true};
    const ws = l.match(/^[\t ]*/)[0].replace(/\t/g,"    ").length;
    return {nv:null, ws, t:l.trim().replace(/^([-*+•–]|\d+[.)])\s+/,"").trim()};
  });
  const temH = itens.some(i=>i.h); const maxH = temH ? Math.max(...itens.filter(i=>i.h).map(i=>i.nv)) : -1;
  const wsU = [...new Set(itens.filter(i=>!i.h).map(i=>i.ws))].sort((a,b)=>a-b);
  itens.forEach(i=>{ if(!i.h) i.nv = (temH ? maxH+1 : 0) + wsU.indexOf(i.ws); });
  const raiz = mmNo(itens[0].t);
  const pilha = [{nv:itens[0].nv, n:raiz}];
  itens.slice(1).forEach(i=>{
    let nv = i.nv; if(nv <= itens[0].nv) nv = itens[0].nv + 1;
    while(pilha.length > 1 && pilha[pilha.length-1].nv >= nv) pilha.pop();
    const n = mmNo(i.t); pilha[pilha.length-1].n.filhos.push(n); pilha.push({nv, n});
  });
  return raiz;
}
function mmQuebrar(txt, maxW, fonte, ctx){
  ctx.font = fonte; const out = [];
  String(txt||" ").split("\n").forEach(par=>{
    let linha = "";
    par.split(/(\s+)/).forEach(p=>{ const t = linha + p; if(ctx.measureText(t).width > maxW && linha.trim()){ out.push(linha.trim()); linha = p.trimStart(); } else linha = t; });
    out.push(linha.trim());
  });
  return out;
}
function mmEsc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function mmGerarSVG(m){
  const lim = mmLimites(); const pad = 40;
  const W = Math.ceil(lim.w + pad*2), H = Math.ceil(lim.h + pad*2), ox = -lim.x + pad, oy = -lim.y + pad;
  const T = MM_TEMAS[m.tema] || MM_TEMAS.esdras;
  const ctx = document.createElement("canvas").getContext("2d");
  const FF = '-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Helvetica Neue,Arial,sans-serif';
  let s = '<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" fill="'+(m.fundo||T.fundo)+'"/><g transform="translate('+ox+','+oy+')">';
  const linhas = MM.svgEl.cloneNode(true);
  [...linhas.querySelectorAll(".rel-hit:not([data-lim]),.rel-h,line")].forEach(x=>x.remove());
  [...linhas.querySelectorAll("[data-reltx]")].forEach(x=>{ if(!/^Duplo/.test(x.textContent)) return; x.remove(); });
  s += linhas.innerHTML;
  MM.B.forEach((b,id)=>{
    const e = MM.est.get(id); const el = MM.nos.get(id); if(!e || !el) return;
    const r = mmAchar(m, id); if(!r) return; const n = r.n;
    const rad = {arredondado:9, retangulo:2, capsula:b.h/2, elipse:0, sublinhado:0, sem:0}[e.forma] ?? 8;
    if(e.forma === "elipse") s += '<ellipse cx="'+(b.x+b.w/2)+'" cy="'+(b.y+b.h/2)+'" rx="'+(b.w/2)+'" ry="'+(b.h/2)+'" fill="'+(e.fill||"none")+'" stroke="'+(e.borda||"none")+'" stroke-width="1.5"/>';
    else if(e.forma === "sublinhado") s += (e.fill ? '<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" fill="'+e.fill+'"/>' : '') + '<path d="M'+b.x+' '+(b.y+b.h-1)+'H'+(b.x+b.w)+'" stroke="'+(e.borda||e.ramo)+'" stroke-width="2"/>';
    else if(e.forma !== "sem" || e.fill) s += '<rect x="'+b.x+'" y="'+b.y+'" width="'+b.w+'" height="'+b.h+'" rx="'+rad+'" fill="'+(e.fill||"none")+'" stroke="'+(e.forma==="sem"?"none":(e.borda||"none"))+'" stroke-width="'+(e.tipo==="raiz"?2:1.5)+'"/>';
    const tx = el.querySelector(".tx"); const rt = tx.getBoundingClientRect(), re = el.getBoundingClientRect();
    const tx0 = b.x + (rt.left - re.left)/MM.zoom, ty0 = b.y + (rt.top - re.top)/MM.zoom;
    const fonte = (e.i?"italic ":"")+(e.b?"650 ":"400 ")+e.tam+"px "+FF;
    const ls = mmQuebrar(n.t, rt.width/MM.zoom + 1, fonte, ctx); const lh = e.tam*1.35;
    ls.forEach((l,i)=>{ s += '<text x="'+tx0+'" y="'+(ty0 + lh*(i+.78))+'" font-family="'+FF+'" font-size="'+e.tam+'" font-weight="'+(e.b?650:400)+'" font-style="'+(e.i?"italic":"normal")+'" fill="'+e.cor+'">'+mmEsc(l)+'</text>'; });
    const mk = el.querySelector(".mm-mk");
    if(mk){ const rm = mk.getBoundingClientRect(); let x = b.x + (rm.left - re.left)/MM.zoom; const y = b.y + (rm.top - re.top)/MM.zoom;
      (n.mk||[]).forEach(c=>{ const sv = mmMarcaSVG(c); if(sv){ s += '<g transform="translate('+x+','+y+')">'+sv.replace('<svg viewBox="0 0 16 16">','<svg width="16" height="16" viewBox="0 0 16 16">')+'</g>'; x += 18; } else { s += '<text x="'+x+'" y="'+(y+13)+'" font-size="14">'+mmEsc(c.slice(2))+'</text>'; x += 18; } }); }
    if(n.tags && n.tags.length){ const tg = el.querySelector(".mm-tags"); const rg = tg.getBoundingClientRect(); s += '<text x="'+(b.x + (rg.left-re.left)/MM.zoom)+'" y="'+(b.y + (rg.top-re.top)/MM.zoom + 12)+'" font-family="'+FF+'" font-size="10.5" fill="#6b6458">'+mmEsc(n.tags.map(t=>"#"+t).join("  "))+'</text>'; }
  });
  s += '</g></svg>';
  return {svg:s, W, H};
}
async function mmExportarImagem(tipo){
  const m = mmAtual(); if(!m) return;
  if(MM.outline){ MM.outline = false; mmDesenhar(); mmRibbon(); }
  const {svg:txt, W, H} = mmGerarSVG(m);
  if(tipo === "svg"){ await mmBaixar(mmNomeArq(m,"svg"), new Blob([txt],{type:"image/svg+xml"})); return; }
  const esc = Math.min(2, 8000/Math.max(W,H));
  const img = new Image();
  img.onload = async ()=>{
    const cv = document.createElement("canvas"); cv.width = Math.round(W*esc); cv.height = Math.round(H*esc);
    const c = cv.getContext("2d"); c.scale(esc, esc); c.drawImage(img, 0, 0);
    cv.toBlob(b=>{ if(b) mmBaixar(mmNomeArq(m,"png"), b); else setStatus("Não foi possível gerar a imagem."); }, "image/png");
  };
  img.onerror = ()=>setStatus("Não foi possível gerar a imagem.");
  img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(txt);
}

/* ---------- eventos (mouse, toque e teclado) ---------- */
function mmEventos(){
  const T = MM.tela;
  const ptrs = new Map(); let gesto = null; let ult = {t:0, k:null, x:0, y:0};
  const duplo = (k, e)=>{ const agora = Date.now(); const ok = ult.k === k && agora - ult.t < 380 && Math.abs(e.clientX-ult.x) < 6 && Math.abs(e.clientY-ult.y) < 6; ult = ok ? {t:0,k:null,x:0,y:0} : {t:agora, k, x:e.clientX, y:e.clientY}; return ok; };
  T.addEventListener("wheel", e=>{
    if(MM.outline) return;
    e.preventDefault();
    if(e.ctrlKey || e.metaKey){ mmZoomEm(MM.zoom * Math.exp(-e.deltaY*0.0022), e.clientX, e.clientY); }
    else { MM.px -= e.deltaX; MM.py -= e.deltaY; mmAplicarCam(); }
  }, {passive:false});
  T.addEventListener("pointerdown", e=>{
    if(MM.outline || e.target.closest(".mm-busca,.mm-apres-bar,.mm-vazio")) return;
    if(MM.editando && !e.target.closest('.tx[contenteditable]')) mmFimEdicao(true, true);
    if(e.target.closest('.tx[contenteditable]')) return;
    ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(ptrs.size === 2){ const [a,b] = [...ptrs.values()]; gesto = {tipo:"pinch", d:Math.hypot(a.x-b.x,a.y-b.y), z:MM.zoom, cx:(a.x+b.x)/2, cy:(a.y+b.y)/2}; return; }
    if(e.button === 2) return;
    const m = mmAtual(); if(!m) return;
    T.focus({preventScroll:true});
    const h1 = e.target.closest && e.target.getAttribute && e.target.getAttribute("data-h");
    if(h1){ const r = m.rel.find(x=>x.id===e.target.getAttribute("data-rel")); mmAntes(); gesto = {tipo:"alca", r, k:h1, x:e.clientX, y:e.clientY, v0:(r[h1]||[0,-60]).slice()}; T.setPointerCapture(e.pointerId); return; }
    const relId = e.target.getAttribute && e.target.getAttribute("data-rel");
    if(relId){ MM.selRel = relId; MM.selLim = null; MM.sel = new Set(); mmPintarSel(); mmFormato(); mmRibbon(); if(duplo("r"+relId, e) && e.target.getAttribute("data-reltx")) mmEditarRel(relId); return; }
    const limId = e.target.getAttribute && e.target.getAttribute("data-lim");
    if(limId){ MM.selLim = limId; MM.selRel = null; const l = m.lim.find(x=>x.id===limId); MM.sel = new Set(l?[l.alvo]:[]); mmPintarSel(); mmFormato(); mmRibbon(); return; }
    const noEl = e.target.closest(".mm-no");
    if(noEl){
      const id = noEl.dataset.id;
      if(MM.modoRel){ mmCriarRel(id); return; }
      if(MM.apres) return;
      if(e.shiftKey || e.ctrlKey || e.metaKey){ mmSelecionar(id, true); return; }
      if(!MM.sel.has(id) || MM.sel.size > 1) mmSelecionar(id);
      MM.selLim = null;
      if(duplo("n"+id, e)){ mmEditar(id); return; }
      const r = mmAchar(m, id);
      if(id !== m.raiz.id && !r.resumo) gesto = {tipo:"no", id, x:e.clientX, y:e.clientY, ativo:false, flut:!!(r.flut && !r.pai)};
      T.setPointerCapture(e.pointerId);
      return;
    }
    if(MM.modoRel){ MM.modoRel = null; T.classList.remove("rel"); mmStatus(null); mmRibbon(); }
    if(duplo("fundo", e) && !MM.apres){ const p = mmTelaParaMundo(e.clientX, e.clientY); mmFlutuante(p.x, p.y); return; }
    if(e.shiftKey && !MM.apres){ const r = T.getBoundingClientRect(); const laco = h("div",{class:"mm-laco"}); T.appendChild(laco); gesto = {tipo:"laco", x:e.clientX, y:e.clientY, laco, r}; }
    else { gesto = {tipo:"pan", x:e.clientX, y:e.clientY, px:MM.px, py:MM.py, moveu:false}; T.classList.add("pan"); }
    T.setPointerCapture(e.pointerId);
  });
  T.addEventListener("pointermove", e=>{
    if(ptrs.has(e.pointerId)) ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(!gesto) return;
    const m = mmAtual(); if(!m) return;
    if(gesto.tipo === "pinch" && ptrs.size === 2){ const [a,b] = [...ptrs.values()]; mmZoomEm(gesto.z * Math.hypot(a.x-b.x,a.y-b.y)/Math.max(gesto.d,1), gesto.cx, gesto.cy); return; }
    const dx = e.clientX - gesto.x, dy = e.clientY - gesto.y;
    if(gesto.tipo === "pan"){ MM.px = gesto.px + dx; MM.py = gesto.py + dy; if(Math.abs(dx)+Math.abs(dy) > 3) gesto.moveu = true; mmAplicarCam(); }
    else if(gesto.tipo === "alca"){ gesto.r[gesto.k] = [gesto.v0[0] + dx/MM.zoom, gesto.v0[1] + dy/MM.zoom]; mmDesenharLinhas(); }
    else if(gesto.tipo === "laco"){ const x1 = Math.min(gesto.x, e.clientX) - gesto.r.left, y1 = Math.min(gesto.y, e.clientY) - gesto.r.top; Object.assign(gesto.laco.style, {left:x1+"px", top:y1+"px", width:Math.abs(dx)+"px", height:Math.abs(dy)+"px"}); }
    else if(gesto.tipo === "no"){
      if(!gesto.ativo){ if(Math.abs(dx)+Math.abs(dy) < 5) return; gesto.ativo = true; MM.arrastando = true;
        const el = MM.nos.get(gesto.id); gesto.el = el; gesto.fant = el.cloneNode(true); gesto.fant.classList.add("fant"); gesto.fant.classList.remove("sel"); MM.camNos.appendChild(gesto.fant);
        gesto.b0 = Object.assign({}, MM.B.get(gesto.id)); gesto.proib = mmIdsSub(mmAchar(m, gesto.id).n); el.style.opacity = ".35"; }
      gesto.fant.style.transform = "translate("+(gesto.b0.x + dx/MM.zoom)+"px,"+(gesto.b0.y + dy/MM.zoom)+"px)";
      gesto.fant.style.display = "none"; const alvoEl = document.elementFromPoint(e.clientX, e.clientY); gesto.fant.style.display = "";
      const ne = alvoEl && alvoEl.closest && alvoEl.closest(".mm-no");
      MM.nos.forEach(x=>x.classList.remove("alvo-filho","alvo-antes","alvo-depois"));
      gesto.alvo = null;
      if(ne && !gesto.proib.has(ne.dataset.id)){
        const tid = ne.dataset.id, rt = mmAchar(m, tid);
        if(rt && !rt.resumo){
          const rr = ne.getBoundingClientRect(); const fy = (e.clientY - rr.top)/rr.height;
          let zona = "filho";
          if(rt.pai && !(m.layout==="organograma"||m.layout==="cima")){ if(fy < .28) zona = "antes"; else if(fy > .72) zona = "depois"; }
          gesto.alvo = {id:tid, zona}; ne.classList.add("alvo-"+zona);
        }
      }
    }
  });
  const fim = e=>{
    ptrs.delete(e.pointerId);
    if(!gesto) return;
    const g = gesto; gesto = null; T.classList.remove("pan");
    const m = mmAtual(); if(!m) return;
    if(g.tipo === "pinch") return;
    if(g.tipo === "pan"){ if(!g.moveu && !e.shiftKey){ MM.sel = new Set(); MM.selRel = null; MM.selLim = null; mmPintarSel(); mmFormato(); mmRibbon(); } return; }
    if(g.tipo === "alca"){ mmMudou(); return; }
    if(g.tipo === "laco"){
      const a = mmTelaParaMundo(Math.min(g.x,e.clientX), Math.min(g.y,e.clientY)), b = mmTelaParaMundo(Math.max(g.x,e.clientX), Math.max(g.y,e.clientY));
      g.laco.remove(); const ids = [];
      MM.B.forEach((bx,id)=>{ if(bx.x < b.x && bx.x+bx.w > a.x && bx.y < b.y && bx.y+bx.h > a.y) ids.push(id); });
      MM.sel = new Set(ids); MM.selRel = null; mmPintarSel(); mmFormato(); mmRibbon(); return;
    }
    if(g.tipo === "no"){
      MM.arrastando = false;
      if(!g.ativo) return;
      g.fant.remove(); g.el.style.opacity = "";
      MM.nos.forEach(x=>x.classList.remove("alvo-filho","alvo-antes","alvo-depois"));
      const r = mmAchar(m, g.id); if(!r) return;
      const dx = (e.clientX - g.x)/MM.zoom, dy = (e.clientY - g.y)/MM.zoom;
      mmAntes();
      if(g.alvo){
        r.lista.splice(r.idx, 1); delete r.n.x; delete r.n.y;
        const rt = mmAchar(m, g.alvo.id);
        if(g.alvo.zona === "filho"){ rt.n.col = false; rt.n.filhos.push(r.n); }
        else rt.lista.splice(rt.idx + (g.alvo.zona === "depois" ? 1 : 0), 0, r.n);
        const ra = mmAchar(m, g.id);
        if(ra.nivel === 1 && m.layout === "mapa" && !ra.flut){ const p = mmTelaParaMundo(e.clientX, e.clientY); const rb = MM.B.get(m.raiz.id); r.n.lado = p.x < rb.x + rb.w/2 ? "e" : "d"; } else delete r.n.lado;
      }else if(g.flut){ r.n.x = Math.round((r.n.x||0) + dx); r.n.y = Math.round((r.n.y||0) + dy); }
      else{
        const ra = r;
        if(ra.nivel === 1 && m.layout === "mapa" && !ra.flut){
          const p = mmTelaParaMundo(e.clientX, e.clientY); const rb = MM.B.get(m.raiz.id);
          if(Math.abs(p.x - (rb.x+rb.w/2)) < 520 && Math.abs(p.y) < 500){ r.n.lado = p.x < rb.x + rb.w/2 ? "e" : "d"; mmMudou(); return; }
        }
        r.lista.splice(r.idx, 1); delete r.n.lado;
        r.n.x = Math.round(g.b0.x + dx); r.n.y = Math.round(g.b0.y + dy); m.flut.push(r.n);
      }
      mmMudou();
    }
  };
  T.addEventListener("pointerup", fim);
  T.addEventListener("pointercancel", fim);
  T.addEventListener("contextmenu", e=>{
    const noEl = e.target.closest(".mm-no"); if(!noEl || MM.apres) return;
    e.preventDefault(); const id = noEl.dataset.id; if(!MM.sel.has(id)) mmSelecionar(id);
    const ancora = h("div",{style:"position:fixed;left:"+e.clientX+"px;top:"+e.clientY+"px;width:1px;height:1px"}); document.body.appendChild(ancora);
    const m = mmAtual(); const r = mmAchar(m, id); const raiz = id === m.raiz.id;
    menuPopup(ancora, [
      {label:"Editar texto  (F2)", icon:"edit", run:()=>mmEditar(id)},
      {label:"Subtópico  (Tab)", icon:"plus", run:()=>mmFilho()},
      {label:"Tópico irmão  (Enter)", icon:"plus", run:()=>mmIrmao(false)},
      "-",
      {label:"Nota", icon:"title", run:()=>{ MM.painel="nota"; MM.mostrarFmt=true; mmFormato(); }},
      {label:"Marcas", icon:"check", run:()=>{ MM.painel="marcas"; MM.mostrarFmt=true; mmFormato(); }},
      ...(G.novaSolicitacao ? [{label:"Criar imóvel a partir daqui", icon:"plus", run:()=>mmVirarSolicitacao()}] : []),
      {label:"Vincular imóvel", icon:"link", run:()=>mmVincularDemanda()},
      {label:"Relação a partir daqui", icon:"send", run:()=>mmIniciarRel()},
      "-",
      {label:"Copiar", icon:"copy", run:()=>mmCopiar(false)},
      ...(MM.clip ? [{label:"Colar como subtópico", icon:"copy", run:()=>mmColar()}] : []),
      ...(raiz || r.resumo ? [] : [{label:"Excluir", icon:"trash", danger:true, run:()=>mmApagar()}])
    ], "left");
    setTimeout(()=>ancora.remove(), 50);
  });
  T.addEventListener("keydown", e=>{
    if(MM.editando || MM.outline) return;
    const t = e.target; if(t !== T) return;
    const m = mmAtual(); if(!m) return;
    const k = e.key, ctrl = e.ctrlKey || e.metaKey;
    if(MM.apres){ if(k==="Escape") mmSairApres(); else if(k==="ArrowRight"||k===" "||k==="PageDown"||k==="Enter") mmPasso(1); else if(k==="ArrowLeft"||k==="PageUp") mmPasso(-1); e.preventDefault(); return; }
    if(ctrl && (k==="z"||k==="Z")){ e.preventDefault(); mmVoltar(e.shiftKey); return; }
    if(ctrl && (k==="y"||k==="Y")){ e.preventDefault(); mmVoltar(true); return; }
    if(ctrl && (k==="f"||k==="F")){ e.preventDefault(); mmAbrirBusca(); return; }
    if(ctrl && (k==="c"||k==="C")){ e.preventDefault(); mmCopiar(false); return; }
    if(ctrl && (k==="x"||k==="X")){ e.preventDefault(); mmCopiar(true); return; }
    if(ctrl && (k==="v"||k==="V")){ e.preventDefault(); mmColar(); return; }
    if(ctrl && (k==="a"||k==="A")){ e.preventDefault(); MM.sel = new Set(MM.B.keys()); mmPintarSel(); mmRibbon(); return; }
    if(ctrl && (k==="0")){ e.preventDefault(); mmAjustar(); return; }
    if(ctrl && (k==="="||k==="+")){ e.preventDefault(); mmZoomEm(MM.zoom*1.2); return; }
    if(ctrl && k==="-"){ e.preventDefault(); mmZoomEm(MM.zoom/1.2); return; }
    if(k === "Escape"){ if(MM.modoRel){ MM.modoRel = null; T.classList.remove("rel"); mmStatus(null); mmRibbon(); } else if(MM.pop){ mmFecharPop(); } else if(MM.cheia){ mmTelaCheia(false); } return; }
    if(!MM.sel.size && !MM.selRel && !MM.selLim){ if(k.startsWith("Arrow") || k==="Tab" || k==="Enter"){ e.preventDefault(); mmSelecionar(m.raiz.id); } return; }
    if(k === "Tab"){ e.preventDefault(); mmFilho(); return; }
    if(k === "Insert"){ e.preventDefault(); mmFilho(); return; }
    if(k === "Enter" && ctrl){ e.preventDefault(); mmPai(); return; }
    if(k === "Enter"){ e.preventDefault(); mmIrmao(e.shiftKey); return; }
    if(k === "Delete" || k === "Backspace"){ e.preventDefault(); mmApagar(); return; }
    if(k === "F2"){ e.preventDefault(); const s = mmSelUm(); if(s) mmEditar(s.id); return; }
    if(k === " "){ e.preventDefault(); const s = mmSelUm(); if(s) mmAlternar(s.id); return; }
    if(e.altKey && (k==="ArrowUp"||k==="ArrowDown")){ e.preventDefault(); mmMoverIrmao(k==="ArrowUp"?-1:1); return; }
    if(k.startsWith("Arrow")){ e.preventDefault(); mmNavegar(k); return; }
    if(k.length === 1 && !ctrl && !e.altKey){
      const s = mmSelUm(); if(!s) return;
      e.preventDefault(); mmEditar(s.id);
      const tx = MM.nos.get(s.id)?.querySelector(".tx"); if(tx){ tx.textContent = k; s.t = k; const sel = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(tx); rg.collapse(false); sel.removeAllRanges(); sel.addRange(rg); mmPosicionar(); }
    }
  });
}
function mmEditarRel(id){
  const m = mmAtual(); const r = m.rel.find(x=>x.id===id); if(!r) return;
  caixaDialogo("Texto da relação", true).then(v=>{ if(v===null) return; mmAntes(); r.t = v.trim(); mmMudou(); });
}
function mmNavegar(k){
  const s = mmSelUm(); if(!s) return;
  const b = MM.B.get(s.id); if(!b) return;
  const cx = b.x+b.w/2, cy = b.y+b.h/2;
  let melhor = null, nota = Infinity;
  MM.B.forEach((o,id)=>{
    if(id === s.id) return;
    const dx = (o.x+o.w/2) - cx, dy = (o.y+o.h/2) - cy;
    let p, q;
    if(k==="ArrowRight"){ p = dx; q = dy; } else if(k==="ArrowLeft"){ p = -dx; q = dy; } else if(k==="ArrowDown"){ p = dy; q = dx; } else { p = -dy; q = dx; }
    if(p <= 4) return;
    const v = p + Math.abs(q)*2.2;
    if(v < nota){ nota = v; melhor = id; }
  });
  if(melhor){ mmSelecionar(melhor); mmMostrar(melhor); }
}

return {MM, renderMapa, mmReceber, mmNorm, LS_MAPAS};
}
