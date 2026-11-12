/* =========================================================
   PAINEL DE LEADS — área restrita (admin.html)
   Login pelo Firebase Auth (Google ou e-mail/senha).
   Quem pode ver os leads é decidido pelas regras do Firestore
   (firebase/firestore.rules), não por este arquivo.
   ========================================================= */
import { getFirebaseApp, isConfigured, sdkUrl } from "./firebase-config.js";

/* ---------- Etapas do Kanban (edite aqui) ---------- */
const STAGES = [
  { id: "novo",        title: "Novo lead",        color: "#E68A2E" },
  { id: "em_contato",  title: "Em contato",       color: "#44AD9F" },
  { id: "interessado", title: "Interessado",      color: "#8B7FB8" },
  { id: "cliente",     title: "Cliente",          color: "#1E6B58" },
  { id: "arquivado",   title: "Arquivado",        color: "#858F88" },
];
const MATERIAIS = {
  "checklist-implementacao": "Checklist de implementação da CAA",
  "prancha-vocabulario": "Prancha de vocabulário essencial",
  "ebook-erros-adesao": "E-book: Erros que travam a adesão",
};
const PERFIS = ["Fonoaudióloga", "Mãe / pai", "Professor(a)", "Outro profissional"];

/* ---------- utilidades ---------- */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const stageOf = (l) => (STAGES.some((s) => s.id === l.status) ? l.status : "novo");
const fmtDate = (d, withYear) => d ? d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", ...(withYear ? { year: "numeric" } : {}), hour: "2-digit", minute: "2-digit" }) : "—";
const digits = (s) => String(s || "").replace(/\D/g, "");
const waLink = (l) => {
  let n = digits(l.whatsapp);
  if (n && !n.startsWith("55")) n = "55" + n;
  const titulo = l.materialTitulo || MATERIAIS[l.material] || "material";
  const msg = `Olá, ${(l.nome || "").split(" ")[0]}! Aqui é a Lidijane Araújo. Vi que você baixou "${titulo}" no meu site. Posso te ajudar com alguma dúvida?`;
  return `https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
};
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};
let toastT;
const toast = (msg) => {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 3200);
};
const icon = {
  wa: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
};

/* ---------- estado ---------- */
const state = {
  leads: [],
  loaded: false,
  view: store.get("adm-view", "kanban") === "lista" ? "lista" : "kanban",
  f: { busca: "", material: "", perfil: "", status: "" },
};
let backend = null; // { update(id, patch), remove(id), logout() }
let panelReady = false;

/* ---------- Firebase ---------- */
async function startFirebase() {
  const app = await getFirebaseApp();
  const A = await import(sdkUrl("auth"));
  const F = await import(sdkUrl("firestore"));
  const auth = A.getAuth(app), db = F.getFirestore(app);
  let unsub = null;

  $("#btn-google").onclick = async () => {
    try { await A.signInWithPopup(auth, new A.GoogleAuthProvider()); }
    catch (e) { loginError(e); }
  };

  backend = {
    update: (id, patch) => F.updateDoc(F.doc(db, "leads", id), patch),
    remove: (id) => F.deleteDoc(F.doc(db, "leads", id)),
    logout: () => A.signOut(auth),
  };

  A.onAuthStateChanged(auth, (user) => {
    if (unsub) { unsub(); unsub = null; }
    if (!user) { state.leads = []; state.loaded = false; return showLogin(); }
    showPanel(user.email);
    const q = F.query(F.collection(db, "leads"), F.orderBy("createdAt", "desc"));
    // tempo real: lead novo aparece sozinho, sem recarregar
    unsub = F.onSnapshot(q, (snap) => {
      state.leads = snap.docs.map((d) => normalize(d.id, d.data()));
      state.loaded = true;
      render();
    }, async (err) => {
      console.error(err);
      if (err.code === "permission-denied") {
        await A.signOut(auth);
        showLogin({ msg: `O e-mail ${user.email} não tem acesso a este painel. Peça para incluir o seu e-mail nas regras do Firebase.` });
      } else {
        stateMsg("Não consegui buscar os leads agora. Confira a internet e recarregue a página.");
      }
    });
  });
}

function normalize(id, d) {
  const c = d.createdAt;
  return { id, ...d, createdAt: c?.toDate ? c.toDate() : c ? new Date(c) : null };
}

function loginError(e) {
  console.error(e);
  const map = {
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/invalid-email": "Confira o e-mail digitado.",
    "auth/too-many-requests": "Muitas tentativas. Espere alguns minutos e tente de novo.",
    "auth/popup-blocked": "O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente de novo.",
    "auth/unauthorized-domain": "Este endereço do site ainda não foi autorizado no Firebase (Authentication > Configurações > Domínios autorizados).",
    "auth/operation-not-allowed": "Este tipo de login ainda não foi ativado no Firebase (Authentication > Método de login).",
  };
  if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") return;
  loginMsg(map[e.code] || "Não foi possível entrar. Tente novamente.");
}

/* ---------- Demonstração ---------- */
function startDemo() {
  const nomes = ["Ana Paula Ribeiro", "Juliana Costa", "Marcos Vieira", "Fernanda Lima", "Patrícia Souza", "Renata Alves", "Carla Mendes", "Beatriz Rocha", "Thiago Martins", "Luciana Freitas"];
  const cidades = ["São Paulo", "Natal", "Recife", "Campinas", "", "Fortaleza", "Belo Horizonte", "", "Curitiba", "Salvador"];
  const mats = Object.keys(MATERIAIS);
  const now = Date.now();
  state.leads = nomes.map((nome, i) => ({
    id: "demo" + i,
    nome,
    email: nome.split(" ")[0].toLowerCase() + "@exemplo.com",
    whatsapp: `(11) 9${String(8000 + i * 137).padStart(4, "0")}-${String(1000 + i * 731).slice(0, 4)}`,
    cidade: cidades[i],
    perfil: PERFIS[i % 4],
    material: mats[i % 3],
    materialTitulo: MATERIAIS[mats[i % 3]],
    status: STAGES[[0, 0, 0, 1, 1, 2, 0, 3, 4, 1][i]].id,
    utm_source: i % 3 === 0 ? "instagram" : "",
    createdAt: new Date(now - i * 26 * 3600e3),
  }));
  state.loaded = true;
  backend = {
    update: async (id, patch) => {},
    remove: async (id) => {},
    logout: async () => { location.href = "admin.html"; },
  };
  $("#demo-banner").hidden = false;
  showPanel("demonstração");
  render();
}

/* =========================================================
   TELAS
   ========================================================= */
function showLogin({ setup = false, msg = "" } = {}) {
  $("#view-panel").hidden = true;
  $("#view-login").hidden = false;
  $("#login-forms").hidden = setup;
  $("#login-setup").hidden = !setup;
  if (msg) loginMsg(msg); else $("#login-msg").hidden = true;
}
function loginMsg(msg, kind) {
  const m = $("#login-msg");
  m.textContent = msg; m.hidden = false;
  m.classList.toggle("adm-alert--ok", kind === "ok");
}

function showPanel(who) {
  $("#view-login").hidden = true;
  $("#view-panel").hidden = false;
  $("#who").textContent = who;
  if (panelReady) return;
  panelReady = true;

  // filtros
  const addOpts = (sel, items) => items.forEach(([v, t]) => sel.insertAdjacentHTML("beforeend", `<option value="${esc(v)}">${esc(t)}</option>`));
  addOpts($("#f-material"), Object.entries(MATERIAIS));
  addOpts($("#f-perfil"), PERFIS.map((p) => [p, p]));
  addOpts($("#f-status"), STAGES.map((s) => [s.id, s.title]));
  $("#f-busca").addEventListener("input", (e) => { state.f.busca = e.target.value; render(); });
  ["material", "perfil", "status"].forEach((k) => $("#f-" + k).addEventListener("change", (e) => { state.f[k] = e.target.value; render(); }));

  $$("[data-view]").forEach((b) => b.addEventListener("click", () => {
    state.view = b.dataset.view; store.set("adm-view", state.view); render();
  }));
  $("#btn-export").addEventListener("click", exportCSV);
  $("#btn-logout").addEventListener("click", () => backend.logout());

  // ações dos cards e da lista (delegação)
  const main = $(".adm-main");
  main.addEventListener("change", (e) => {
    const sel = e.target.closest("select[data-status-of]");
    if (sel) setStatus(sel.dataset.statusOf, sel.value);
  });
  main.addEventListener("click", (e) => {
    const mv = e.target.closest("[data-move]");
    if (mv) {
      const [id, dir] = mv.dataset.move.split("|");
      const lead = state.leads.find((l) => l.id === id);
      const i = STAGES.findIndex((s) => s.id === stageOf(lead)) + +dir;
      if (STAGES[i]) setStatus(id, STAGES[i].id);
    }
    const del = e.target.closest("[data-del]");
    if (del) removeLead(del.dataset.del);
  });

  // arrastar e soltar entre colunas
  const board = $("#board");
  let dragId = null;
  board.addEventListener("dragstart", (e) => {
    const card = e.target.closest(".adm-card");
    if (!card) return;
    dragId = card.dataset.id;
    e.dataTransfer.setData("text/plain", dragId);
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => card.classList.add("is-dragging"));
  });
  board.addEventListener("dragend", () => {
    dragId = null;
    $$(".is-dragging, .is-over", board).forEach((el) => el.classList.remove("is-dragging", "is-over"));
  });
  board.addEventListener("dragover", (e) => {
    const col = e.target.closest(".adm-col");
    if (!col || !dragId) return;
    e.preventDefault();
    $$(".adm-col.is-over", board).forEach((c) => c !== col && c.classList.remove("is-over"));
    col.classList.add("is-over");
  });
  board.addEventListener("drop", (e) => {
    const col = e.target.closest(".adm-col");
    if (!col) return;
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || dragId;
    col.classList.remove("is-over");
    if (id) setStatus(id, col.dataset.stage);
  });
}

/* =========================================================
   AÇÕES
   ========================================================= */
async function setStatus(id, status) {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead || stageOf(lead) === status) return;
  const before = lead.status;
  lead.status = status;
  render();
  try { await backend.update(id, { status }); }
  catch (e) { console.error(e); lead.status = before; render(); toast("Não consegui salvar a mudança. Tente de novo."); }
}

async function removeLead(id) {
  const lead = state.leads.find((l) => l.id === id);
  if (!lead || !confirm(`Excluir o lead "${lead.nome || "sem nome"}"? Isso não pode ser desfeito.`)) return;
  const before = state.leads;
  state.leads = state.leads.filter((l) => l.id !== id);
  render();
  try { await backend.remove(id); toast("Lead excluído."); }
  catch (e) { console.error(e); state.leads = before; render(); toast("Não consegui excluir. Tente de novo."); }
}

function filtered({ ignoreStatus = false } = {}) {
  const q = state.f.busca.trim().toLowerCase();
  const qd = digits(q);
  return state.leads.filter((l) => {
    if (state.f.material && l.material !== state.f.material) return false;
    if (state.f.perfil && l.perfil !== state.f.perfil) return false;
    if (!ignoreStatus && state.f.status && stageOf(l) !== state.f.status) return false;
    if (!q) return true;
    return [l.nome, l.email, l.cidade].some((v) => String(v || "").toLowerCase().includes(q))
      || (qd.length >= 3 && digits(l.whatsapp).includes(qd));
  });
}

function exportCSV() {
  const rows = filtered();
  if (!rows.length) return toast("Nenhum lead para baixar com os filtros atuais.");
  const head = ["Data", "Nome", "E-mail", "WhatsApp", "Cidade", "Perfil", "Material", "Etapa", "Origem (utm_source)", "Campanha (utm_campaign)", "Página"];
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((l) => [
    fmtDate(l.createdAt, true), l.nome, l.email, l.whatsapp, l.cidade, l.perfil,
    l.materialTitulo || MATERIAIS[l.material] || l.material,
    STAGES.find((s) => s.id === stageOf(l)).title, l.utm_source, l.utm_campaign, l.pagina,
  ].map(cell).join(";"));
  // ";" e BOM: o Excel em português abre com acentos e colunas certas
  const blob = new Blob(["﻿" + [head.map(cell).join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `leads-lidijane-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(`${rows.length} lead(s) baixado(s).`);
}

