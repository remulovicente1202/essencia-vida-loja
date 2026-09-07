# Essência & Vida — Loja

Site pronto com: página inicial, aba Vitaminas, aba Perfumes, painel admin protegido por login,
pagamento por Pix ou combinado no WhatsApp, e rádio ambiente. Os dados (produtos, categorias,
notas, rádios, configurações) ficam salvos no **Firebase** — não somem nunca, e qualquer alteração
feita no painel admin aparece na hora pra quem estiver no site, em qualquer aparelho.

Antes de publicar, siga as duas partes abaixo **nessa ordem**: primeiro o Firebase, depois o GitHub/Vercel.

---

## Parte 1 — Criar o banco de dados (Firebase)

Gratuito, leva uns 10 minutos.

1. Acesse **console.firebase.google.com** e entre com sua conta Google.
2. Clique em **"Adicionar projeto"**, dê um nome (ex: `essencia-vida`). Pode desativar o Google
   Analytics quando perguntar — não é necessário. Clique em **"Criar projeto"**.
3. No menu à esquerda, vá em **Compilação > Firestore Database** → clique em **"Criar banco de
   dados"** → escolha **"Iniciar no modo de produção"** → escolha uma região (qualquer uma do
   Brasil ou EUA serve) → **Ativar**.
4. Ainda no Firestore, clique na aba **"Regras"** no topo. Apague o que estiver lá e cole o
   conteúdo do arquivo `firestore.rules` (está nessa mesma pasta). Clique em **"Publicar"**.
5. No menu à esquerda, vá em **Compilação > Authentication** → **"Vamos começar"** → na aba
   **"Sign-in method"**, clique em **"E-mail/senha"** → ative a primeira opção → **Salvar**.
6. Vá na aba **"Users"** (ao lado de "Sign-in method") → **"Add user"** → digite o e-mail e a
   senha que **você** vai usar para entrar no painel admin do site → **Add user**.
   > Esse é o único login que existe — não tem cadastro público. Só quem tiver esse e-mail/senha
   > entra no admin.
7. Clique na engrenagem ⚙️ no topo do menu esquerdo → **"Configurações do projeto"**. Role até
   **"Seus apps"** → clique no ícone **`</>`** (Web) → dê um apelido (ex: "site") → **"Registrar
   app"**. Vai aparecer um bloco de código com `const firebaseConfig = {...}`.
8. Copie esse objeto e cole dentro do arquivo `js/firebase-config.js`, substituindo os campos que
   estão escritos `COLE_AQUI`. Salve o arquivo.

Pronto — o banco de dados está criado e conectado ao site.

---

## Parte 2 — Subir para o GitHub

1. Crie uma conta em **github.com**, se ainda não tiver.
2. Clique em **"New repository"**. Dê um nome (ex: `essencia-vida-loja`), marque Público ou
   Privado (os dois funcionam com o Vercel), e clique em **"Create repository"**.
3. Na página do repositório recém-criado, clique em **"uploading an existing file"** (ou
   **Add file > Upload files**).
4. Arraste **todos os arquivos e pastas** desse projeto (`index.html`, a pasta `css`, a pasta
   `js`, o `firestore.rules`, este `README.md`) — mantendo a mesma estrutura de pastas. Role para
   baixo e clique em **"Commit changes"**.

---

## Parte 3 — Publicar com Vercel

1. Acesse **vercel.com** → **"Sign Up"** → **"Continue with GitHub"**.
2. No painel do Vercel, clique em **"Add New..." → "Project"**.
3. Encontre `essencia-vida-loja` na lista dos seus repositórios → **"Import"**.
4. É um site estático simples — não precisa mexer em nada nas configurações de build. Clique em
   **"Deploy"**.
5. Em menos de 1 minuto aparece o link do site, tipo `essencia-vida-loja.vercel.app`. Esse é o
   link definitivo pra compartilhar.

A partir daqui, toda vez que você editar um arquivo direto no GitHub (ou fizer upload de um novo),
o Vercel detecta sozinho e republica o site em segundos.

---

## Como usar no dia a dia

- **Acessar o admin:** abra o site, clique no ponto discreto no canto superior direito do menu
  (ou vá direto em `.../#/admin`), entre com o e-mail/senha criados no passo 6 da Parte 1.
- **Primeira vez, sem produtos ainda:** entre no admin → aba **Configurações** → botão
  **"Carregar exemplos"** — isso cria as categorias Vitaminas/Perfumes, um produto de exemplo em
  cada uma, e as rádios padrão. Depois é só editar/excluir/adicionar à vontade.
- **Trocar a senha do admin:** não é mais no site — vá no Firebase Console > Authentication >
  Users > clique nos três pontinhos ao lado do seu usuário.
- **Adicionar mais um administrador** (por exemplo, se seu amigo também for mexer): Authentication
  > Users > Add user, com o e-mail dele.

## Por que isso é seguro?

- Qualquer pessoa consegue **ler** os produtos (precisa, pra loja aparecer pra todo mundo), mas
  só quem estiver **logado** consegue **escrever/editar** — isso é garantido pelas regras do
  Firestore (`firestore.rules`), não por senha escondida no código.
- O GitHub guarda o histórico de tudo: se algo quebrar, dá pra voltar para uma versão anterior do
  código a qualquer momento.
- Os dados (produtos, notas) ficam no Firebase, não no GitHub — mesmo se você apagar o repositório
  do GitHub por engano, os dados continuam salvos lá.

## Limites do plano gratuito do Firebase

Mais que suficiente para uma loja pequena: 50 mil leituras e 20 mil escritas por dia, 1 GB de
armazenamento. Só vale ficar de olho se o site crescer muito.
