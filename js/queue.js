import { state, saveToLocalStorage } from './state.js';
import { showNotification } from './state.js';

export class QueueManager {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botón de cola
    const queueBtn = document.querySelector('.queue-btn');
    if (queueBtn) {
      queueBtn.addEventListener('click', () => {
        document.querySelector('.sidebar li[data-seccion="queue"]').click();
      });
    }
  }

  addToQueue(song) {
    this.queue.push(song);
    this.updateQueueDisplay();
    saveToLocalStorage();
    showNotification(`${song.titulo} agregada a la cola`, 'info');
  }

  removeFromQueue(index) {
    if (index >= 0 && index < this.queue.length) {
      const removed = this.queue.splice(index, 1)[0];
      this.updateQueueDisplay();
      saveToLocalStorage();
      showNotification(`${removed.titulo} removida de la cola`, 'info');
    }
  }

  clearQueue() {
    this.queue = [];
    this.updateQueueDisplay();
    saveToLocalStorage();
  }

  getNextSong() {
    if (this.queue.length === 0) return null;
    
    if (state.shuffle) {
      const randomIndex = Math.floor(Math.random() * this.queue.length);
      const song = this.queue[randomIndex];
      this.queue.splice(randomIndex, 1);
      return song;
    }
    
    return this.queue.shift();
  }

  updateQueueDisplay() {
    const currentTrack = document.querySelector('.current-track');
    const queueTracks = document.querySelector('.queue-tracks');
    
    if (!currentTrack || !queueTracks) return;

    // Actualizar canción actual
    if (state.currentSong) {
      currentTrack.innerHTML = `
        <div class="queue-item current">
          <img src="${state.currentSong.imagen}" alt="${state.currentSong.titulo}" />
          <div class="queue-item-info">
            <div class="queue-item-title">${state.currentSong.titulo}</div>
            <div class="queue-item-artist">${state.currentSong.artista}</div>
          </div>
        </div>
      `;
    }

    // Actualizar lista de cola
    queueTracks.innerHTML = this.queue.map((song, index) => `
      <div class="queue-item" data-index="${index}">
        <img src="${song.imagen}" alt="${song.titulo}" />
        <div class="queue-item-info">
          <div class="queue-item-title">${song.titulo}</div>
          <div class="queue-item-artist">${song.artista}</div>
        </div>
        <button class="remove-from-queue" data-index="${index}">×</button>
      </div>
    `).join('');

    // Agregar event listeners para remover canciones
    queueTracks.querySelectorAll('.remove-from-queue').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        this.removeFromQueue(index);
      });
    });

    // Agregar event listeners para reproducir canciones
    queueTracks.querySelectorAll('.queue-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        const song = this.queue[index];
        if (song) {
          this.queue.splice(index, 1);
          this.queue.unshift(song);
          this.updateQueueDisplay();
          // Emitir evento para reproducir la canción
          window.dispatchEvent(new CustomEvent('playSong', { detail: song }));
        }
      });
    });
  }
}

export const queueManager = new QueueManager(); 