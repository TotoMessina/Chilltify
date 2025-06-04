import { state, saveToLocalStorage, showNotification } from './state.js';
import { canciones, albumes, playlists, toggleFavorito, toggleAlbumGuardado, toggleArtistaGuardado } from './data.js';
import { inicializar as inicializarPlayer, playSong } from './player.js';
import { playlistManager } from './playlist.js';
import { historyManager } from './history.js';

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  inicializarApp();
  setupEventListeners();
});

function inicializarApp() {
  // Inicializar el reproductor
  inicializarPlayer();
  
  // Cargar sección inicial
  cargarSeccion('inicio');
  
  // Actualizar playlists
  playlistManager.actualizarListaPlaylists();
  
  // Actualizar historial
  historyManager.actualizarHistorial();
  
  // Cargar favoritos
  actualizarFavoritos();
  
  // Cargar álbumes guardados
  actualizarAlbumesGuardados();
  
  // Cargar artistas guardados
  actualizarArtistasGuardados();
}

function setupEventListeners() {
  // Navegación
  document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', () => {
      const seccion = item.dataset.seccion;
      cargarSeccion(seccion);
      
      // Actualizar clase activa
      document.querySelectorAll('.menu li').forEach(li => li.classList.remove('activo'));
      item.classList.add('activo');
    });
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      const tabContainer = btn.closest('.library-tabs, .search-tabs');
      
      // Actualizar botones
      tabContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Actualizar contenido
      const tabContent = tabContainer.nextElementSibling;
      tabContent.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
      tabContent.querySelector(`#${tabId}-tab`).classList.add('active');
    });
  });

  // Búsqueda
  const searchInput = document.querySelector('.header input');
  searchInput?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (query.length >= 2) {
      buscar(query);
    }
  });

  // Drag and Drop
  document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('song-item')) {
      e.dataTransfer.setData('text/plain', e.target.dataset.songId);
    }
  });

  document.addEventListener('dragover', (e) => {
    if (e.target.classList.contains('playlist-drop-zone')) {
      e.preventDefault();
      e.target.classList.add('drag-over');
    }
  });

  document.addEventListener('dragleave', (e) => {
    if (e.target.classList.contains('playlist-drop-zone')) {
      e.target.classList.remove('drag-over');
    }
  });

  document.addEventListener('drop', (e) => {
    if (e.target.classList.contains('playlist-drop-zone')) {
      e.preventDefault();
      e.target.classList.remove('drag-over');
      const songId = parseInt(e.dataTransfer.getData('text/plain'));
      const playlistId = parseInt(e.target.dataset.playlistId);
      if (playlistId) {
        playlistManager.agregarCancionAPlaylist(playlistId, songId);
      }
    }
  });

  // --- PLAYLISTS ---
  // Mostrar/ocultar modal crear playlist
  const modalCrearPlaylist = document.getElementById('modal-crear-playlist');
  const btnCrearPlaylist = document.querySelector('.create-playlist-btn');
  const formCrearPlaylist = document.getElementById('form-crear-playlist');
  const cancelarCrearPlaylist = document.getElementById('cancelar-crear-playlist');

  btnCrearPlaylist?.addEventListener('click', () => {
    modalCrearPlaylist.classList.add('active');
  });
  cancelarCrearPlaylist?.addEventListener('click', () => {
    modalCrearPlaylist.classList.remove('active');
    formCrearPlaylist.reset();
  });
  formCrearPlaylist?.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombre-playlist').value.trim();
    const portada = document.getElementById('portada-playlist').value.trim() || 'https://i.imgur.com/8Km9tLL.png';
    if (!nombre) return;
    const nueva = {
      id: Date.now(),
      nombre,
      imagen: portada,
      canciones: []
    };
    state.playlists.push(nueva);
    saveToLocalStorage();
    modalCrearPlaylist.classList.remove('active');
    formCrearPlaylist.reset();
    playlistManager.actualizarListaPlaylists();
    cargarBiblioteca();
  });

  // Mostrar playlists en sidebar
  playlistManager.actualizarListaPlaylists = function() {
    const ul = document.querySelector('.playlist-drop-zone');
    if (!ul) return;
    ul.innerHTML = '';
    state.playlists.forEach(pl => {
      const li = document.createElement('li');
      li.className = 'playlist-item';
      li.innerHTML = `<img src="${pl.imagen}" class="playlist-cover"/><span>${pl.nombre}</span>`;
      li.addEventListener('click', () => mostrarPlaylistView(pl.id));
      ul.appendChild(li);
    });
  };

  // --- Página dedicada para playlist ---
  function mostrarPlaylistView(playlistId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
    document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none');
    // Mostrar solo la sección de playlist
    const view = document.getElementById('playlist-view');
    if (!view) return;
    view.style.display = 'block';
    view.classList.add('activa');

    const playlist = state.playlists.find(p => p.id == playlistId);
    if (!playlist) return;

    view.innerHTML = `
      <div class="playlist-header">
        <img src="${playlist.imagen}" class="playlist-cover" />
        <div class="playlist-info">
          <input id="edit-nombre-playlist" value="${playlist.nombre}" />
          <input id="edit-portada-playlist" value="${playlist.imagen}" type="url" />
          <div class="playlist-actions">
            <button onclick="guardarEdicionPlaylist(${playlist.id})">Guardar</button>
            <button class="delete" onclick="eliminarPlaylistView(${playlist.id})">Eliminar</button>
          </div>
        </div>
      </div>
      <div class="card-grid">
        ${playlist.canciones.map(id => {
          const c = canciones.find(ca => ca.id === id);
          if (!c) return '';
          return `<div class='card song-item' data-song-id='${c.id}'>
            <img src='${c.imagen}' alt='${c.titulo}' />
            <h3>${c.titulo}</h3>
            <p>${c.artista}</p>
            <button class='favorite-btn ${state.favorites.includes(c.id) ? 'active' : ''}' onclick='toggleFavorito(${c.id})'>${state.favorites.includes(c.id) ? '❤️' : '🤍'}</button>
            <button class='remove-from-playlist-btn' title='Quitar de playlist' onclick='quitarCancionDePlaylistView(${playlist.id},${c.id})'><i class='fas fa-trash'></i></button>
            <button class='play-btn' onclick='playSong(${JSON.stringify(c)})'>▶️</button>
          </div>`;
        }).join('')}
      </div>
    `;
  }
  window.mostrarPlaylistView = mostrarPlaylistView;
  window.eliminarPlaylistView = function(id) {
    state.playlists = state.playlists.filter(p => p.id !== id);
    saveToLocalStorage();
    playlistManager.actualizarListaPlaylists();
    // Volver a biblioteca tras eliminar
    cargarSeccion('biblioteca');
  };
  window.guardarEdicionPlaylist = function(id) {
    const playlist = state.playlists.find(p => p.id == id);
    if (!playlist) return;
    const nuevoNombre = document.getElementById('edit-nombre-playlist').value.trim();
    const nuevaPortada = document.getElementById('edit-portada-playlist').value.trim();
    if (nuevoNombre) playlist.nombre = nuevoNombre;
    if (nuevaPortada) playlist.imagen = nuevaPortada;
    saveToLocalStorage();
    playlistManager.actualizarListaPlaylists();
    mostrarPlaylistView(id);
  };
  window.quitarCancionDePlaylistView = function(playlistId, songId) {
    const playlist = state.playlists.find(p => p.id == playlistId);
    if (!playlist) return;
    playlist.canciones = playlist.canciones.filter(id => id !== songId);
    saveToLocalStorage();
    mostrarPlaylistView(playlistId);
  };

  // Menú para elegir a qué playlist agregar
  window.abrirMenuAgregarPlaylist = function(songId, event) {
    event.stopPropagation();
    let menu = document.getElementById('menu-add-to-playlist');
    if (menu) menu.remove();
    menu = document.createElement('div');
    menu.id = 'menu-add-to-playlist';
    menu.style.position = 'fixed';
    menu.style.top = event.clientY + 'px';
    menu.style.left = event.clientX + 'px';
    menu.style.background = '#222';
    menu.style.color = '#fff';
    menu.style.borderRadius = '8px';
    menu.style.boxShadow = '0 2px 12px rgba(0,0,0,0.3)';
    menu.style.zIndex = 3000;
    menu.style.padding = '0.5rem 0';
    menu.innerHTML = state.playlists.length ? state.playlists.map(pl => `<div style='padding:0.5rem 1.5rem;cursor:pointer;' onclick='agregarCancionAPlaylist(${pl.id},${songId})'>${pl.nombre}</div>`).join('') : '<div style="padding:0.5rem 1.5rem;">No tienes playlists</div>';
    document.body.appendChild(menu);
    document.addEventListener('click', function cerrar(e) {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', cerrar);
      }
    });
  };
  window.agregarCancionAPlaylist = function(playlistId, songId) {
    const playlist = state.playlists.find(p => p.id == playlistId);
    if (!playlist) return;
    if (!playlist.canciones.includes(songId)) {
      playlist.canciones.push(songId);
      saveToLocalStorage();
      cargarBiblioteca();
      showNotification('Canción agregada a la playlist', 'success');
    }
    const menu = document.getElementById('menu-add-to-playlist');
    if (menu) menu.remove();
  };

  // Drag & drop para agregar canciones a playlist
  const playlistDropZone = document.querySelector('.playlist-drop-zone');
  playlistDropZone?.addEventListener('dragover', e => {
    e.preventDefault();
    playlistDropZone.classList.add('drag-over');
  });
  playlistDropZone?.addEventListener('dragleave', e => {
    playlistDropZone.classList.remove('drag-over');
  });
  playlistDropZone?.addEventListener('drop', e => {
    e.preventDefault();
    playlistDropZone.classList.remove('drag-over');
    const songId = parseInt(e.dataTransfer.getData('text/plain'));
    // Mostrar menú para elegir a qué playlist agregar
    window.abrirMenuAgregarPlaylist(songId, e);
  });
}

