// js/data.js
import { state, saveToLocalStorage } from './state.js';

export const canciones = [
  {
    id: 1,
    titulo: "Shape of You",
    artista: "Ed Sheeran",
    imagen: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    archivo: "assets/audio/cancion1.mp3",
    duracion: 235,
    genero: "Pop",
    fechaCreacion: "2017-01-06",
    album: "÷ (Divide)",
    albumId: 1
  },
  {
    id: 2,
    titulo: "Blinding Lights",
    artista: "The Weeknd",
    imagen: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    archivo: "assets/audio/cancion2.mp3",
    duracion: 200,
    genero: "Pop",
    fechaCreacion: "2019-11-29",
    album: "After Hours",
    albumId: 2
  },
  {
    id: 3,
    titulo: "Dance Monkey",
    artista: "Tones and I",
    imagen: "https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f5",
    archivo: "assets/audio/cancion3.mp3",
    duracion: 210,
    genero: "Pop",
    fechaCreacion: "2019-05-10",
    album: "The Kids Are Coming",
    albumId: 3
  },
  {
    id: 4,
    titulo: "Someone You Loved",
    artista: "Lewis Capaldi",
    imagen: "https://i.scdn.co/image/ab67616d0000b273c6f7af36bcd24e41e56360b2",
    archivo: "assets/audio/cancion4.mp3",
    duracion: 182,
    genero: "Pop",
    fechaCreacion: "2018-11-08",
    album: "Divinely Uninspired to a Hellish Extent",
    albumId: 4
  },
  {
    id: 5,
    titulo: "Bad Guy",
    artista: "Billie Eilish",
    imagen: "https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e",
    archivo: "assets/audio/cancion5.mp3",
    duracion: 194,
    genero: "Pop",
    fechaCreacion: "2019-03-29",
    album: "When We All Fall Asleep, Where Do We Go?",
    albumId: 5
  }
];

// Álbumes
export const albumes = [
  {
    id: 1,
    titulo: "÷ (Divide)",
    artista: "Ed Sheeran",
    imagen: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96",
    canciones: [1],
    fechaCreacion: "2017-03-03"
  },
  {
    id: 2,
    titulo: "After Hours",
    artista: "The Weeknd",
    imagen: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36",
    canciones: [2],
    fechaCreacion: "2020-03-20"
  },
  {
    id: 3,
    titulo: "The Kids Are Coming",
    artista: "Tones and I",
    imagen: "https://i.scdn.co/image/ab67616d0000b2732e8ed79e177ff6011076f5f5",
    canciones: [3],
    fechaCreacion: "2019-08-30"
  },
  {
    id: 4,
    titulo: "Divinely Uninspired to a Hellish Extent",
    artista: "Lewis Capaldi",
    imagen: "https://i.scdn.co/image/ab67616d0000b273c6f7af36bcd24e41e56360b2",
    canciones: [4],
    fechaCreacion: "2019-05-17"
  },
  {
    id: 5,
    titulo: "When We All Fall Asleep, Where Do We Go?",
    artista: "Billie Eilish",
    imagen: "https://i.scdn.co/image/ab67616d0000b2732a038d3bf875d23e4aeaa84e",
    canciones: [5],
    fechaCreacion: "2019-03-29"
  }
];

// Playlists
export let playlists = [
  // (Eliminada la playlist Favoritas 2023)
];

// Historial de reproducción
export let historial = [];

// Funciones para manejar playlists
export function agregarPlaylist(nombre, descripcion = "", imagen = null) {
  const playlist = {
    id: Date.now(),
    nombre,
    descripcion,
    imagen: imagen || "https://placehold.co/300x300/222/fff?text=Playlist",
    canciones: [],
    fechaCreacion: new Date().toISOString()
  };
  playlists.push(playlist);
  saveToLocalStorage();
  return playlist;
}

export function editarPlaylist(id, datos) {
  const playlist = playlists.find(p => p.id === id);
  if (playlist) {
    Object.assign(playlist, datos);
    saveToLocalStorage();
    return true;
  }
  return false;
}

export function eliminarPlaylist(id) {
  playlists = playlists.filter(p => p.id !== id);
  saveToLocalStorage();
}

export function agregarCancionAPlaylist(playlistId, cancionId) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist && !playlist.canciones.includes(cancionId)) {
    playlist.canciones.push(cancionId);
    saveToLocalStorage();
    return true;
  }
  return false;
}

export function eliminarCancionDePlaylist(playlistId, cancionId) {
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    playlist.canciones = playlist.canciones.filter(id => id !== cancionId);
    saveToLocalStorage();
    return true;
  }
  return false;
}

// Funciones para manejar favoritos
export function toggleFavorito(cancionId) {
  const index = state.favorites.indexOf(cancionId);
  if (index === -1) {
    state.favorites.push(cancionId);
  } else {
    state.favorites.splice(index, 1);
  }
  saveToLocalStorage();
  return index === -1;
}

// Funciones para manejar el historial
export function agregarAlHistorial(cancion) {
  historial.unshift({
    cancion,
    fecha: new Date().toISOString()
  });
  // Mantener solo las últimas 50 reproducciones
  if (historial.length > 50) {
    historial.pop();
  }
  saveToLocalStorage();
}

export function limpiarHistorial() {
  historial = [];
  saveToLocalStorage();
}

// Funciones para manejar álbumes guardados
export function toggleAlbumGuardado(albumId) {
  const index = state.savedAlbums.indexOf(albumId);
  if (index === -1) {
    state.savedAlbums.push(albumId);
  } else {
    state.savedAlbums.splice(index, 1);
  }
  saveToLocalStorage();
  return index === -1;
}

// Funciones para manejar artistas guardados
export function toggleArtistaGuardado(artista) {
  const index = state.savedArtists.indexOf(artista);
  if (index === -1) {
    state.savedArtists.push(artista);
  } else {
    state.savedArtists.splice(index, 1);
  }
  saveToLocalStorage();
  return index === -1;
}

// Inicializar estado
export function inicializarEstado() {
  state.playlists = playlists;
  state.favorites = state.favorites || [];
  state.savedAlbums = state.savedAlbums || [];
  state.savedArtists = state.savedArtists || [];
  state.historial = historial;
  saveToLocalStorage();
}