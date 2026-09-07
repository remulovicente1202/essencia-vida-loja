import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

/* ======================= FIREBASE INIT ======================= */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const configLooksEmpty = Object.values(firebaseConfig).some(v => !v || String(v).includes("COLE_AQUI"));

/* ======================= DADOS PADRÃO (usados só no "Carregar exemplos") ======================= */
const DEFAULT_SETTINGS = {
  pixKey: "essenciavida@pix.com.br",
  whatsapp: "5591990000000",
  email: "contato@essenciavida.com.br",
  phone: "(91) 99000-0000"
};

const DEFAULT_CATEGORIES = [
  { id:"vitaminas", name:"Vitaminas & Suplementos", unit:"mg", order:1,
    theme:{ bg:"#FBF7EF", accent:"#E8703A", secondary:"#4A7A64", text:"#2B2620", card:"#FFFFFF" } },
  { id:"perfumes", name:"Perfumes", unit:"ml", order:2,
    theme:{ bg:"#14110F", accent:"#C9A961", secondary:"#6B5B47", text:"#EDE6D8", card:"#1D1916" } }
];

const DEFAULT_PRODUCTS = [
  { id:"p1", categoryId:"vitaminas", name:"Ômega 3 Ultra", price:79.90, size:"1000",
    image:"https://images.unsplash.com/photo-1584017911766-d451b3d0e843?q=80&w=600&auto=format&fit=crop",
    video:"", desc:"Cápsulas de óleo de peixe concentrado, ricas em EPA e DHA. Apoia coração, memória e articulações. Frasco com 60 cápsulas." },
  { id:"p2", categoryId:"perfumes", name:"Noir Élégance", price:189.90, size:"100",
    image:"https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=600&auto=format&fit=crop",
    video:"", desc:"Fragrância amadeirada e ambarada, com abertura de bergamota e fundo de baunilha. Fixação prolongada, ideal para a noite." }
];

const DEFAULT_RADIO_STATIONS = [
  { id:"eletronica", label:"Eletrônica (ambient/chill)", url:"https://ice.somafm.com/groovesalad" },
  { id:"rock", label:"Rock / Indie", url:"https://ice.somafm.com/indiepop" },
  { id:"lounge", label:"Lounge / Instrumental", url:"https://ice.somafm.com/dronezone" },
  { id:"classica", label:"Clássica", url:"" },
  { id:"forro_sertanejo", label:"Forró & Sertanejo", url:"" },
  { id:"emalta", label:"Em alta / Pop", url:"" }
];

/* ======================= ESTADO ======================= */
let state = {
  settings: {...DEFAULT_SETTINGS},
  categories: [],
  products: [],
  notes: [],
  radioStations: [],
};
let route = "home";
let adminUnlocked = false;
let adminTab = "produtos";
let notesLoaded = false;

/* ======================= FIRESTORE: LEITURA EM TEMPO REAL ======================= */
function watchCollections(){
  onSnapshot(collection(db,"categories"), snap=>{
    state.categories = snap.docs.map(d=>d.data()).sort((a,b)=>(a.order||0)-(b.order||0));
    render();
  }, err=>console.error("categories:", err));

  onSnapshot(collection(db,"products"), snap=>{
    state.products = snap.docs.map(d=>d.data());
    render();
  }, err=>console.error("products:", err));

  onSnapshot(collection(db,"radios"), snap=>{
    state.radioStations = snap.docs.map(d=>d.data());
    if(window._refreshRadioList) window._refreshRadioList();
    if(route==="admin" && adminTab==="radios") render();
  }, err=>console.error("radios:", err));

  onSnapshot(doc(db,"settings","main"), snap=>{
    if(snap.exists()) state.settings = {...DEFAULT_SETTINGS, ...snap.data()};
    renderFooterContact();
    if(route==="admin" && adminTab==="config") render();
  }, err=>console.error("settings:", err));
}

async function loadNotesOnce(){
  const snap = await getDocs(collection(db,"notes"));
  state.notes = snap.docs.map(d=>d.data()).sort((a,b)=> (b.ts||0)-(a.ts||0));
  notesLoaded = true;
}