function cargarSeccion(seccion) {
  // Ocultar todas las secciones
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  
  // Mostrar sección seleccionada
  const seccionElement = document.getElementById(seccion);
  if (seccionElement) {
    seccionElement.classList.add('activa');
    
    // Cargar contenido específico de la sección
    switch (seccion) {
      case 'inicio':
        cargarInicio();
        break;
      case 'biblioteca':
        cargarBiblioteca();
        break;
      case 'favoritos':
        cargarFavoritos();
        break;
      case 'buscar':
        cargarBuscar();
        break;
      case 'queue':
        cargarCola();
        break;
      case 'historial':
        cargarHistorial();
        break;
    }
  }
}

function cargarInicio() {
  const grid = document.querySelector('.card-grid');
  if (!grid) return;

  // Mostrar canciones recientes
  const cancionesRecientes = canciones.slice(0, 6);
  grid.innerHTML = cancionesRecientes.map(cancion => crearCardCancion(cancion)).join('');
}

function cargarBiblioteca() {
  const playlistsTab = document.querySelector('#playlists-tab');
  const albumsTab = document.querySelector('#albums-tab');
  const artistsTab = document.querySelector('#artists-tab');

  if (playlistsTab) {
    playlistsTab.innerHTML = state.playlists.map(playlist => crearCardPlaylist(playlist)).join('');
  }

  if (albumsTab) {
    albumsTab.innerHTML = albumes.map(album => crearCardAlbum(album)).join('');
  }

  if (artistsTab) {
    const artistas = [...new Set(canciones.map(c => c.artista))];
    artistsTab.innerHTML = artistas.map(artista => crearCardArtista(artista)).join('');
  }
}

