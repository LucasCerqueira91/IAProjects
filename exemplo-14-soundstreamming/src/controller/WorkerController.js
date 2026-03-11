import { workerEvents } from '../events/constants.js';

export class WorkerController {
  #worker;
  #events;
  #alreadyTrained = false;

  constructor({ worker, events }) {
    this.#worker = worker;
    this.#events = events;
    this.init();
  }

  static init(deps) {
    return new WorkerController(deps);
  }

  init() {
    this.setupCallbacks();
  }

  setupCallbacks() {
    this.#events.onTrainModel((data) => {
      this.#alreadyTrained = false;
      const users = Array.isArray(data) ? data : data?.users ?? [];
      this.triggerTrain(users);
    });
    this.#events.onTrainingComplete(() => (this.#alreadyTrained = true));
    this.#events.onRecommend((data) => {
      if (!this.#alreadyTrained) return;
      const user = data?.user ?? data;
      if (user) this.triggerRecommend(user);
    });

    this.#worker.onmessage = (event) => {
      if (event.data.type === workerEvents.progressUpdate) {
        this.#events.dispatchProgressUpdate(event.data.progress);
      }
      if (event.data.type === workerEvents.trainingComplete) {
        this.#events.dispatchTrainingComplete(event.data);
      }
      if (event.data.type === workerEvents.tfVisData) {
        this.#events.dispatchTFVisorData(event.data.data);
      }
      if (event.data.type === workerEvents.trainingLog) {
        this.#events.dispatchTFVisLogs(event.data);
      }
      if (event.data.type === workerEvents.recommend) {
        this.#events.dispatchRecommendationsReady(event.data);
      }
    };
  }

  triggerTrain(users) {
    this.#worker.postMessage({ action: workerEvents.trainModel, users: users || [] });
  }

  triggerRecommend(user) {
    this.#worker.postMessage({ action: workerEvents.recommend, user });
  }
}