/* =========================================================
   RENDERIZAÇÃO
   ========================================================= */
function stateMsg(t) { const m = $("#state-msg"); m.textContent = t; m.hidden = !t; }

function render() {
  $$("[data-view]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.view === state.view)));
  // no Kanban as colunas já são as etapas: o filtro de etapa só vale na lista
  $("#f-status").hidden = state.view === "kanban";
  renderMetrics();

  const board = $("#board"), list = $("#list");
  if (!state.loaded) { board.hidden = list.hidden = true; return stateMsg("Carregando leads…"); }
  if (!state.leads.length) {
    board.hidden = list.hidden = true;
    return stateMsg("Ainda não chegou nenhum lead. Assim que alguém baixar um material pelo site, ele aparece aqui na hora.");
  }
  stateMsg("");
  board.hidden = state.view !== "kanban";
  list.hidden = state.view !== "lista";
  state.view === "kanban" ? renderBoard() : renderList();
}

function renderMetrics() {
  const L = state.leads, week = Date.now() - 7 * 864e5;
  const m = [
    ["Total de leads", L.length],
    ["Últimos 7 dias", L.filter((l) => l.createdAt && l.createdAt.getTime() >= week).length],
    ["Aguardando contato", L.filter((l) => stageOf(l) === "novo").length],
    ["Clientes", L.filter((l) => stageOf(l) === "cliente").length],
  ];
  $("#metrics").innerHTML = m.map(([t, v]) => `<div class="adm-metric"><span>${t}</span><b>${v}</b></div>`).join("");
}

const statusSelect = (l) => `<select data-status-of="${esc(l.id)}" aria-label="Etapa de ${esc(l.nome)}">${
  STAGES.map((s) => `<option value="${s.id}"${s.id === stageOf(l) ? " selected" : ""}>${esc(s.title)}</option>`).join("")}</select>`;

function renderBoard() {
  const leads = filtered({ ignoreStatus: true });
  $("#board").innerHTML = STAGES.map((s, i) => {
    const items = leads.filter((l) => stageOf(l) === s.id);
    return `<div class="adm-col" data-stage="${s.id}" style="--stage:${s.color}">
      <div class="adm-col__head"><span class="adm-dot"></span><h2>${esc(s.title)}</h2><span class="adm-count">${items.length}</span></div>
      <div class="adm-col__body">${items.length ? items.map((l) => card(l, i)).join("") : `<p class="adm-empty">Arraste um lead para cá</p>`}</div>
    </div>`;
  }).join("");
}

function card(l, i) {
  const mat = l.materialTitulo || MATERIAIS[l.material] || "";
  return `<article class="adm-card" draggable="true" data-id="${esc(l.id)}">
    <div class="adm-card__top">
      <span class="adm-tag">${esc(l.perfil || "Sem perfil")}</span>
      <button type="button" class="adm-icon" data-del="${esc(l.id)}" title="Excluir lead" aria-label="Excluir ${esc(l.nome)}">${icon.trash}</button>
    </div>
    <h3>${esc(l.nome || "Sem nome")}</h3>
    ${mat ? `<p class="adm-card__mat">${esc(mat)}</p>` : ""}
    <ul class="adm-card__info">
      <li>${esc(l.whatsapp || "—")}</li>
      <li>${esc(l.email || "—")}</li>
      ${l.cidade ? `<li>${esc(l.cidade)}</li>` : ""}
    </ul>
    <a class="adm-btn adm-btn--wa adm-btn--sm" href="${waLink(l)}" target="_blank" rel="noopener">${icon.wa}Chamar no WhatsApp</a>
    <div class="adm-card__move">
      <button type="button" class="adm-icon" data-move="${esc(l.id)}|-1" ${i === 0 ? "disabled" : ""} aria-label="Voltar etapa">${icon.left}</button>
      ${statusSelect(l)}
      <button type="button" class="adm-icon" data-move="${esc(l.id)}|1" ${i === STAGES.length - 1 ? "disabled" : ""} aria-label="Avançar etapa">${icon.right}</button>
    </div>
    <footer class="adm-card__foot"><span>${fmtDate(l.createdAt)}</span>${l.utm_source ? `<span class="adm-src">${esc(l.utm_source)}</span>` : ""}</footer>
  </article>`;
}

function renderList() {
  const leads = filtered();
  if (!leads.length) { $("#list").innerHTML = `<p class="adm-state">Nenhum lead com esses filtros.</p>`; return; }
  $("#list").innerHTML = `<p class="adm-list__count">${leads.length} lead(s)</p>
  <div class="adm-table-wrap"><table class="adm-table">
    <thead><tr><th>Data</th><th>Nome</th><th>Contato</th><th>Perfil</th><th>Material</th><th>Etapa</th><th><span class="sr">Ações</span></th></tr></thead>
    <tbody>${leads.map((l) => `<tr>
      <td class="nowrap">${fmtDate(l.createdAt, true)}</td>
      <td><b>${esc(l.nome || "Sem nome")}</b>${l.cidade ? `<small>${esc(l.cidade)}</small>` : ""}</td>
      <td>${esc(l.whatsapp || "—")}<small>${esc(l.email || "")}</small></td>
      <td>${esc(l.perfil || "—")}</td>
      <td>${esc(l.materialTitulo || MATERIAIS[l.material] || "—")}</td>
      <td>${statusSelect(l)}</td>
      <td class="nowrap"><a class="adm-icon adm-icon--wa" href="${waLink(l)}" target="_blank" rel="noopener" title="Chamar no WhatsApp" aria-label="Chamar ${esc(l.nome)} no WhatsApp">${icon.wa}</a><button type="button" class="adm-icon" data-del="${esc(l.id)}" title="Excluir lead" aria-label="Excluir ${esc(l.nome)}">${icon.trash}</button></td>
    </tr>`).join("")}</tbody>
  </table></div>`;
}

/* =========================================================
   INÍCIO (no fim do arquivo: tudo acima já está definido)
   ========================================================= */
if (!isConfigured) showLogin({ setup: true });
else startFirebase().catch((e) => {
  console.error(e);
  showLogin({ msg: "Não foi possível carregar o login. Confira a internet e recarregue a página." });
});
