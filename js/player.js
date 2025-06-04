import { canciones, agregarAlHistorial } from "./data.js";
import { state, saveToLocalStorage, showNotification } from "./state.js";
import { queueManager } from './queue.js';

let audio = null;
let indexActual = 0;
let isPlaying = false;
let currentTime = 0;
let duration = 0;
let intervaloProgreso;
let colaReproduccion = [];
let isShuffle = false;
let isRepeat = false;

// Elementos del player
const elementos = {
  info: null,
  playBtn: null,
  prevBtn: null,
  nextBtn: null,
  shuffleBtn: null,
  repeatBtn: null,
  progressBar: null,
  volumeBar: null,
  muteBtn: null,
  timeNow: null,
  timeDuration: null,
  coverImage: null,
  controls: null,
  currentTimeEl: null,
  durationEl: null,
  volumeControl: null,
  volumeIcon: null,
  miniplayer: null,
  karaokeBtn: null,
  karaokeModal: null
};

// Inicializar elementos del DOM
function inicializarElementos() {
  // Crear elemento de audio si no existe
  if (!audio) {
    audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = state.volume || 1;
  }

  elementos.info = document.querySelector(".song-info");
  elementos.playBtn = document.querySelector(".play-btn");
  elementos.prevBtn = document.querySelector(".prev-btn");
  elementos.nextBtn = document.querySelector(".next-btn");
  elementos.progressBar = document.querySelector(".progress-bar");
  elementos.volumeBar = document.querySelector(".volume-bar");
  elementos.muteBtn = document.querySelector(".volume-icon");
  elementos.timeNow = document.querySelector(".current-time");
  elementos.timeDuration = document.querySelector(".duration");
  elementos.controls = document.querySelector(".controls");
  elementos.currentTimeEl = document.querySelector('.current-time');
  elementos.durationEl = document.querySelector('.duration');
  elementos.volumeControl = document.querySelector('.volume-control');
  elementos.volumeIcon = document.querySelector('.volume-icon');
  elementos.miniplayer = document.querySelector('.miniplayer');
  elementos.karaokeBtn = document.querySelector('.karaoke-btn');
  elementos.karaokeModal = document.querySelector('.karaoke-modal');
  elementos.shuffleBtn = document.querySelector('.shuffle-btn');
  elementos.repeatBtn = document.querySelector('.repeat-btn');
  
  // Crear imagen para el player si no existe
  elementos.coverImage = document.querySelector(".now-playing-cover");
  
  // Insertar elementos en el DOM
  if (elementos.controls) {
    if (!elementos.controls.contains(elementos.shuffleBtn)) {
      elementos.controls.insertBefore(elementos.shuffleBtn, elementos.playBtn);
    }
    if (!elementos.controls.contains(elementos.repeatBtn)) {
      elementos.controls.appendChild(elementos.repeatBtn);
    }
  }
  
  // Inicializar control de volumen
  if (elementos.volumeBar) {
    elementos.volumeBar.value = audio.volume;
    elementos.volumeBar.addEventListener('input', adjustVolume);
  }

  // Verificar y asegurar que el botón de reproducción existe y está configurado correctamente
  if (elementos.playBtn) {
    elementos.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    elementos.playBtn.setAttribute("aria-label", "Reproducir");
    elementos.playBtn.style.display = 'flex';
    elementos.playBtn.style.alignItems = 'center';
    elementos.playBtn.style.justifyContent = 'center';
    elementos.playBtn.style.cursor = 'pointer';
    
    // Asegurar que el evento click esté correctamente configurado
    elementos.playBtn.removeEventListener('click', togglePlay);
    elementos.playBtn.addEventListener('click', togglePlay);
  } else {
    console.error('No se encontró el botón de reproducción');
  }
}

