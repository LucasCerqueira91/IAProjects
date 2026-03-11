import { View } from './View.js';

export class TrackView extends View {
  #trackList = document.querySelector('#trackList');
  #trackTemplate;
  #onAddListened;

  constructor() {
    super();
    this.init();
  }

  async init() {
    this.#trackTemplate = await this.loadTemplate('./src/view/templates/track-card.html');
  }

  onUserSelected(user) {
    this.setButtonsState(!!user?.id);
  }

  registerAddListenedCallback(callback) {
    this.#onAddListened = callback;
  }

  formatDuration(ms) {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  render(tracks, disableButtons = true) {
    if (!this.#trackTemplate) return;
    const html = tracks
      .map((track) =>
        this.replaceTemplate(this.#trackTemplate, {
          id: track.id,
          name: track.name,
          artist: track.artist,
          genre: track.genre,
          durationMs: this.formatDuration(track.durationMs || 0),
          track: JSON.stringify(track),
        })
      )
      .join('');
    this.#trackList.innerHTML = html;
    this.attachAddButtonListeners();
    this.setButtonsState(disableButtons);
  }

  setButtonsState(disabled) {
    document.querySelectorAll('.add-listened-btn').forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  attachAddButtonListeners() {
    document.querySelectorAll('.add-listened-btn').forEach((btn) => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.add-listened-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const track = JSON.parse(btn.dataset.track);
        btn.innerHTML = '<i class="bi bi-check-circle-fill"></i> Added';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-success');
        setTimeout(() => {
          btn.innerHTML = 'Add to my list';
          btn.classList.remove('btn-success');
          btn.classList.add('btn-primary');
        }, 500);
        this.#onAddListened && this.#onAddListened(track, btn);
      });
    });
  }
}
