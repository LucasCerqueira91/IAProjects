export class TFVisorController {
  #tfVisorView;
  #events;

  constructor({ tfVisorView, events }) {
    this.#tfVisorView = tfVisorView;
    this.#events = events;
    this.#events.onTFVisLogs((data) => this.#tfVisorView.handleTrainingLog(data));
  }

  static init(deps) {
    return new TFVisorController(deps);
  }
}
