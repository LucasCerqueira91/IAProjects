import { View } from './View.js';

export class UserView extends View {
  #userSelect = document.querySelector('#userSelect');
  #userAge = document.querySelector('#userAge');
  #pastListenedList = document.querySelector('#pastListenedList');

  #listenedTemplate;
  #onUserSelect;
  #onListenedRemove;

  constructor() {
    super();
    this.init();
  }

  async init() {
    this.#listenedTemplate = await this.loadTemplate('./src/view/templates/past-listened.html');
    this.attachUserSelectListener();
  }

  registerUserSelectCallback(callback) {
    this.#onUserSelect = callback;
  }

  registerListenedRemoveCallback(callback) {
    this.#onListenedRemove = callback;
  }

  renderUserOptions(users) {
    const options = users.map((user) => `<option value="${user.id}">${user.name}</option>`).join('');
    this.#userSelect.innerHTML += options;
  }

  renderUserDetails(user) {
    this.#userAge.value = user.age;
  }

  renderPastListened(listenedTracks) {
    if (!this.#listenedTemplate) return;
    if (!listenedTracks || listenedTracks.length === 0) {
      this.#pastListenedList.innerHTML = '<p>No tracks in your list yet.</p>';
      return;
    }
    const html = listenedTracks
      .map((track) =>
        this.replaceTemplate(this.#listenedTemplate, {
          ...track,
          track: JSON.stringify(track),
        })
      )
      .join('');
    this.#pastListenedList.innerHTML = html;
    this.attachListenedClickHandlers();
  }

  addPastListened(track) {
    if (this.#pastListenedList.innerHTML.includes('No tracks in your list yet')) {
      this.#pastListenedList.innerHTML = '';
    }
    const html = this.replaceTemplate(this.#listenedTemplate, {
      ...track,
      track: JSON.stringify(track),
    });
    this.#pastListenedList.insertAdjacentHTML('afterbegin', html);
    const el = this.#pastListenedList.querySelector('.past-listened');
    if (el) {
      el.classList.add('past-listened-highlight');
      setTimeout(() => el.classList.remove('past-listened-highlight'), 1000);
    }
    this.attachListenedClickHandlers();
  }

  attachListenedClickHandlers() {
    this.#pastListenedList.querySelectorAll('.past-listened').forEach((el) => {
      const icon = el.querySelector('.bi-x-circle');
      if (icon && !icon.dataset.bound) {
        icon.dataset.bound = '1';
        icon.addEventListener('click', () => {
          const track = JSON.parse(el.dataset.track);
          this.#onListenedRemove && this.#onListenedRemove({ userId: this.getSelectedUserId(), track });
        });
      }
    });
  }

  attachUserSelectListener() {
    this.#userSelect.addEventListener('change', (e) => {
      const userId = e.target.value ? Number(e.target.value) : null;
      this.#onUserSelect && this.#onUserSelect(userId);
    });
  }

  getSelectedUserId() {
    const val = this.#userSelect?.value;
    return val ? Number(val) : null;
  }
}