export function cargarCancion(index) {
  if (!canciones || !canciones[index]) {
    console.error('No hay canciones disponibles o el índice es inválido');
    return;
  }

  const cancion = canciones[index];
  audio.src = cancion.archivo;
  
  if (elementos.info) {
    elementos.info.innerHTML = `<b>${cancion.titulo}</b><br>${cancion.artista}`;
  }
  
  if (elementos.coverImage) {
    elementos.coverImage.src = cancion.imagen;
    elementos.coverImage.alt = `Portada de ${cancion.titulo}`;
  }
  
  indexActual = index;
  state.currentSong = cancion;
  
  // Asegurar que el estado inicial sea pausado
  isPlaying = false;
  state.isPlaying = false;
  if (elementos.playBtn) {
    elementos.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    elementos.playBtn.setAttribute("aria-label", "Reproducir");
  }
  
  // Actualizar botones favorito
  actualizarBotonesFavorito();
  
  // Mostrar duración cuando esté cargada
  audio.addEventListener("loadedmetadata", () => {
    duration = audio.duration;
    if (elementos.timeDuration) {
      elementos.timeDuration.textContent = formatearTiempo(duration);
    }
    if (elementos.progressBar) {
      elementos.progressBar.max = audio.duration;
    }
  });
  
  // Iniciar seguimiento del progreso
  if (intervaloProgreso) clearInterval(intervaloProgreso);
  intervaloProgreso = setInterval(actualizarProgreso, 1000);
  
  agregarAlHistorial(cancion);
}

