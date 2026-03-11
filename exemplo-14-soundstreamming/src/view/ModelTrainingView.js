import { View } from './View.js';

export class ModelView extends View {
  #trainModelBtn = document.querySelector('#trainModelBtn');
  #purchasesArrow = document.querySelector('#purchasesArrow');
  #purchasesDiv = document.querySelector('#purchasesDiv');
  #allUsersListenedList = document.querySelector('#allUsersListenedList');
  #runRecommendationBtn = document.querySelector('#runRecommendationBtn');
  #onTrainModel;
  #onRunRecommendation;

  constructor() {
    super();
    this.attachEventListeners();
  }

  registerTrainModelCallback(callback) {
    this.#onTrainModel = callback;
  }

  registerRunRecommendationCallback(callback) {
    this.#onRunRecommendation = callback;
  }

  attachEventListeners() {
    this.#trainModelBtn?.addEventListener('click', () => this.#onTrainModel?.());
    this.#runRecommendationBtn?.addEventListener('click', () => this.#onRunRecommendation?.());
    this.#purchasesDiv?.addEventListener('click', () => {
      const list = this.#allUsersListenedList;
      if (!list) return;
      const isHidden = window.getComputedStyle(list).display === 'none';
      list.style.display = isHidden ? 'block' : 'none';
      this.#purchasesArrow?.classList.toggle('bi-chevron-down', !isHidden);
      this.#purchasesArrow?.classList.toggle('bi-chevron-up', isHidden);
    });
  }

  enableRecommendButton() {
    if (this.#runRecommendationBtn) this.#runRecommendationBtn.disabled = false;
  }

  updateTrainingProgress(progress) {
    if (!this.#trainModelBtn) return;
    this.#trainModelBtn.disabled = true;
    this.#trainModelBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status"></span> Training...';
    if (progress?.progress === 100) {
      this.#trainModelBtn.disabled = false;
      this.#trainModelBtn.innerHTML = '<i class="bi bi-cpu"></i> Train Model';
    }
  }

  renderAllUsersListened(users) {
    if (!this.#allUsersListenedList) return;
    const html = users
      .map((user) => {
        const badges = (user.listenedTracks || [])
          .map((t) => `<span class="badge bg-light text-dark me-1 mb-1">${t.name} (${t.genre})</span>`)
          .join('');
        return `
          <div class="user-listened-summary">
            <h6>${user.name} (Age: ${user.age})</h6>
            <div class="listened-badges">${badges || '<span class="text-muted">No tracks yet</span>'}</div>
          </div>
        `;
      })
      .join('');
    this.#allUsersListenedList.innerHTML = html;
  }
}