/* ======================= FIRESTORE: ESCRITA (só chamado quando logado) ======================= */
async function saveProductDoc(p){ await setDoc(doc(db,"products",p.id), p); }
async function deleteProductDoc(id){ await deleteDoc(doc(db,"products",id)); }
async function saveCategoryDoc(c){ await setDoc(doc(db,"categories",c.id), c); }
async function saveRadioDoc(r){ await setDoc(doc(db,"radios",r.id), r); }
async function deleteRadioDoc(id){ await deleteDoc(doc(db,"radios",id)); }
async function saveNoteDoc(n){ await setDoc(doc(db,"notes",n.id), n); }
async function deleteNoteDoc(id){ await deleteDoc(doc(db,"notes",id)); }
async function saveSettingsDoc(s){ await setDoc(doc(db,"settings","main"), s); }

async function seedDefaults(){
  for(const c of DEFAULT_CATEGORIES) await saveCategoryDoc(c);
  for(const p of DEFAULT_PRODUCTS) await saveProductDoc(p);
  for(const r of DEFAULT_RADIO_STATIONS) await saveRadioDoc(r);
  const existing = await getDoc(doc(db,"settings","main"));
  if(!existing.exists()) await saveSettingsDoc(DEFAULT_SETTINGS);
  toast("Exemplos carregados!");
}

/* ======================= HELPERS ======================= */
function uid(prefix){ return prefix + "_" + Math.random().toString(36).slice(2,9); }
function money(v){ return "R$ " + Number(v||0).toFixed(2).replace(".", ","); }
function esc(s){ return (s||"").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(window._toastT);
  window._toastT = setTimeout(()=>t.classList.remove("show"), 2400);
}
function getCategory(id){ return state.categories.find(c=>c.id===id); }
function applyTheme(theme){
  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--secondary", theme.secondary);
  document.documentElement.style.setProperty("--text", theme.text);
  document.documentElement.style.setProperty("--card", theme.card);
}
function resetShellTheme(){
  document.documentElement.style.setProperty("--bg", "#141312");
  document.documentElement.style.setProperty("--accent", "#C9A961");
  document.documentElement.style.setProperty("--secondary", "#6B5B47");
  document.documentElement.style.setProperty("--text", "#EDE6D8");
  document.documentElement.style.setProperty("--card", "#1D1916");
}

/* ======================= ROUTER ======================= */
window.goTo = function(r){
  route = r;
  location.hash = "#/" + r;
  render();
};
window.addEventListener("hashchange", ()=>{
  route = location.hash.replace("#/", "") || "home";
  render();
});

function renderNav(){
  const nav = document.getElementById("tabsNav");
  let html = `<button data-r="home" class="${route==='home'?'active':''}">Ofertas</button>`;
  state.categories.forEach(c=>{
    html += `<button data-r="${c.id}" class="${route===c.id?'active':''}">${esc(c.name)}</button>`;
  });
  nav.innerHTML = html;
  nav.querySelectorAll("button").forEach(b=> b.onclick = ()=> goTo(b.dataset.r));
}

/* ======================= PRODUCT CARD ======================= */
function productCardHTML(p, cat){
  const unitLabel = cat.unit === "ml" ? `${p.size} ml` : cat.unit === "mg" ? `${p.size} mg` : p.size;
  const media = p.video
    ? `<video src="${esc(p.video)}" muted loop playsinline onmouseover="this.play()" onmouseout="this.pause()" poster="${esc(p.image)}"></video>`
    : `<img src="${esc(p.image) || 'https://placehold.co/400x400/222/ccc?text=Produto'}" alt="${esc(p.name)}" loading="lazy">`;
  return `
  <div class="prodCard">
    <div class="prodMedia">${media}<span class="prodTag">${esc(cat.unit)}</span></div>
    <div class="prodBody">
      <h4>${esc(p.name)}</h4>
      <span class="prodSize">${unitLabel}</span>
      <p class="prodDesc">${esc(p.desc)}</p>
      <div class="prodFooter">
        <span class="prodPrice">${money(p.price)}</span>
        <button class="buyBtn" onclick="openCheckout('${p.id}')">Comprar</button>
      </div>
    </div>
  </div>`;
}