function actualizarBotonesFavorito() {
  document.querySelectorAll(".favorite-btn").forEach((btn, i) => {
    if (i === indexActual) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function reproducir() {
  if (!audio) return;
  
  audio.play()
    .then(() => {
      isPlaying = true;
      state.isPlaying = true;
      if (elementos.playBtn) {
        elementos.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        elementos.playBtn.setAttribute("aria-label", "Pausar");
      }
      saveToLocalStorage();
    })
    .catch(error => {
      console.error("Error al reproducir:", error);
      showNotification("Error al reproducir la canción", "error");
      if (elementos.info) {
        elementos.info.innerHTML = "Error al reproducir<br><small>Haz clic para intentar de nuevo</small>";
        elementos.info.onclick = () => reproducir();
      }
    });
}

function pausar() {
  if (!audio) return;
  
  audio.pause();
  isPlaying = false;
  state.isPlaying = false;
  if (elementos.playBtn) {
    elementos.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    elementos.playBtn.setAttribute("aria-label", "Reproducir");
  }
  saveToLocalStorage();
}

function formatearTiempo(segundos) {
  if (isNaN(segundos)) return "0:00";
  const min = Math.floor(segundos / 60);
  const sec = Math.floor(segundos % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function actualizarProgreso() {
  elementos.progressBar.value = audio.currentTime;
  elementos.timeNow.textContent = formatearTiempo(audio.currentTime);
  
  const porcentaje = (audio.currentTime / audio.duration) * 100;
  elementos.progressBar.style.background = `linear-gradient(to right, #1db954 ${porcentaje}%, #535353 ${porcentaje}%)`;
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  elementos.shuffleBtn.classList.toggle("active", isShuffle);
  if (isShuffle) {
    colaReproduccion = [...canciones];
    shuffleArray(colaReproduccion);
  }
  saveToLocalStorage();
  showNotification(isShuffle ? 'Reproducción aleatoria activada' : 'Reproducción aleatoria desactivada', 'info');
}

function toggleRepeat() {
  if (state.repeat === 'none') {
    state.repeat = 'all';
    elementos.repeatBtn.innerHTML = '<i class="fas fa-repeat"></i>';
  } else if (state.repeat === 'all') {
    state.repeat = 'one';
    elementos.repeatBtn.innerHTML = '<i class="fas fa-repeat-1"></i>';
  } else {
    state.repeat = 'none';
    elementos.repeatBtn.innerHTML = '<i class="fas fa-repeat"></i>';
  }
  elementos.repeatBtn.classList.toggle('active', state.repeat !== 'none');
  saveToLocalStorage();
  showNotification(
    state.repeat === 'all' ? 'Repetir lista activado' :
    state.repeat === 'one' ? 'Repetir canción activado' :
    'Repetición desactivada',
    'info'
  );
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function siguienteCancion() {
  if (isShuffle && colaReproduccion.length > 0) {
    const siguiente = colaReproduccion.shift();
    indexActual = canciones.findIndex(c => c.id === siguiente.id);
  } else {
    indexActual = (indexActual + 1) % canciones.length;
  }
  cargarCancion(indexActual);
  reproducir();
}

function cancionAnterior() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    elementos.progressBar.value = 0;
  } else {
    indexActual = (indexActual - 1 + canciones.length) % canciones.length;
    cargarCancion(indexActual);
    reproducir();
  }
}

function togglePlay() {
  if (!audio) {
    console.error('El elemento de audio no está inicializado');
    return;
  }

  if (!elementos.playBtn) {
    console.error('El botón de reproducción no está inicializado');
    return;
  }

  if (isPlaying) {
    pausar();
  } else {
    reproducir();
  }
  
  // Actualizar el miniplayer si existe
  if (elementos.miniplayer) {
    updateMiniplayer();
  }
}

export function playSong(song) {
  if (!audio || !song) return;

  state.currentSong = song;
  audio.src = song.archivo;
  
  // Actualizar información de la canción actual
  if (elementos.info) {
    elementos.info.innerHTML = `<b>${song.titulo}</b><br>${song.artista}`;
  }
  
  if (elementos.coverImage) {
    elementos.coverImage.src = song.imagen;
    elementos.coverImage.alt = `Portada de ${song.titulo}`;
  }
  
  if (elementos.playBtn) {
    elementos.playBtn.textContent = "⏸️";
  }
  
  // Actualizar botones favorito
  actualizarBotonesFavorito();
  
  // Mostrar duración cuando esté cargada
  audio.addEventListener("loadedmetadata", () => {
    duration = audio.duration;
    if (elementos.timeDuration) {
      elementos.timeDuration.textContent = formatearTiempo(duration);
    }
    if (elementos.progressBar) {
      elementos.progressBar.max = audio.duration;
    }
  });
  
  // Iniciar seguimiento del progreso
  if (intervaloProgreso) clearInterval(intervaloProgreso);
  intervaloProgreso = setInterval(actualizarProgreso, 1000);
  
  // Reproducir la canción
  audio.play().then(() => {
    isPlaying = true;
    state.isPlaying = true;
    updateMiniplayer();
    saveToLocalStorage();
  }).catch(error => {
    console.error("Error al reproducir:", error);
    showNotification("Error al reproducir la canción", "error");
  });
}

function playNext() {
  if (state.repeat === 'one') {
    audio.currentTime = 0;
    audio.play();
    return;
  }

  const nextSong = queueManager.getNextSong();
  if (nextSong) {
    playSong(nextSong);
  } else if (state.repeat === 'all') {
    // Reiniciar la cola
    queueManager.clearQueue();
    // Aquí podrías agregar lógica para cargar la playlist actual
  }
}

function playPrevious() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }

  // Aquí podrías implementar la lógica para reproducir la canción anterior
  // Por ahora, simplemente reiniciamos la canción actual
  audio.currentTime = 0;
}

function seek(e) {
  if (!audio || !elementos.progressBar) return;

  const progressBar = elementos.progressBar;
  const rect = progressBar.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pos * audio.duration;
}

function adjustVolume() {
  if (!audio || !elementos.volumeBar) return;

  const volume = parseFloat(elementos.volumeBar.value);
  audio.volume = volume;
  
  // Actualizar icono de volumen
  if (elementos.volumeIcon) {
    if (volume === 0) {
      elementos.volumeIcon.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (volume < 0.5) {
      elementos.volumeIcon.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
      elementos.volumeIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  }
  
  state.volume = volume;
  saveToLocalStorage();
}

function toggleMute() {
  if (!audio || !elementos.volumeBar) return;

  if (audio.volume > 0) {
    audio.volume = 0;
    elementos.volumeBar.value = 0;
    if (elementos.volumeIcon) {
      elementos.volumeIcon.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  } else {
    audio.volume = state.volume || 1;
    elementos.volumeBar.value = audio.volume;
    if (elementos.volumeIcon) {
      elementos.volumeIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  }
  saveToLocalStorage();
}

function toggleKaraoke() {
  if (!elementos.karaokeModal) return;
  
  elementos.karaokeModal.classList.toggle('active');
  if (elementos.karaokeModal.classList.contains('active')) {
    // Aquí podrías implementar la lógica para cargar y sincronizar las letras
    showNotification('Modo karaoke activado', 'info');
  } else {
    showNotification('Modo karaoke desactivado', 'info');
  }
}

function updateMiniplayer() {
  if (!elementos.miniplayer || !state.currentSong) return;

  elementos.miniplayer.querySelector('img').src = state.currentSong.imagen;
  elementos.miniplayer.querySelector('.miniplayer-title').textContent = state.currentSong.titulo;
  elementos.miniplayer.querySelector('.miniplayer-artist').textContent = state.currentSong.artista;
  elementos.miniplayer.querySelector('.miniplayer-play').innerHTML = isPlaying ? 
    '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function handleSongEnd() {
  if (state.repeat === 'one') {
    audio.currentTime = 0;
    audio.play();
  } else {
    playNext();
  }
}

// Inicialización
function inicializarPlayer() {
  inicializarElementos();
  
  // Verificar que tenemos canciones antes de cargar
  if (canciones && canciones.length > 0) {
    // Cargar la primera canción pero no reproducir
    cargarCancion(indexActual);
    // Asegurar que el audio esté pausado
    audio.pause();
    isPlaying = false;
    state.isPlaying = false;
    
    // Configurar volumen inicial
    if (elementos.volumeBar) {
      elementos.volumeBar.value = state.volume || 1;
      adjustVolume();
    }
  } else {
    console.error('No hay canciones disponibles para reproducir');
    showNotification('No hay canciones disponibles', 'error');
  }
  
  setupEventListeners();
}

// Mover todos los event listeners a una función separada
function setupEventListeners() {
  if (!elementos.controls) return;
  
  elementos.playBtn?.addEventListener("click", togglePlay);
  elementos.nextBtn?.addEventListener("click", playNext);
  elementos.prevBtn?.addEventListener("click", playPrevious);
  elementos.shuffleBtn?.addEventListener("click", toggleShuffle);
  elementos.repeatBtn?.addEventListener("click", toggleRepeat);

  elementos.progressBar?.addEventListener("input", seek);
  elementos.volumeBar?.addEventListener("input", adjustVolume);
  elementos.muteBtn?.addEventListener("click", toggleMute);

  elementos.audio?.addEventListener('timeupdate', actualizarProgreso);
  elementos.audio?.addEventListener('loadedmetadata', () => {
    duration = elementos.audio.duration;
    elementos.durationEl.textContent = formatearTiempo(duration);
  });
  elementos.audio?.addEventListener('ended', handleSongEnd);

  if (elementos.karaokeBtn) {
    elementos.karaokeBtn.addEventListener('click', toggleKaraoke);
  }

  // Evento para reproducir canción desde la cola
  window.addEventListener('playSong', (e) => {
    if (e.detail) {
      playSong(e.detail);
    }
  });
}

// Exportar función de inicialización
export function inicializar() {
  try {
    inicializarPlayer();

    // Cargar estado guardado
    if (state.currentSong) {
      playSong(state.currentSong);
    }

    // Inicializar controles
    if (elementos.volumeControl) {
      elementos.volumeControl.value = state.volume || 1;
      adjustVolume();
    }

    if (elementos.shuffleBtn) {
      elementos.shuffleBtn.classList.toggle('active', isShuffle);
    }

    if (elementos.repeatBtn) {
      elementos.repeatBtn.classList.toggle('active', state.repeat !== 'none');
      elementos.repeatBtn.innerHTML = state.repeat === 'one' ? 
        '<i class="fas fa-repeat-1"></i>' : '<i class="fas fa-repeat"></i>';
    }
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    showNotification('Error al inicializar el reproductor', 'error');
  }
}

export function reproducirPorIndice(i) {
  cargarCancion(i);
  reproducir();
}