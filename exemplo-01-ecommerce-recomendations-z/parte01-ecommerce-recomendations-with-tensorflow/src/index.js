/**
 * =============================================================================
 * PONTO DE ENTRADA — Sistema de Recomendação E-commerce com TensorFlow.js
 * =============================================================================
 *
 * Este arquivo monta a aplicação no padrão MVC adaptado para o browser:
 * - Services: acesso a dados (usuários, produtos).
 * - Views: atualização do DOM.
 * - Controllers: reagem a eventos e orquestram services + worker.
 *
 * O treino e a predição da rede neural rodam em um Web Worker para não
 * bloquear a UI. Equivalente em C#: separar a lógica pesada em outra thread
 * (Task.Run ou BackgroundWorker) e comunicar por mensagens/canais.
 *
 * Conceito de IA aplicado: Sistema de recomendação baseado em ML (rede neural
 * que aprende a probabilidade "usuário compraria este produto?" a partir de
 * vetores de features normalizados).
 */

// -----------------------------------------------------------------------------
// Imports ES Modules — Em C# seria: using NomeDoProjeto.Controller; etc.
// -----------------------------------------------------------------------------
import { UserController } from './controller/UserController.js';
import { ProductController } from './controller/ProductController.js';
import { ModelController } from './controller/ModelTrainingController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { TFVisorView } from './view/TFVisorView.js';
import { UserService } from './service/UserService.js';
import { ProductService } from './service/ProductService.js';
import { UserView } from './view/UserView.js';
import { ProductView } from './view/ProductView.js';
import { ModelView } from './view/ModelTrainingView.js';
import Events from './events/events.js';
import { WorkerController } from './controller/WorkerController.js';

// -----------------------------------------------------------------------------
// Serviços compartilhados (injeção de dependência simples)
// Em C#: registrar IUserService, IProductService no container e injetar nos controllers.
// -----------------------------------------------------------------------------
const userService = new UserService();
const productService = new ProductService();

// -----------------------------------------------------------------------------
// Views: responsáveis apenas por renderizar dados no DOM
// -----------------------------------------------------------------------------
const userView = new UserView();
const productView = new ProductView();
const modelView = new ModelView();
const tfVisorView = new TFVisorView();

// -----------------------------------------------------------------------------
// Web Worker: thread separada onde roda TensorFlow.js (treino e predição).
// { type: 'module' } permite usar import/export dentro do worker.
// Em C#: análogo a criar um Task em outra thread e trocar dados por
// ConcurrentQueue, Channel ou eventos.
// -----------------------------------------------------------------------------
const mlWorker = new Worker('/src/workers/modelTrainingWorker.js', { type: 'module' });

// -----------------------------------------------------------------------------
// WorkerController: ponte entre a UI e o worker. Escuta eventos (train,
// recommend, progress) e envia mensagens postMessage ao worker.
// init() retorna a instância para podermos chamar triggerTrain/triggerRecommend.
// -----------------------------------------------------------------------------
const w = WorkerController.init({
    worker: mlWorker,
    events: Events
});

// Carrega usuários iniciais (ex.: do data/users.json) e dispara o primeiro treino.
// await no top-level é permitido em ES modules (equivalente a async main em C#).
const users = await userService.getDefaultUsers();
w.triggerTrain(users);

// -----------------------------------------------------------------------------
// Controllers: cada um recebe suas dependências (view, service, events) e
// registra listeners. ModelController e TFVisorController cuidam do painel
// de treino e visualização (tfvis). ProductController e UserController
// cuidam da lista de produtos e da lista de usuários + recomendações.
// -----------------------------------------------------------------------------
ModelController.init({
    modelView,
    userService,
    events: Events,
});

TFVisorController.init({
    tfVisorView,
    events: Events,
});

ProductController.init({
    productView,
    userService,
    productService,
    events: Events,
});

const userController = UserController.init({
    userView,
    userService,
    productService,
    events: Events,
});

// Renderiza a lista de usuários com um usuário padrão para demonstração.
// Esse usuário (ex.: "Josézin da Silva", sem compras) será usado para
// testar recomendações baseadas apenas em idade após o treino.
userController.renderUsers({
    "id": 99,
    "name": "Josézin da Silva",
    "age": 30,
    "purchases": []
});