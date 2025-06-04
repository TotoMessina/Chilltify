import { state, showNotification } from './state.js';
import { historial, agregarAlHistorial, limpiarHistorial, canciones } from './data.js';
import { cargarCancion } from './player.js';

class HistoryManager {
  constructor() {
    this.historial = historial;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Evento para limpiar historial
    document.querySelector('.clear-history-btn')?.addEventListener('click', () => {
      this.limpiarHistorial();
    });
  }

  agregarAlHistorial(cancion) {
    agregarAlHistorial(cancion);
    this.actualizarHistorial();
  }

  limpiarHistorial() {
    if (confirm('¿Estás seguro de que quieres limpiar el historial de reproducción?')) {
      limpiarHistorial();
      this.actualizarHistorial();
      showNotification('Historial limpiado exitosamente', 'success');
    }
  }

  actualizarHistorial() {
    const historialContainer = document.querySelector('.history-list');
    if (!historialContainer) return;

    historialContainer.innerHTML = this.historial.map(item => `
      <div class="history-item" data-song-id="${item.cancion.id}">
        <img src="${item.cancion.imagen}" alt="${item.cancion.titulo}" class="history-cover">
        <div class="history-info">
          <h4>${item.cancion.titulo}</h4>
          <p>${item.cancion.artista}</p>
          <small>${this.formatearFecha(item.fecha)}</small>
        </div>
        <button class="play-history-btn" title="Reproducir">▶️</button>
      </div>
    `).join('');

    // Agregar event listeners a los botones de reproducción
    historialContainer.querySelectorAll('.play-history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const songId = parseInt(e.target.closest('.history-item').dataset.songId);
        const cancion = this.historial.find(item => item.cancion.id === songId)?.cancion;
        if (cancion) {
          cargarCancion(canciones.findIndex(c => c.id === cancion.id));
        }
      });
    });
  }

  formatearFecha(fecha) {
    const date = new Date(fecha);
    const ahora = new Date();
    const diff = ahora - date;
    
    // Si es hoy
    if (diff < 24 * 60 * 60 * 1000) {
      return `Hoy a las ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Si es ayer
    if (diff < 48 * 60 * 60 * 1000) {
      return `Ayer a las ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Si es esta semana
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `${dias[date.getDay()]} a las ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // Si es más antiguo
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  }
}

export const historyManager = new HistoryManager(); 