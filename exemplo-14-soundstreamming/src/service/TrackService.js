export class TrackService {
  async getTracks() {
    const response = await fetch('./data/tracks.json');
    return await response.json();
  }

  async getTrackById(id) {
    const tracks = await this.getTracks();
    return tracks.find((t) => t.id === id);
  }

  async getTracksByIds(ids) {
    const tracks = await this.getTracks();
    return tracks.filter((t) => ids.includes(t.id));
  }
}
