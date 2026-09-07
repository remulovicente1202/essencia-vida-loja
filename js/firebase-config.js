// ============================================================
// COLE AQUI a configuração do SEU projeto Firebase.
// Onde pegar: Firebase Console > ⚙️ Configurações do projeto >
// role até "Seus apps" > app Web (</>) > o objeto abaixo aparece pronto.
// Veja o passo a passo completo no README.md
// ============================================================
export const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "COLE_AQUI.firebaseapp.com",
  projectId: "COLE_AQUI",
  storageBucket: "COLE_AQUI.appspot.com",
  messagingSenderId: "COLE_AQUI",
  appId: "COLE_AQUI"
};

// Não tem problema esses dados ficarem "públicos" no código do site.
// Isso é normal em qualquer app Firebase — quem protege de verdade
// os seus dados são as REGRAS do Firestore (arquivo firestore.rules),
// não o segredo dessa config.
