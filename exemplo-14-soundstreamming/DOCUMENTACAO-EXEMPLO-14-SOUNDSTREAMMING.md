# Documentação — Exemplo 14: SoundStreaming (recomendação de músicas por perfil)

Este documento segue a **mesma estrutura didática** da DOCUMENTACAO-GERAL-ESTUDOS.md, aplicada **apenas** ao projeto **exemplo-14-soundstreamming**. Objetivo: entender o projeto do zero, reconhecer o padrão do Exemplo 01 (e-commerce) em outro domínio e ganhar autonomia para reproduzir a ideia em outros contextos.

---

## Índice

1. [Visão geral do projeto](#1-visão-geral-do-projeto)
2. [Mapa da estrutura](#2-mapa-da-estrutura)
3. [Explicação arquivo por arquivo](#3-explicação-arquivo-por-arquivo)
4. [Ordem de construção do projeto](#4-ordem-de-construção-do-projeto)
5. [Padrão mental para pensar este projeto](#5-padrão-mental-para-pensar-este-projeto)
6. [Fluxo de execução](#6-fluxo-de-execução)

---

## 1. Visão geral do projeto

### Objetivo

Simular um **site de streaming de músicas** em que:

- Existem **usuários** que escutam **estilos diferentes** (pop, rock, funk, etc.).
- Cada usuário tem um **histórico de músicas ouvidas** (`listenedTracks`).
- É possível criar um **novo usuário sem nenhum estilo musical** (lista vazia).
- A **API** (no caso, o modelo treinado no Web Worker) **sugere músicas com base no perfil** desse usuário: idade e, quando há histórico, nos gostos aprendidos; quando não há histórico, o modelo usa apenas a **idade** e os padrões aprendidos dos outros usuários para sugerir faixas.

### O que ensina

- **Reutilizar o padrão do Exemplo 01 (e-commerce)** em outro domínio: mesma arquitetura (MVC, eventos, Web Worker, TensorFlow.js), trocando “produtos/compras” por “músicas/escuta”.
- **Cold start:** usuário novo sem histórico é codificado só com **perfil** (idade); o modelo, treinado com os outros usuários, aprende associações (ex.: faixas etárias e gêneros) e sugere músicas para esse perfil.
- **Codificação de itens e usuários:** gênero (one-hot), duração (normalizada), idade; usuário com histórico = média dos vetores das músicas ouvidas; usuário sem histórico = vetor de perfil (idade + zeros).

### Problema que resolve

“Como sugerir músicas para um **novo usuário** que ainda não escutou nada?” Resposta: usar **perfil** (ex.: idade) e um modelo treinado com os demais usuários, que aprende padrões do tipo “usuários dessa idade tendem a gostar desses gêneros/faixas”.

### Conceito principal

- **Dados:** usuários com `listenedTracks` (lista de músicas com id, name, artist, genre); catálogo de `tracks` (id, name, artist, genre, durationMs).
- **Modelo:** classificação binária “ouviu (1) ou não ouviu (0)” por par (usuário, música). Entrada = vetor usuário concatenado com vetor música; saída = score 0–1.
- **Recomendação:** para um usuário (com ou sem histórico), ordenar todas as músicas pelo score previsto e exibir como “recomendações para você”.

### Grande ideia

O mesmo padrão do e-commerce: **treino em Worker** (dados → contexto → encode → rede neural → fit) e **recomendação** (encode usuário → predict para cada música → ordenar). A diferença é o **domínio** (músicas e estilos) e o **cold start** (usuário sem escutas = só perfil).

---

## 2. Mapa da estrutura

```
exemplo-14-soundstreamming/
├── index.html                 # Página única: perfil, treino, catálogo de músicas
├── style.css                  # Estilos (cards, lista, botões)
├── package.json               # type: module, start = browser-sync porta 3001
├── .gitignore
├── data/
│   ├── users.json             # Usuários (id, name, age, listenedTracks[])
│   └── tracks.json            # Catálogo (id, name, artist, genre, durationMs)
├── src/
│   ├── index.js               # Ponto de entrada: services, views, controllers, worker
│   ├── events/
│   │   ├── constants.js       # Nomes dos eventos e do worker
│   │   └── events.js          # Barramento on* / dispatch*
│   ├── view/
│   │   ├── View.js            # Base: loadTemplate, replaceTemplate
│   │   ├── UserView.js        # Select de usuário, idade, lista de “músicas na minha lista”
│   │   ├── TrackView.js       # Cards de músicas e botão “Add to my list”
│   │   ├── ModelTrainingView.js  # Botões Treinar / Ver recomendações, dados de escuta
│   │   ├── TFVisorView.js     # Gráficos tfjs-vis (loss/accuracy)
│   │   └── templates/
│   │       ├── past-listened.html   # Item da lista “músicas na minha lista”
│   │       └── track-card.html     # Card de uma música
│   ├── service/
│   │   ├── UserService.js     # getDefaultUsers, getUsers, getUserById, updateUser, addUser (sessionStorage)
│   │   └── TrackService.js    # getTracks, getTrackById, getTracksByIds
│   ├── controller/
│   │   ├── UserController.js       # Perfil, lista de escutas, adicionar/remover da lista
│   │   ├── TrackController.js      # Listar músicas, “Add to my list”, exibir recomendações
│   │   ├── ModelTrainingController.js  # Treinar modelo, Ver recomendações, progresso
│   │   ├── TFVisorController.js    # Repassar logs do worker para TFVisorView
│   │   └── WorkerController.js     # postMessage train/recommend, onmessage → dispatch eventos
│   └── workers/
│       └── recommendationWorker.js  # makeContext, encodeTrack, encodeUser, treino, recommend
└── DOCUMENTACAO-EXEMPLO-14-SOUNDSTREAMMING.md   # Este arquivo
```

### Papel de cada parte

- **index.html:** layout e IDs usados pelas views (userSelect, userAge, pastListenedList, trainModelBtn, runRecommendationBtn, allUsersListenedList, trackList). Carrega tfjs-vis e `src/index.js` como módulo.
- **data/:** fonte inicial de usuários e músicas; o UserService persiste usuários em `sessionStorage` (incluindo o “Novo Ouvinte” adicionado no arranque).
- **src/events:** mesmo padrão do Exemplo 01: constantes de nomes de eventos e barramento (CustomEvent no document) para desacoplar quem dispara de quem escuta.
- **src/view:** View base para templates; UserView (perfil + lista de escutas); TrackView (catálogo + recomendações); ModelTrainingView (treino e “Ver recomendações”); TFVisorView (gráficos).
- **src/service:** UserService (CRUD em sessionStorage, getDefaultUsers a partir de users.json); TrackService (leitura de tracks.json).
- **src/controller:** orquestram view + service + eventos; WorkerController é a ponte entre a UI e o worker (train/recommend).
- **src/workers/recommendationWorker.js:** toda a lógica de ML (contexto, codificação, treino, recomendação); comunicação só por postMessage/onmessage.

---

## 3. Explicação arquivo por arquivo

### data/users.json

- Array de usuários. Cada um tem `id`, `name`, `age` e `listenedTracks`: array de objetos com `id`, `name`, `artist`, `genre` (espelho dos campos da música). Usado para treino (quem ouviu o quê) e para exibir “músicas na minha lista”.

### data/tracks.json

- Catálogo de músicas: `id`, `name`, `artist`, `genre`, `durationMs`. O worker usa esses campos para montar o contexto (gêneros, duração) e os vetores de cada música.

### src/events/constants.js

- **events:** nomes dos eventos da aplicação (userSelected, usersUpdated, purchaseAdded, purchaseRemoved, modelTrain, trainingComplete, recommendationsReady, recommend, etc.). Aqui “purchase” significa “adicionar à minha lista de escutas”.
- **workerEvents:** nomes das mensagens do worker (trainModel, recommend, trainingComplete, trainingLog, progressUpdate, tfVisData, tfVisLogs). Mantém o contrato entre main thread e worker.

### src/events/events.js

- Classe com métodos estáticos `on*` (registrar listener no document) e `dispatch*` (disparar CustomEvent com detail). Barramento: quem quiser reagir a “treino concluído” ou “recomendações prontas” usa `on*`; quem termina o treino ou recebe resultado do worker chama `dispatch*`.

### src/view/View.js

- **loadTemplate(templatePath):** fetch do HTML do template e retorno como string.
- **replaceTemplate(template, data):** substitui cada `{{key}}` no template por `data[key]`. Usado por UserView e TrackView para montar itens da lista e cards.

### src/view/UserView.js

- Referências a `#userSelect`, `#userAge`, `#pastListenedList`.
- **renderUserOptions(users):** preenche o select com os usuários.
- **renderUserDetails(user):** preenche a idade.
- **renderPastListened(listenedTracks):** renderiza a “músicas na minha lista” com o template past-listened; registra clique no ícone de remover.
- **addPastListened(track):** adiciona um item ao topo da lista (com destaque visual).
- **registerUserSelectCallback / registerListenedRemoveCallback:** permitem ao UserController reagir à troca de usuário e à remoção de uma música da lista.
- **getSelectedUserId():** retorna o id do usuário selecionado no select.

### src/view/TrackView.js

- **render(tracks, disableButtons):** monta os cards de músicas (ou de recomendações) com track-card.html; formata duração (ms → "min:seg"); desabilita/habilita os botões “Add to my list”.
- **onUserSelected(user):** habilita ou desabilita os botões conforme há usuário selecionado.
- **registerAddListenedCallback(callback):** ao clicar em “Add to my list”, chama o callback com a música; o controller dispara purchaseAdded (user + track).

### src/view/ModelTrainingView.js

- Botões “Treinar modelo” e “Ver recomendações”; área “Dados de escuta de todos os usuários” (expandir/colapsar).
- **registerTrainModelCallback / registerRunRecommendationCallback:** chamados ao clicar nos botões.
- **enableRecommendButton():** habilita “Ver recomendações” após o treino.
- **updateTrainingProgress(progress):** durante o treino desabilita o botão e mostra “Training...”; ao progress 100 restaura o botão.
- **renderAllUsersListened(users):** exibe, por usuário, as músicas ouvidas (badges com nome e gênero).

### src/view/TFVisorView.js

- Abre o painel tfjs-vis e, ao receber trainingLog, desenha gráficos de loss e accuracy (por época).

### src/service/UserService.js

- **#storageKey:** `'soundstreamming-users'`.
- **getDefaultUsers():** fetch de `./data/users.json`, grava no sessionStorage e retorna o array.
- **getUsers():** lê do sessionStorage.
- **getUserById(id):** encontra o usuário pelo id.
- **updateUser(user):** atualiza o usuário no array e persiste no sessionStorage.
- **addUser(user):** adiciona um novo usuário (ex.: “Novo Ouvinte” com listenedTracks vazio) no início do array e persiste.

### src/service/TrackService.js

- **getTracks():** fetch de `./data/tracks.json`.
- **getTrackById(id) / getTracksByIds(ids):** filtram o catálogo por id(s).

### src/controller/UserController.js

- **renderUsers(newUserNoHistory):** carrega usuários padrão, adiciona o novo usuário (sem histórico), renderiza o select, configura callbacks e observer de purchaseAdded, e dispara usersUpdated.
- **handleUserSelect(userId):** busca o usuário, dispara userSelected e exibe detalhes + lista de escutas.
- **handleListenedAdded({ user, product: track }):** adiciona a música à lista do usuário, atualiza no UserService, adiciona na view e dispara usersUpdated.
- **handleListenedRemove({ userId, track }):** remove a música da lista do usuário, atualiza storage e view e dispara usersUpdated.
- **displayUserDetails(user):** atualiza idade e lista de escutas na view.

### src/controller/TrackController.js

- **init():** registra listeners (userSelected → atualiza usuário atual e habilita botões; recommendationsReady → renderiza a lista de recomendações), carrega o catálogo e renderiza os cards.
- **handleAddListened(track):** dispara purchaseAdded com o usuário atual e a música (o UserController adiciona ao perfil do usuário).

### src/controller/ModelTrainingController.js

- **handleTrainModel():** obtém todos os usuários e dispara trainModel (WorkerController envia para o worker).
- **handleRunRecommendation():** obtém o usuário atual atualizado (com listenedTracks) e dispara recommend (WorkerController envia para o worker).
- Escuta trainingComplete para habilitar “Ver recomendações” e usersUpdated para atualizar “Dados de escuta de todos os usuários”.

### src/controller/WorkerController.js

- **setupCallbacks():** onTrainModel → alreadyTrained = false, extrai array de usuários do payload e chama triggerTrain(users); onRecommend → se já treinado, chama triggerRecommend(user); onmessage do worker → conforme type (progressUpdate, trainingComplete, trainingLog, recommend) chama o dispatch correspondente.
- **triggerTrain(users):** postMessage({ action: 'train:model', users }).
- **triggerRecommend(user):** postMessage({ action: 'recommend', user }).

### src/workers/recommendationWorker.js

- **makeContext(tracks, users):** monta índices de gêneros, min/max de idade e duração, e “idade média por música” (para personalizar o vetor da música). Define `dimensions` (duração + idade + one-hot de gênero).
- **encodeTrack(track, context):** vetor com duração normalizada (peso), idade média normalizada (peso) e one-hot de gênero (peso). Retorna tensor 1D.
- **encodeUser(user, context):** se tiver listenedTracks, média dos vetores das músicas ouvidas; **senão** (usuário novo): vetor com zeros em duração, idade normalizada e zeros em gêneros. Assim o modelo usa **só o perfil (idade)** para sugerir.
- **createTrainingData(context):** para cada usuário com escutas e cada música, entrada = [vetor usuário | vetor música], label = 1 se ouviu e 0 se não. Retorna xs, ys e inputDimension.
- **configureAndTrain(trainData):** rede 128 → 64 → 32 → 1 (sigmoid), binaryCrossentropy, fit com callbacks que enviam trainingLog (epoch, loss, accuracy).
- **trainModel({ users }):** fetch de tracks, makeContext, cria trackVectors (para recommend), createTrainingData, configureAndTrain, postMessage progress e trainingComplete.
- **recommend({ user }):** encodeUser (com ou sem histórico), para cada música concatena vetor usuário + vetor música, predict, ordena por score e postMessage com recommendations.
- **self.onmessage:** roteia por action para trainModel ou recommend.

### src/index.js

- Instancia UserService, TrackService, UserView, TrackView, ModelView, TFVisorView.
- Cria o Worker com `new URL('./workers/recommendationWorker.js', import.meta.url)` e type module.
- Inicializa WorkerController, chama getDefaultUsers e triggerTrain(users) para treinar com os dados iniciais.
- Inicializa ModelController, TFVisorController, TrackController, UserController.
- Chama userController.renderUsers com o usuário “Novo Ouvinte” (id 99, idade 24, listenedTracks vazio). Esse usuário é o exemplo de **perfil sem histórico**: ao clicar em “Ver recomendações”, o modelo sugere músicas apenas com base na idade e no que aprendeu dos outros.

---

## 4. Ordem de construção do projeto

1. **Definir objetivo:** site de músicas com recomendação; novo usuário sem escutas recebe sugestões por perfil.
2. **Definir dados:** users.json (id, name, age, listenedTracks[]) e tracks.json (id, name, artist, genre, durationMs); serviços que os carregam.
3. **Definir eventos:** mesmos nomes do Exemplo 01 (purchaseAdded = “adicionar à minha lista”; recommendationsReady = lista ordenada por score); constants.js e events.js.
4. **Criar estrutura de pastas:** controller, service, view, view/templates, events, workers.
5. **View base e templates:** View.js (loadTemplate, replaceTemplate); past-listened.html e track-card.html.
6. **UserView e TrackView:** renderizar select, idade, lista de escutas, cards de músicas, botões e callbacks (seleção, adicionar, remover).
7. **UserService e TrackService:** fetch, sessionStorage para usuários; leitura de tracks.
8. **UserController e TrackController:** ligar views, services e eventos; tratar adicionar/remover da lista e exibir recomendações.
9. **Worker:** makeContext (tracks + users, gêneros, durações, idades), encodeTrack, encodeUser (com e sem listenedTracks), createTrainingData, configureAndTrain, trainModel, recommend; postMessage/onmessage.
10. **WorkerController:** traduzir mensagens do worker em eventos (trainingComplete, recommendationsReady, etc.); triggerTrain e triggerRecommend.
11. **ModelTrainingView e ModelTrainingController:** botões Treinar e Ver recomendações; progresso; lista “Dados de escuta de todos os usuários”.
12. **TFVisorView e TFVisorController:** opcional; gráficos de treino.
13. **index.js:** montar todas as dependências, criar worker, iniciar treino com getDefaultUsers + triggerTrain, renderizar usuário “Novo Ouvinte”.
14. **index.html e style.css:** layout e IDs corretos para as views.

---

## 5. Padrão mental para pensar este projeto

- **Perguntas:** Quem são os “itens”? As músicas. Quem são os “usuários”? Pessoas com lista de músicas ouvidas. O que é “cold start”? Usuário sem lista → codificar só perfil (idade). O que o modelo prevê? P(ouviu | usuário, música). Como sugerir? Ordenar músicas pelo score e exibir.
- **Decomposição:** (1) Dados (users + tracks) → (2) Contexto (gêneros, durações, idades) → (3) Codificação (track = duração + gênero + idade média; user = média das ouvidas ou só idade) → (4) Treino (pares user+track, label 0/1) → (5) Recomendação (encode user, predict para cada track, ordenar).
- **Reconhecer em outro contexto:** Qualquer “recomendar itens para usuário” com “novo usuário sem histórico” segue o mesmo padrão: itens e usuários codificados; usuário sem histórico = vetor de perfil (ex.: idade, região); modelo treinado com os que têm histórico; recommend = ordenar itens por score.

---

## 6. Fluxo de execução

```
Browser carrega index.html
  → Executa src/index.js (módulo)
  → Cria services, views, Worker (recommendationWorker.js), WorkerController
  → userService.getDefaultUsers() → fetch users.json → sessionStorage
  → w.triggerTrain(users) → worker.postMessage({ action: 'train:model', users })

Worker (recommendationWorker.js):
  → trainModel(users) → fetch tracks → makeContext(tracks, users)
  → createTrainingData → configureAndTrain (rede 128→64→32→1, fit)
  → postMessage progressUpdate, trainingLog (epoch, loss, acc), trainingComplete

WorkerController.onmessage:
  → trainingComplete → dispatchTrainingComplete → ModelTrainingView habilita "Ver recomendações"

Usuário seleciona "Novo Ouvinte" (sem músicas na lista) e clica "Ver recomendações"
  → ModelTrainingController.handleRunRecommendation → dispatchRecommend(updatedUser)
  → WorkerController.triggerRecommend(user) → worker.postMessage({ action: 'recommend', user })

Worker:
  → recommend({ user }) → encodeUser(user, context) → vetor só com idade (listenedTracks vazio)
  → para cada música: [userVec | trackVec] → model.predict → scores
  → ordena por score → postMessage({ type: 'recommend', user, recommendations })

WorkerController → dispatchRecommendationsReady → TrackController/View renderizam a lista ordenada

Entrada: usuários (com ou sem listenedTracks) e catálogo de músicas.
Saída: lista de músicas ordenada por score de recomendação (para o usuário selecionado).
```

---

*Documentação alinhada ao projeto exemplo-14-soundstreamming. Para o padrão geral e comparação com o Exemplo 01, consulte a DOCUMENTACAO-GERAL-ESTUDOS.md na raiz do repositório.*
