export class ModelController {
  #modelView;
  #userService;
  #events;
  #currentUser = null;
  #alreadyTrained = false;

  constructor({ modelView, userService, events }) {
    this.#modelView = modelView;
    this.#userService = userService;
    this.#events = events;
    this.init();
  }

  static init(deps) {
    return new ModelController(deps);
  }

  async init() {
    this.setupCallbacks();
  }

  setupCallbacks() {
    this.#modelView.registerTrainModelCallback(this.handleTrainModel.bind(this));
    this.#modelView.registerRunRecommendationCallback(this.handleRunRecommendation.bind(this));
    this.#events.onUserSelected((user) => {
      this.#currentUser = user;
      if (this.#alreadyTrained) this.#modelView.enableRecommendButton();
    });
    this.#events.onTrainingComplete(() => {
      this.#alreadyTrained = true;
      if (this.#currentUser) this.#modelView.enableRecommendButton();
    });
    this.#events.onUsersUpdated(async (data) => this.refreshUsersListenedData(data));
    this.#events.onProgressUpdate((progress) => this.#modelView.updateTrainingProgress(progress));
  }

  async handleTrainModel() {
    const users = await this.#userService.getUsers();
    this.#events.dispatchTrainModel(users);
  }

  async handleRunRecommendation() {
    const user = this.#currentUser;
    if (!user) return;
    const updated = await this.#userService.getUserById(user.id);
    this.#events.dispatchRecommend(updated);
  }

  async refreshUsersListenedData({ users }) {
    this.#modelView.renderAllUsersListened(users);
  }
}