function cargarFavoritos() {
  const grid = document.querySelector('.favorites-grid');
  if (!grid) return;

  const cancionesFavoritas = canciones.filter(c => state.favorites.includes(c.id));
  grid.innerHTML = cancionesFavoritas.map(cancion => crearCardCancion(cancion)).join('');
}

function cargarBuscar() {
  // La búsqueda se maneja con el evento input del campo de búsqueda
}

function cargarCola() {
  // La cola se maneja en queue.js
}

function cargarHistorial() {
  historyManager.actualizarHistorial();
}

function buscar(query) {
  const songsTab = document.querySelector('#songs-tab');
  const albumsTab = document.querySelector('#albums-tab');
  const artistsTab = document.querySelector('#artists-tab');

  if (songsTab) {
    const cancionesFiltradas = canciones.filter(c => 
      c.titulo.toLowerCase().includes(query) || 
      c.artista.toLowerCase().includes(query)
    );
    songsTab.innerHTML = cancionesFiltradas.map(cancion => crearCardCancion(cancion)).join('');
  }

  if (albumsTab) {
    const albumesFiltrados = albumes.filter(a => 
      a.titulo.toLowerCase().includes(query) || 
      a.artista.toLowerCase().includes(query)
    );
    albumsTab.innerHTML = albumesFiltrados.map(album => crearCardAlbum(album)).join('');
  }

  if (artistsTab) {
    const artistasFiltrados = [...new Set(canciones
      .filter(c => c.artista.toLowerCase().includes(query))
      .map(c => c.artista)
    )];
    artistsTab.innerHTML = artistasFiltrados.map(artista => crearCardArtista(artista)).join('');
  }
}

