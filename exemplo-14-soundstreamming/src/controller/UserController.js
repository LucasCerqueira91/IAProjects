export class UserController {
  #userService;
  #userView;
  #events;

  constructor({ userView, userService, events }) {
    this.#userView = userView;
    this.#userService = userService;
    this.#events = events;
  }

  static init(deps) {
    return new UserController(deps);
  }

  async renderUsers(newUserNoHistory) {
    const users = await this.#userService.getDefaultUsers();
    this.#userService.addUser(newUserNoHistory);
    const all = [newUserNoHistory, ...users];
    this.#userView.renderUserOptions(all);
    this.setupCallbacks();
    this.setupListenedObserver();
    this.#events.dispatchUsersUpdated({ users: all });
  }

  setupCallbacks() {
    this.#userView.registerUserSelectCallback(this.handleUserSelect.bind(this));
    this.#userView.registerListenedRemoveCallback(this.handleListenedRemove.bind(this));
  }

  setupListenedObserver() {
    this.#events.onPurchaseAdded(async (data) => this.handleListenedAdded(data));
  }

  async handleUserSelect(userId) {
    const user = await this.#userService.getUserById(userId);
    this.#events.dispatchUserSelected(user);
    this.displayUserDetails(user);
  }

  async handleListenedAdded({ user, product: track }) {
    const updated = await this.#userService.getUserById(user.id);
    if (!updated.listenedTracks) updated.listenedTracks = [];
    updated.listenedTracks.push({ ...track });
    await this.#userService.updateUser(updated);
    this.#userView.addPastListened(updated.listenedTracks[updated.listenedTracks.length - 1]);
    this.#events.dispatchUsersUpdated({ users: await this.#userService.getUsers() });
  }

  async handleListenedRemove({ userId, track }) {
    const user = await this.#userService.getUserById(userId);
    if (!user) return;
    const idx = user.listenedTracks?.findIndex((t) => t.id === track.id);
    if (idx === -1) return;
    user.listenedTracks.splice(idx, 1);
    await this.#userService.updateUser(user);
    this.#userView.renderPastListened(user.listenedTracks || []);
    this.#events.dispatchUsersUpdated({ users: await this.#userService.getUsers() });
  }

  displayUserDetails(user) {
    this.#userView.renderUserDetails(user);
    this.#userView.renderPastListened(user.listenedTracks || []);
  }

  getSelectedUserId() {
    return this.#userView.getSelectedUserId();
  }
}
