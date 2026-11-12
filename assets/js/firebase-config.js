/* =========================================================
   CONEXÃO COM O FIREBASE — preencher no Antigravity
   ---------------------------------------------------------
   Firebase Console > Configurações do projeto > Seus apps > App da Web > "firebaseConfig".
   Copie os valores para cá. Estes dados NÃO são secretos: o Firebase foi feito para
   eles ficarem no site. Quem protege os leads são as regras em firebase/firestore.rules.
   Passo a passo completo: firebase/COMO-CONECTAR-NO-ANTIGRAVITY.md
   ========================================================= */
export const firebaseConfig = {
  apiKey: "AIzaSyCFIDQYPWswZN0_qREzPuASJhsEFs7hx_w",
  authDomain: "lidijane-30f5c.firebaseapp.com",
  projectId: "lidijane-30f5c",
  storageBucket: "lidijane-30f5c.firebasestorage.app",
  messagingSenderId: "815216547786",
  appId: "1:815216547786:web:fb94ec26a6dbfbdcb46133",
  measurementId: "G-LR0E9LDXJ9",
};

// versão do SDK carregada do CDN oficial do Google
export const FIREBASE_VERSION = "10.12.2";

export const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let appPromise = null;
/** Inicializa o app uma única vez e devolve { app, sdk } */
export function getFirebaseApp() {
  if (!isConfigured) return Promise.reject(new Error("firebase-nao-configurado"));
  if (!appPromise) {
    const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
    appPromise = import(`${base}/firebase-app.js`).then(({ initializeApp, getApps, getApp }) =>
      getApps().length ? getApp() : initializeApp(firebaseConfig)
    );
  }
  return appPromise;
}
export const sdkUrl = (mod) => `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-${mod}.js`;
