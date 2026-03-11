export class TrackController {
  #trackView;
  #currentUser = null;
  #events;
  #trackService;

  constructor({ productView: trackView, events, productService: trackService }) {
    this.#trackView = trackView;
    this.#trackService = trackService;
    this.#events = events;
    this.init();
  }

  static init(deps) {
    return new TrackController(deps);
  }

  async init() {
    this.setupCallbacks();
    this.setupEventListeners();
    const tracks = await this.#trackService.getTracks();
    this.#trackView.render(tracks, true);
  }

  setupEventListeners() {
    this.#events.onUserSelected((user) => {
      this.#currentUser = user;
      this.#trackView.onUserSelected(user);
      this.#events.dispatchRecommend(user);
    });
    this.#events.onRecommendationsReady(({ recommendations }) => {
      this.#trackView.render(recommendations || [], false);
    });
  }

  setupCallbacks() {
    this.#trackView.registerAddListenedCallback(this.handleAddListened.bind(this));
  }

  handleAddListened(track) {
    const user = this.#currentUser;
    if (user) this.#events.dispatchPurchaseAdded({ user, product: track });
  }
}
