import { UserController } from './controller/UserController.js';
import { TrackController } from './controller/TrackController.js';
import { ModelController } from './controller/ModelTrainingController.js';
import { TFVisorController } from './controller/TFVisorController.js';
import { TFVisorView } from './view/TFVisorView.js';
import { UserService } from './service/UserService.js';
import { TrackService } from './service/TrackService.js';
import { UserView } from './view/UserView.js';
import { TrackView } from './view/TrackView.js';
import { ModelView } from './view/ModelTrainingView.js';
import Events from './events/events.js';
import { WorkerController } from './controller/WorkerController.js';

const userService = new UserService();
const trackService = new TrackService();

const userView = new UserView();
const trackView = new TrackView();
const modelView = new ModelView();
const tfVisorView = new TFVisorView();

const worker = new Worker(new URL('./workers/recommendationWorker.js', import.meta.url), {
  type: 'module',
});

const w = WorkerController.init({ worker, events: Events });

const users = await userService.getDefaultUsers();
w.triggerTrain(users);

ModelController.init({ modelView, userService, events: Events });
TFVisorController.init({ tfVisorView, events: Events });
TrackController.init({
  productView: trackView,
  productService: trackService,
  events: Events,
});

const userController = UserController.init({
  userView,
  userService,
  events: Events,
});

userController.renderUsers({
  id: 99,
  name: 'Novo Ouvinte',
  age: 24,
  listenedTracks: [],
});