/* ======================= VIEWS ======================= */
function renderHome(){
  resetShellTheme();
  const all = state.products;
  let html = `<div class="view-home">
    <div class="hero">
      <div class="eyebrow">Vitrine geral</div>
      <h1>Tudo em um só lugar</h1>
      <p>Descubra vitaminas, suplementos e perfumes selecionados, com pagamento facilitado no site.</p>
    </div>
    <div class="catGrid">`;
  state.categories.forEach(c=>{
    html += `<div class="catCard" style="background:${c.theme.bg}; color:${c.theme.text}; border-color:${c.theme.accent}33" onclick="goTo('${c.id}')">
      <h3 style="color:${c.theme.accent}">${esc(c.name)}</h3>
      <span>${state.products.filter(p=>p.categoryId===c.id).length} produtos • ver categoria →</span>
    </div>`;
  });
  html += `</div><div class="featured"><h2>Destaques</h2><div class="prodGrid">`;
  if(all.length===0) html += `<div class="empty">Nenhum produto cadastrado ainda.</div>`;
  all.slice(0,8).forEach(p=>{
    const cat = getCategory(p.categoryId) || state.categories[0];
    if(cat) html += productCardHTML(p, cat);
  });
  html += `</div></div></div>`;
  document.getElementById("mainView").innerHTML = html;
}

function renderCategory(catId){
  const cat = getCategory(catId);
  if(!cat){ renderHome(); return; }
  applyTheme(cat.theme);
  const prods = state.products.filter(p=>p.categoryId===catId);
  let html = `<div class="view-${catId==='perfumes'?'perfumes':catId==='vitaminas'?'vitaminas':'home'}">
    <div class="hero">
      <div class="eyebrow" style="color:${cat.theme.accent}">${esc(cat.name)}</div>
      <h1>${catId==='perfumes' ? 'Fragrâncias selecionadas' : catId==='vitaminas' ? 'Cuidado que vem de dentro' : esc(cat.name)}</h1>
      <p>${catId==='perfumes' ? 'Aromas marcantes, entrega combinada, atendimento próximo.' : catId==='vitaminas' ? 'Suplementos escolhidos com cuidado para o seu dia a dia.' : ''}</p>
    </div>
    <div class="prodGrid">`;
  if(prods.length===0) html += `<div class="empty">Nenhum produto nesta categoria ainda.</div>`;
  prods.forEach(p=> html += productCardHTML(p, cat));
  html += `</div></div>`;
  document.getElementById("mainView").innerHTML = html;
}