function crearCardPlaylist(playlist) {
  return `
    <div class="card playlist-item" data-playlist-id="${playlist.id}">
      <img src="${playlist.imagen}" alt="${playlist.nombre}">
      <h3>${playlist.nombre}</h3>
      <p>${playlist.canciones.length} canciones</p>
      <div class="playlist-actions">
        <button class="edit-btn" onclick="playlistManager.mostrarModalEditarPlaylist(${playlist.id})">✏️</button>
        <button class="delete-btn" onclick="playlistManager.eliminarPlaylist(${playlist.id})">🗑️</button>
      </div>
    </div>
  `;
}

function crearCardAlbum(album) {
  const esGuardado = (state.savedAlbums || []).includes(album.id);
  return `
    <div class="card album-item" data-album-id="${album.id}">
      <img src="${album.imagen}" alt="${album.titulo}">
      <h3>${album.titulo}</h3>
      <p>${album.artista}</p>
      <button class="save-btn ${esGuardado ? 'active' : ''}" onclick="toggleAlbumGuardado(${album.id})">
        ${esGuardado ? '✓' : '➕'}
      </button>
    </div>
  `;
}

function crearCardArtista(artista) {
  const esGuardado = (state.savedArtists || []).includes(artista);
  return `
    <div class="card artist-item">
      <img src="${canciones.find(c => c.artista === artista)?.imagen}" alt="${artista}">
      <h3>${artista}</h3>
      <button class="save-btn ${esGuardado ? 'active' : ''}" onclick="toggleArtistaGuardado('${artista}')">
        ${esGuardado ? '✓' : '➕'}
      </button>
    </div>
  `;
}

function actualizarFavoritos() {
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const songId = parseInt(btn.closest('.song-item')?.dataset.songId);
    if (songId) {
      btn.classList.toggle('active', state.favorites.includes(songId));
      btn.innerHTML = state.favorites.includes(songId) ? '❤️' : '🤍';
    }
  });
}

function actualizarAlbumesGuardados() {
  document.querySelectorAll('.album-item .save-btn').forEach(btn => {
    const albumId = parseInt(btn.closest('.album-item')?.dataset.albumId);
    if (albumId) {
      btn.classList.toggle('active', state.savedAlbums.includes(albumId));
      btn.innerHTML = state.savedAlbums.includes(albumId) ? '✓' : '➕';
    }
  });
}

function actualizarArtistasGuardados() {
  document.querySelectorAll('.artist-item .save-btn').forEach(btn => {
    const artista = btn.closest('.artist-item')?.querySelector('h3')?.textContent;
    if (artista) {
      btn.classList.toggle('active', state.savedArtists.includes(artista));
      btn.innerHTML = state.savedArtists.includes(artista) ? '✓' : '➕';
    }
  });
}

// Exportar funciones para uso global
window.toggleFavorito = function(cancionId) {
  const index = state.favorites.indexOf(cancionId);
  if (index === -1) {
    state.favorites.push(cancionId);
  } else {
    state.favorites.splice(index, 1);
  }
  saveToLocalStorage();
  actualizarFavoritos();
  // Si estamos en la sección de favoritos, recargar la vista
  const seccionFavoritos = document.getElementById('favoritos');
  if (seccionFavoritos && seccionFavoritos.classList.contains('activa')) {
    cargarFavoritos();
  }
}

window.toggleAlbumGuardado = toggleAlbumGuardado;
window.toggleArtistaGuardado = toggleArtistaGuardado;
window.playSong = playSong;

// --- GLOBAL: crearCardCancion ---
function crearCardCancion(cancion) {
  const esFavorita = state.favorites.includes(cancion.id);
  return `
    <div class="card song-item" data-song-id="${cancion.id}" draggable="true">
      <img src="${cancion.imagen}" alt="${cancion.titulo}">
      <h3>${cancion.titulo}</h3>
      <p>${cancion.artista}</p>
      <button class="favorite-btn ${esFavorita ? 'active' : ''}" onclick="toggleFavorito(${cancion.id})">
        ${esFavorita ? '❤️' : '🤍'}
      </button>
      <button class="add-to-playlist-btn" title="Agregar a playlist" onclick="abrirMenuAgregarPlaylist(${cancion.id}, event)"><i class="fas fa-plus"></i></button>
      <button class="play-btn" onclick="playSong(${JSON.stringify(cancion)})">▶️</button>
    </div>
  `;
}

// --- Búsqueda global de canciones ---
// (Las importaciones de canciones y playSong ya están al inicio, no repetir aquí)

// Agregar función para volver a inicio desde cualquier vista
window.irAInicio = function() {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.querySelectorAll('.seccion').forEach(s => s.style.display = 'none');
  const inicio = document.getElementById('inicio');
  if (inicio) {
    inicio.style.display = 'block';
    inicio.classList.add('activa');
  }
  cargarInicio();
};