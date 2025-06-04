// Estado global de la aplicación
export const state = {
  currentSong: null,
  isPlaying: false,
  volume: 1,
  shuffle: false,
  repeat: 'none', // 'none', 'all', 'one'
  queue: [],
  favorites: [],
  playlists: [],
  lastVisitedSection: 'home',
  theme: 'dark',
  notifications: []
};

// Guardar estado en localStorage
export function saveToLocalStorage() {
  try {
    localStorage.setItem('chilltifyState', JSON.stringify({
      volume: state.volume,
      shuffle: state.shuffle,
      repeat: state.repeat,
      queue: state.queue,
      favorites: state.favorites,
      playlists: state.playlists,
      lastVisitedSection: state.lastVisitedSection,
      theme: state.theme
    }));
  } catch (error) {
    console.error('Error al guardar el estado:', error);
  }
}

// Cargar estado desde localStorage
export function loadFromLocalStorage() {
  try {
    const savedState = localStorage.getItem('chilltifyState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      Object.assign(state, parsedState);
    }
  } catch (error) {
    console.error('Error al cargar el estado:', error);
  }
}

// Sistema de notificaciones
export function showNotification(message, type = 'info') {
  const notification = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date()
  };

  state.notifications.push(notification);

  // Mostrar la notificación en la UI
  const notificationEl = document.createElement('div');
  notificationEl.className = `notification ${type}`;
  notificationEl.textContent = message;

  document.body.appendChild(notificationEl);

  // Animar entrada
  setTimeout(() => {
    notificationEl.classList.add('show');
  }, 100);

  // Remover después de 3 segundos
  setTimeout(() => {
    notificationEl.classList.remove('show');
    setTimeout(() => {
      notificationEl.remove();
      state.notifications = state.notifications.filter(n => n.id !== notification.id);
    }, 300);
  }, 3000);
}

// Utilidades
export function sanitizeInput(input) {
  return input.replace(/[<>]/g, '');
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Inicializar estado
loadFromLocalStorage();

// Funciones de utilidad
export function validatePlaylistName(name) {
  return name.trim().length >= 3;
} 