/* ======================= CHECKOUT ======================= */
window.openCheckout = function(pid){
  const p = state.products.find(x=>x.id===pid);
  if(!p) return;
  document.getElementById("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this) closeModal()">
    <div class="modal">
      <button class="closeX" onclick="closeModal()">×</button>
      <h3>${esc(p.name)}</h3>
      <div class="modalPrice">${money(p.price)}</div>
      <div class="payOpt">
        <button onclick="showPix('${p.id}')"><b>Pagar com Pix</b><span>Copiar chave e enviar comprovante</span></button>
        <button onclick="payWhatsapp('${p.id}')"><b>Pagar em dinheiro</b><span>Combinar entrega presencial via WhatsApp</span></button>
      </div>
      <div id="checkoutExtra"></div>
    </div>
  </div>`;
};
window.closeModal = function(){ document.getElementById("modalRoot").innerHTML = ""; };
window.showPix = function(pid){
  const p = state.products.find(x=>x.id===pid);
  const key = state.settings.pixKey;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(key)}`;
  document.getElementById("checkoutExtra").innerHTML = `
    <div class="qrBox">
      <img src="${qr}" width="150" height="150" alt="QR Pix">
      <div class="pixKeyRow">
        <input id="pixKeyInput" readonly value="${esc(key)}">
        <button onclick="copyPix()">Copiar</button>
      </div>
      <p style="font-size:12px;opacity:.6;margin-top:8px">Após pagar, envie o comprovante pelo WhatsApp informando o produto: <b>${esc(p.name)}</b>.</p>
    </div>`;
};
window.copyPix = function(){
  const el = document.getElementById("pixKeyInput");
  el.select();
  navigator.clipboard && navigator.clipboard.writeText(el.value);
  toast("Chave Pix copiada!");
};
window.payWhatsapp = function(pid){
  const p = state.products.find(x=>x.id===pid);
  const msg = encodeURIComponent(`Olá! Quero comprar "${p.name}" (${money(p.price)}). Vou pagar em dinheiro na entrega, podemos combinar?`);
  window.open(`https://wa.me/${state.settings.whatsapp}?text=${msg}`, "_blank");
  closeModal();
};

/* ======================= RADIO ======================= */
function initRadio(){
  const sel = document.getElementById("radioSelect");
  const audio = document.getElementById("radioAudio");
  const btn = document.getElementById("playPauseBtn");
  const status = document.getElementById("radioStatus");

  function populate(){
    const prevVal = sel.value;
    sel.innerHTML = state.radioStations.map(s=>`<option value="${s.id}">${esc(s.label)}${s.url?'':' (sem link)'}</option>`).join("");
    if(state.radioStations.some(s=>s.id===prevVal)) sel.value = prevVal;
  }
  function setStation(){
    const st = state.radioStations.find(s=>s.id===sel.value);
    audio.pause(); btn.textContent="▶";
    if(!st || !st.url){ audio.removeAttribute("src"); status.textContent = "sem link cadastrado"; return; }
    audio.src = st.url;
    status.textContent = "parado";
  }
  populate(); setStation();
  sel.onchange = ()=> setStation();
  btn.onclick = ()=>{
    const st = state.radioStations.find(s=>s.id===sel.value);
    if(!st || !st.url){ status.textContent = "cadastre o link desta rádio no painel admin"; return; }
    if(audio.paused){
      status.textContent = "carregando…";
      audio.play().then(()=>{ btn.textContent="⏸"; status.textContent="tocando"; })
        .catch(()=>{ status.textContent="não foi possível tocar esta rádio agora"; });
    } else { audio.pause(); btn.textContent="▶"; status.textContent="parado"; }
  };
  audio.onerror = ()=>{ status.textContent = "rádio indisponível — tente outra"; };
  window._refreshRadioList = ()=>{ populate(); setStation(); };
}

/* ======================= FOOTER ======================= */
function renderFooterContact(){
  document.getElementById("footPhone").textContent = "📞 " + (state.settings.phone||"—");
  document.getElementById("footEmail").textContent = "✉️ " + (state.settings.email||"—");
}

/* ======================= ADMIN: LOGIN ======================= */
function renderAdminGate(){
  resetShellTheme();
  document.getElementById("mainView").innerHTML = `
  <div class="view-admin"><div class="loginGate">
    <h2>Área restrita</h2>
    <p>Entre com o e-mail e senha de administrador (criados no Firebase Console).</p>
    <input type="email" id="adminEmailInput" placeholder="E-mail" autocomplete="username">
    <input type="password" id="adminPassInput" placeholder="Senha" autocomplete="current-password">
    <div class="err" id="adminErr"></div>
    <button class="adminBtn" style="width:100%" onclick="tryAdminLogin()">Entrar</button>
    ${configLooksEmpty ? `<p style="font-size:12px;color:#E8703A;margin-top:14px">⚠️ O arquivo js/firebase-config.js ainda não foi preenchido com os dados do seu projeto Firebase. Veja o README.md.</p>` : ""}
  </div></div>`;
  document.getElementById("adminPassInput").addEventListener("keydown", e=>{ if(e.key==="Enter") tryAdminLogin(); });
}
window.tryAdminLogin = function(){
  const email = document.getElementById("adminEmailInput").value.trim();
  const pass = document.getElementById("adminPassInput").value;
  signInWithEmailAndPassword(auth, email, pass)
    .catch(err=>{ document.getElementById("adminErr").textContent = "Não foi possível entrar: verifique e-mail e senha."; });
};
onAuthStateChanged(auth, user=>{
  adminUnlocked = !!user;
  if(route==="admin") render();
});

/* ======================= ADMIN: PAINEL ======================= */
function renderAdmin(){
  resetShellTheme();
  document.getElementById("mainView").innerHTML = `<div class="view-admin"><div class="adminWrap">
    <div class="adminHead">
      <h2>Painel administrativo</h2>
      <button class="adminBtnGhost" onclick="signOut(auth)">Sair</button>
    </div>
    <div class="adminTabs">
      <button data-t="produtos" class="${adminTab==='produtos'?'active':''}">Produtos</button>
      <button data-t="categorias" class="${adminTab==='categorias'?'active':''}">Categorias</button>
      <button data-t="notas" class="${adminTab==='notas'?'active':''}">Notas de compradores</button>
      <button data-t="radios" class="${adminTab==='radios'?'active':''}">Rádios</button>
      <button data-t="config" class="${adminTab==='config'?'active':''}">Configurações</button>
    </div>
    <div class="panel" id="adminPanel"></div>
  </div></div>`;
  document.querySelectorAll(".adminTabs button").forEach(b=> b.onclick=()=>{ adminTab=b.dataset.t; renderAdmin(); });
  const panel = document.getElementById("adminPanel");
  if(adminTab==="produtos") panel.innerHTML = adminProdutosHTML();
  if(adminTab==="categorias") panel.innerHTML = adminCategoriasHTML();
  if(adminTab==="notas"){
    panel.innerHTML = `<div class="empty">Carregando notas…</div>`;
    if(!notesLoaded) loadNotesOnce().then(()=>{ if(adminTab==="notas") { panel.innerHTML = adminNotasHTML(); wireNotesForm(); } });
    else { panel.innerHTML = adminNotasHTML(); wireNotesForm(); }
  }
  if(adminTab==="radios") panel.innerHTML = adminRadiosHTML();
  if(adminTab==="config") panel.innerHTML = adminConfigHTML();
  wireAdminTab();
}

function adminProdutosHTML(){
  const catOptions = state.categories.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
  let rows = state.products.map(p=>{
    const cat = getCategory(p.categoryId);
    return `<div class="adminRow">
      <img src="${esc(p.image)||'https://placehold.co/80'}">
      <div class="grow"><b>${esc(p.name)}</b><span>${cat?esc(cat.name):'—'} • ${money(p.price)} • ${esc(p.size)}${cat?cat.unit:''}</span></div>
      <div class="rowBtns">
        <button onclick="editProduct('${p.id}')">Editar</button>
        <button class="danger" onclick="deleteProduct('${p.id}')">Excluir</button>
      </div>
    </div>`;
  }).join("") || `<div class="empty">Nenhum produto cadastrado. ${state.categories.length===0 ? 'Cadastre uma categoria primeiro, ou use "Carregar exemplos" em Configurações.' : ''}</div>`;
  return `
  <form id="prodForm">
    <input type="hidden" id="pf_id">
    <div class="formGrid">
      <div class="field"><label>Categoria</label><select id="pf_cat">${catOptions}</select></div>
      <div class="field"><label>Nome do produto</label><input id="pf_name" placeholder="Ex: Colágeno Hidrolisado"></div>
      <div class="field"><label>Preço (R$)</label><input id="pf_price" type="number" step="0.01" placeholder="79.90"></div>
      <div class="field"><label>Quantidade (ml ou mg)</label><input id="pf_size" placeholder="Ex: 500"></div>
      <div class="field"><label>URL da imagem</label><input id="pf_image" placeholder="https://..."></div>
      <div class="field"><label>URL do vídeo (opcional)</label><input id="pf_video" placeholder="https://..."></div>
    </div>
    <div class="field" style="margin-top:12px"><label>Descrição</label><textarea id="pf_desc" placeholder="Descreva o produto..."></textarea></div>
    <button type="submit" class="adminBtn">Salvar produto</button>
    <button type="button" class="adminBtnGhost" style="margin-top:14px;margin-left:8px" onclick="clearProdForm()">Limpar</button>
  </form>
  <div class="adminList">${rows}</div>`;
}

function wireAdminTab(){
  if(adminTab==="produtos" && document.getElementById("prodForm")){
    document.getElementById("prodForm").onsubmit = async (e)=>{
      e.preventDefault();
      const id = document.getElementById("pf_id").value || uid("p");
      const data = {
        id, categoryId: document.getElementById("pf_cat").value,
        name: document.getElementById("pf_name").value.trim(),
        price: parseFloat(document.getElementById("pf_price").value)||0,
        size: document.getElementById("pf_size").value.trim(),
        image: document.getElementById("pf_image").value.trim(),
        video: document.getElementById("pf_video").value.trim(),
        desc: document.getElementById("pf_desc").value.trim()
      };
      if(!data.name){ toast("Dê um nome ao produto."); return; }
      try{ await saveProductDoc(data); toast("Produto salvo!"); renderAdmin(); }
      catch(err){ toast("Erro ao salvar: " + err.message); }
    };
  }
  if(adminTab==="categorias" && document.getElementById("catForm")){
    document.getElementById("catForm").onsubmit = async (e)=>{
      e.preventDefault();
      const id = document.getElementById("cf_id").value || document.getElementById("cf_name").value.trim().toLowerCase().replace(/[^a-z0-9]+/g,"-");
      const data = {
        id, name: document.getElementById("cf_name").value.trim(),
        unit: document.getElementById("cf_unit").value,
        order: state.categories.length+1,
        theme:{
          bg: document.getElementById("cf_bg").value,
          accent: document.getElementById("cf_accent").value,
          secondary: document.getElementById("cf_secondary").value,
          text: document.getElementById("cf_text").value,
          card: document.getElementById("cf_card").value
        }
      };
      if(!data.name){ toast("Dê um nome à categoria."); return; }
      try{ await saveCategoryDoc(data); toast("Categoria salva!"); renderAdmin(); }
      catch(err){ toast("Erro ao salvar: " + err.message); }
    };
  }
  if(adminTab==="radios" && document.getElementById("radioForm")){
    document.getElementById("radioForm").onsubmit = async (e)=>{
      e.preventDefault();
      const id = document.getElementById("rf_id").value || uid("r");
      const data = { id, label: document.getElementById("rf_label").value.trim(), url: document.getElementById("rf_url").value.trim() };
      if(!data.label){ toast("Dê um nome pra rádio."); return; }
      try{ await saveRadioDoc(data); toast("Rádio salva!"); renderAdmin(); }
      catch(err){ toast("Erro ao salvar: " + err.message); }
    };
  }
  if(adminTab==="config" && document.getElementById("cfgForm")){
    document.getElementById("cfgForm").onsubmit = async (e)=>{
      e.preventDefault();
      const data = {
        phone: document.getElementById("sf_phone").value.trim(),
        email: document.getElementById("sf_email").value.trim(),
        whatsapp: document.getElementById("sf_whats").value.trim(),
        pixKey: document.getElementById("sf_pix").value.trim()
      };
      try{ await saveSettingsDoc(data); toast("Configurações salvas!"); }
      catch(err){ toast("Erro ao salvar: " + err.message); }
    };
    document.getElementById("seedBtn").onclick = async ()=>{
      if(!confirm("Isso cria categorias, produtos e rádios de exemplo (não apaga o que já existe). Continuar?")) return;
      try{ await seedDefaults(); renderAdmin(); }
      catch(err){ toast("Erro: " + err.message); }
    };
  }
}

window.editProduct = function(id){
  const p = state.products.find(x=>x.id===id); if(!p) return;
  document.getElementById("pf_id").value = p.id;
  document.getElementById("pf_cat").value = p.categoryId;
  document.getElementById("pf_name").value = p.name;
  document.getElementById("pf_price").value = p.price;
  document.getElementById("pf_size").value = p.size;
  document.getElementById("pf_image").value = p.image;
  document.getElementById("pf_video").value = p.video;
  document.getElementById("pf_desc").value = p.desc;
  window.scrollTo({top:0, behavior:"smooth"});
};
window.clearProdForm = function(){
  ["pf_id","pf_name","pf_price","pf_size","pf_image","pf_video","pf_desc"].forEach(id=>document.getElementById(id).value="");
};
window.deleteProduct = async function(id){
  if(!confirm("Excluir este produto?")) return;
  try{ await deleteProductDoc(id); toast("Produto excluído."); renderAdmin(); }
  catch(err){ toast("Erro: " + err.message); }
};

function adminCategoriasHTML(){
  let rows = state.categories.map(c=>`
    <div class="adminRow">
      <div style="width:34px;height:34px;border-radius:8px;background:${c.theme.accent}"></div>
      <div class="grow"><b>${esc(c.name)}</b><span>unidade: ${esc(c.unit)}</span></div>
      <div class="rowBtns"><button onclick="editCategory('${c.id}')">Editar tema</button></div>
    </div>`).join("") || `<div class="empty">Nenhuma categoria ainda.</div>`;
  return `
  <p style="font-size:13px;opacity:.65;margin-bottom:14px">Crie novas abas para o site (ex: futuramente "Crochê") e escolha as cores do tema.</p>
  <form id="catForm">
    <input type="hidden" id="cf_id">
    <div class="formGrid">
      <div class="field"><label>Nome da categoria/aba</label><input id="cf_name" placeholder="Ex: Crochê"></div>
      <div class="field"><label>Unidade do produto</label>
        <select id="cf_unit"><option value="un">unidade</option><option value="ml">ml</option><option value="mg">mg</option></select>
      </div>
      <div class="field colorField"><label>Cor de fundo</label><input id="cf_bg" type="color" value="#1A1A18"></div>
      <div class="field colorField"><label>Cor de destaque</label><input id="cf_accent" type="color" value="#C9A961"></div>
      <div class="field colorField"><label>Cor secundária</label><input id="cf_secondary" type="color" value="#6B5B47"></div>
      <div class="field colorField"><label>Cor do texto</label><input id="cf_text" type="color" value="#EDE6D8"></div>
      <div class="field colorField"><label>Cor dos cartões</label><input id="cf_card" type="color" value="#1D1916"></div>
    </div>
    <button type="submit" class="adminBtn">Salvar categoria</button>
  </form>
  <div class="adminList">${rows}</div>`;
}
window.editCategory = function(id){
  const c = state.categories.find(x=>x.id===id); if(!c) return;
  document.getElementById("cf_id").value = c.id;
  document.getElementById("cf_name").value = c.name;
  document.getElementById("cf_unit").value = c.unit;
  document.getElementById("cf_bg").value = c.theme.bg;
  document.getElementById("cf_accent").value = c.theme.accent;
  document.getElementById("cf_secondary").value = c.theme.secondary;
  document.getElementById("cf_text").value = c.theme.text;
  document.getElementById("cf_card").value = c.theme.card;
  window.scrollTo({top:0, behavior:"smooth"});
};

function adminNotasHTML(){
  let rows = state.notes.map(n=>`
    <div class="noteCard"><b>${esc(n.buyer)}</b><div>${esc(n.text)}</div><div class="meta">${esc(n.date)}
      <a href="#" onclick="deleteNote('${n.id}');return false;" style="color:#E8703A;margin-left:10px">excluir</a>
    </div></div>`).join("") || `<div class="empty">Nenhuma nota registrada.</div>`;
  return `
  <p style="font-size:13px;opacity:.65;margin-bottom:14px">Registre observações sobre compradores: combinados de entrega, preferências, pendências, etc.</p>
  <form id="noteForm">
    <div class="formGrid"><div class="field"><label>Comprador</label><input id="nf_buyer" placeholder="Nome"></div></div>
    <div class="field" style="margin-top:12px"><label>Nota</label><textarea id="nf_text" placeholder="Ex: combinou entrega para sexta, pagamento em dinheiro."></textarea></div>
    <button type="submit" class="adminBtn">Adicionar nota</button>
  </form>
  <div>${rows}</div>`;
}
function wireNotesForm(){
  document.getElementById("noteForm").onsubmit = async (e)=>{
    e.preventDefault();
    const note = { id: uid("n"), buyer: document.getElementById("nf_buyer").value.trim(),
      text: document.getElementById("nf_text").value.trim(), date: new Date().toLocaleString("pt-BR"), ts: Date.now() };
    if(!note.buyer){ toast("Informe o nome do comprador."); return; }
    try{ await saveNoteDoc(note); state.notes.unshift(note); toast("Nota adicionada!"); renderAdmin(); }
    catch(err){ toast("Erro: " + err.message); }
  };
}
window.deleteNote = async function(id){
  try{ await deleteNoteDoc(id); state.notes = state.notes.filter(n=>n.id!==id); renderAdmin(); }
  catch(err){ toast("Erro: " + err.message); }
};

function adminRadiosHTML(){
  let rows = state.radioStations.map(r=>`
    <div class="adminRow">
      <div style="width:34px;height:34px;border-radius:50%;background:${r.url?'#4A7A64':'#6B5B47'};display:flex;align-items:center;justify-content:center;font-size:14px;flex:0 0 auto">${r.url?'♪':'—'}</div>
      <div class="grow"><b>${esc(r.label)}</b><span>${r.url ? esc(r.url) : 'sem link cadastrado'}</span></div>
      <div class="rowBtns">
        <button onclick="editRadio('${r.id}')">Editar</button>
        <button class="danger" onclick="deleteRadio('${r.id}')">Excluir</button>
      </div>
    </div>`).join("") || `<div class="empty">Nenhuma rádio cadastrada.</div>`;
  return `
  <p style="font-size:13px;opacity:.75;line-height:1.6;margin-bottom:14px">
    Cole aqui a <b>URL direta do stream de áudio</b>. Como achar: procure no site da rádio um link "para outros
    players" ou "link direto" (comum em SomaFM, Zeno.FM, Radios.com.br). Um link de página comum (ex: YouTube) não funciona.
  </p>
  <form id="radioForm">
    <input type="hidden" id="rf_id">
    <div class="formGrid">
      <div class="field"><label>Nome do gênero/rádio</label><input id="rf_label" placeholder="Ex: Forró & Sertanejo"></div>
      <div class="field"><label>URL direta do stream</label><input id="rf_url" placeholder="https://..."></div>
    </div>
    <button type="submit" class="adminBtn">Salvar rádio</button>
  </form>
  <div class="adminList">${rows}</div>`;
}
window.editRadio = function(id){
  const r = state.radioStations.find(x=>x.id===id); if(!r) return;
  document.getElementById("rf_id").value = r.id;
  document.getElementById("rf_label").value = r.label;
  document.getElementById("rf_url").value = r.url;
  window.scrollTo({top:0, behavior:"smooth"});
};
window.deleteRadio = async function(id){
  if(!confirm("Excluir esta rádio?")) return;
  try{ await deleteRadioDoc(id); toast("Rádio excluída."); renderAdmin(); }
  catch(err){ toast("Erro: " + err.message); }
};

function adminConfigHTML(){
  return `
  <form id="cfgForm">
    <div class="formGrid">
      <div class="field"><label>Telefone de contato</label><input id="sf_phone" value="${esc(state.settings.phone)}"></div>
      <div class="field"><label>E-mail de contato</label><input id="sf_email" value="${esc(state.settings.email)}"></div>
      <div class="field"><label>WhatsApp (só números, com DDI+DDD)</label><input id="sf_whats" value="${esc(state.settings.whatsapp)}"></div>
      <div class="field"><label>Chave Pix</label><input id="sf_pix" value="${esc(state.settings.pixKey)}"></div>
    </div>
    <button type="submit" class="adminBtn">Salvar configurações</button>
  </form>
  <div style="margin-top:26px; border-top:1px solid rgba(255,255,255,.08); padding-top:18px">
    <p style="font-size:13px;opacity:.65;margin-bottom:10px">Site novo, sem produtos ainda? Carregue os exemplos de categorias, produtos e rádios (não apaga nada que já exista).</p>
    <button type="button" class="adminBtnGhost" id="seedBtn">Carregar exemplos</button>
  </div>
  <div style="margin-top:22px; border-top:1px solid rgba(255,255,255,.08); padding-top:18px">
    <p style="font-size:12px;opacity:.55">A senha do admin agora é gerenciada pelo Firebase (Authentication &gt; Users no console), não aqui no site.</p>
  </div>`;
}

/* ======================= RENDER MASTER ======================= */
function render(){
  renderNav();
  renderFooterContact();
  if(route === "admin"){
    if(adminUnlocked) renderAdmin(); else renderAdminGate();
    return;
  }
  if(route === "home"){ renderHome(); return; }
  const cat = getCategory(route);
  if(cat) renderCategory(route); else { route="home"; renderHome(); }
}

/* ======================= INIT ======================= */
window.signOut = ()=> signOut(auth);
watchCollections();
initRadio();
route = location.hash.replace("#/", "") || "home";
render();
