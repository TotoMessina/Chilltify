import { state, showNotification } from './state.js';
import { playlists, agregarPlaylist, editarPlaylist, eliminarPlaylist, agregarCancionAPlaylist, eliminarCancionDePlaylist } from './data.js';

class PlaylistManager {
  constructor() {
    this.playlists = playlists;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Evento para crear nueva playlist
    document.querySelector('.create-playlist-btn')?.addEventListener('click', () => {
      this.mostrarModalCrearPlaylist();
    });

    // Evento para drag and drop
    document.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('song-item')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.songId);
      }
    });

    document.addEventListener('dragover', (e) => {
      if (e.target.classList.contains('playlist-drop-zone')) {
        e.preventDefault();
      }
    });

    document.addEventListener('drop', (e) => {
      if (e.target.classList.contains('playlist-drop-zone')) {
        e.preventDefault();
        const songId = parseInt(e.dataTransfer.getData('text/plain'));
        const playlistId = parseInt(e.target.dataset.playlistId);
        this.agregarCancionAPlaylist(playlistId, songId);
      }
    });
  }

  mostrarModalCrearPlaylist() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Crear Nueva Playlist</h2>
        <form id="create-playlist-form">
          <div class="form-group">
            <label for="playlist-name">Nombre</label>
            <input type="text" id="playlist-name" required>
          </div>
          <div class="form-group">
            <label for="playlist-description">Descripción</label>
            <textarea id="playlist-description"></textarea>
          </div>
          <div class="form-group">
            <label for="playlist-image">Imagen de portada</label>
            <input type="file" id="playlist-image" accept="image/*">
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancelar</button>
            <button type="submit" class="create-btn">Crear</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Manejar creación de playlist
    modal.querySelector('#create-playlist-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('playlist-name').value;
      const descripcion = document.getElementById('playlist-description').value;
      const imagenInput = document.getElementById('playlist-image');
      
      let imagen = null;
      if (imagenInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagen = e.target.result;
          this.crearPlaylist(nombre, descripcion, imagen);
          modal.remove();
        };
        reader.readAsDataURL(imagenInput.files[0]);
      } else {
        this.crearPlaylist(nombre, descripcion);
        modal.remove();
      }
    });

    // Manejar cancelación
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  crearPlaylist(nombre, descripcion, imagen) {
    const playlist = agregarPlaylist(nombre, descripcion, imagen);
    this.actualizarListaPlaylists();
    showNotification('Playlist creada exitosamente', 'success');
    return playlist;
  }

  editarPlaylist(id, datos) {
    if (editarPlaylist(id, datos)) {
      this.actualizarListaPlaylists();
      showNotification('Playlist actualizada exitosamente', 'success');
      return true;
    }
    return false;
  }

  eliminarPlaylist(id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta playlist?')) {
      eliminarPlaylist(id);
      this.actualizarListaPlaylists();
      showNotification('Playlist eliminada exitosamente', 'success');
      return true;
    }
    return false;
  }

  agregarCancionAPlaylist(playlistId, cancionId) {
    if (agregarCancionAPlaylist(playlistId, cancionId)) {
      this.actualizarListaPlaylists();
      showNotification('Canción agregada a la playlist', 'success');
      return true;
    }
    return false;
  }

  eliminarCancionDePlaylist(playlistId, cancionId) {
    if (eliminarCancionDePlaylist(playlistId, cancionId)) {
      this.actualizarListaPlaylists();
      showNotification('Canción eliminada de la playlist', 'success');
      return true;
    }
    return false;
  }

  actualizarListaPlaylists() {
    const playlistsContainer = document.querySelector('.playlists ul');
    if (!playlistsContainer) return;

    playlistsContainer.innerHTML = this.playlists.map(playlist => `
      <li class="playlist-item" data-playlist-id="${playlist.id}">
        <div class="playlist-info">
          <img src="${playlist.imagen}" alt="${playlist.nombre}" class="playlist-cover">
          <div class="playlist-details">
            <h4>${playlist.nombre}</h4>
            <p>${playlist.canciones.length} canciones</p>
          </div>
        </div>
        <div class="playlist-actions">
          <button class="edit-playlist-btn" title="Editar playlist">✏️</button>
          <button class="delete-playlist-btn" title="Eliminar playlist">🗑️</button>
        </div>
      </li>
    `).join('');

    // Agregar event listeners a los botones
    playlistsContainer.querySelectorAll('.edit-playlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playlistId = parseInt(e.target.closest('.playlist-item').dataset.playlistId);
        this.mostrarModalEditarPlaylist(playlistId);
      });
    });

    playlistsContainer.querySelectorAll('.delete-playlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const playlistId = parseInt(e.target.closest('.playlist-item').dataset.playlistId);
        this.eliminarPlaylist(playlistId);
      });
    });
  }

  mostrarModalEditarPlaylist(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Editar Playlist</h2>
        <form id="edit-playlist-form">
          <div class="form-group">
            <label for="edit-playlist-name">Nombre</label>
            <input type="text" id="edit-playlist-name" value="${playlist.nombre}" required>
          </div>
          <div class="form-group">
            <label for="edit-playlist-description">Descripción</label>
            <textarea id="edit-playlist-description">${playlist.descripcion || ''}</textarea>
          </div>
          <div class="form-group">
            <label for="edit-playlist-image">Imagen de portada</label>
            <input type="file" id="edit-playlist-image" accept="image/*">
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-btn">Cancelar</button>
            <button type="submit" class="save-btn">Guardar</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Manejar edición de playlist
    modal.querySelector('#edit-playlist-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = document.getElementById('edit-playlist-name').value;
      const descripcion = document.getElementById('edit-playlist-description').value;
      const imagenInput = document.getElementById('edit-playlist-image');
      
      const datos = { nombre, descripcion };
      
      if (imagenInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (e) => {
          datos.imagen = e.target.result;
          this.editarPlaylist(playlistId, datos);
          modal.remove();
        };
        reader.readAsDataURL(imagenInput.files[0]);
      } else {
        this.editarPlaylist(playlistId, datos);
        modal.remove();
      }
    });

    // Manejar cancelación
    modal.querySelector('.cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
}

export const playlistManager = new PlaylistManager(); 