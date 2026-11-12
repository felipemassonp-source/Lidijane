/* Grava um lead do formulário de materiais gratuitos no Firestore (coleção "leads").
   Carregado sob demanda pelo main.js só quando alguém envia o formulário. */
import { getFirebaseApp, isConfigured, sdkUrl } from "./firebase-config.js";

const FIELDS = [
  "material", "materialTitulo", "nome", "email", "whatsapp", "cidade", "perfil",
  "pagina", "utm_source", "utm_medium", "utm_campaign", "utm_content",
];

export async function saveLead(payload) {
  if (!isConfigured) return { ok: false, reason: "nao-configurado" };
  const app = await getFirebaseApp();
  const { getFirestore, collection, addDoc, serverTimestamp } = await import(sdkUrl("firestore"));
  const data = { status: "novo", consentimento: true, createdAt: serverTimestamp() };
  FIELDS.forEach((k) => { data[k] = String(payload[k] || "").slice(0, 300); });
  // o Firestore só confirma quando o servidor grava; sem internet ele ficaria esperando
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error("tempo-esgotado")), 10000));
  await Promise.race([addDoc(collection(getFirestore(app), "leads"), data), timeout]);
  return { ok: true };
}
