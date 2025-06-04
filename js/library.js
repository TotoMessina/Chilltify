import { canciones, playlists, agregarPlaylist, eliminarPlaylist, agregarCancionAPlaylist, eliminarCancionDePlaylist } from "./data.js";
import { showNotification } from "./state.js";
import { reproducirPorIndice } from "./player.js";

export function inicializarBiblioteca() {
  const contenedorBiblioteca = document.querySelector("#biblioteca .card-grid");
  
  function renderizarPlaylists() {
    contenedorBiblioteca.innerHTML = "";
    
    if (playlists.length === 0) {
      contenedorBiblioteca.innerHTML = `
        <div class="empty-state">
          <p class="empty-message">No tienes playlists aún.</p>
          <p class="empty-submessage">Crea una nueva playlist haciendo clic en el botón de abajo</p>
        </div>
      `;
      return;
    }
    
    playlists.forEach(playlist => {
      const card = document.createElement("div");
      card.className = "card playlist-card";
      
      // Obtener primera imagen de las canciones en la playlist
      const primeraCancion = canciones.find(c => c.id === playlist.canciones[0]);
      const imagen = primeraCancion ? primeraCancion.imagen : "assets/images/default-playlist.jpg";
      
      card.innerHTML = `
        <div class="playlist-header">
          <img loading="lazy" src="${imagen}" alt="${playlist.nombre}" />
          <div class="playlist-actions">
            <button class="action-btn play-btn" aria-label="Reproducir playlist">▶️</button>
            <button class="action-btn delete-btn" aria-label="Eliminar playlist">🗑️</button>
          </div>
        </div>
        <h3>${playlist.nombre}</h3>
        <p>${playlist.canciones.length} canciones</p>
        <div class="playlist-songs">
          ${playlist.canciones.slice(0, 3).map(id => {
            const cancion = canciones.find(c => c.id === id);
            return cancion ? `<span>${cancion.titulo}</span>` : '';
          }).join(' • ')}
        </div>
      `;
      
      // Event listeners
      card.querySelector('.play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (playlist.canciones.length > 0) {
          const primeraCancion = playlist.canciones[0];
          const index = canciones.findIndex(c => c.id === primeraCancion);
          reproducirPorIndice(index);
          showNotification(`Reproduciendo playlist: ${playlist.nombre}`, "info");
        }
      });
      
      card.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`¿Estás seguro de que quieres eliminar la playlist "${playlist.nombre}"?`)) {
          eliminarPlaylist(playlist.id);
          showNotification(`Playlist "${playlist.nombre}" eliminada`, "success");
          renderizarPlaylists();
        }
      });
      
      card.addEventListener('click', () => {
        mostrarDetallesPlaylist(playlist);
      });
      
      contenedorBiblioteca.appendChild(card);
    });
  }
  
  function mostrarDetallesPlaylist(playlist) {
    const modal = document.createElement('div');
    modal.className = 'playlist-modal';
    
    const cancionesEnPlaylist = playlist.canciones.map(id => 
      canciones.find(c => c.id === id)
    ).filter(Boolean);
    
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>${playlist.nombre}</h2>
          <button class="close-btn" aria-label="Cerrar">×</button>
        </div>
        <div class="modal-body">
          <div class="playlist-info">
            <img src="${cancionesEnPlaylist[0]?.imagen || 'assets/images/default-playlist.jpg'}" 
                 alt="${playlist.nombre}" />
            <div class="playlist-details">
              <p>${playlist.canciones.length} canciones</p>
              <p>Creada el ${new Date(playlist.fechaCreacion).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="songs-list">
            ${cancionesEnPlaylist.map((cancion, index) => `
              <div class="song-item">
                <span class="song-number">${index + 1}</span>
                <img src="${cancion.imagen}" alt="${cancion.titulo}" />
                <div class="song-info">
                  <h4>${cancion.titulo}</h4>
                  <p>${cancion.artista}</p>
                </div>
                <button class="remove-song" data-id="${cancion.id}" aria-label="Quitar canción">×</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.close-btn').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelectorAll('.remove-song').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cancionId = parseInt(btn.dataset.id);
        eliminarCancionDePlaylist(playlist.id, cancionId);
        showNotification(`Canción removida de ${playlist.nombre}`, "success");
        mostrarDetallesPlaylist(playlist);
      });
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // Botón para crear nueva playlist
  const addPlaylistBtn = document.createElement("button");
  addPlaylistBtn.className = "add-playlist";
  addPlaylistBtn.innerHTML = "+ Crear nueva playlist";
  document.querySelector("#biblioteca").appendChild(addPlaylistBtn);
  
  addPlaylistBtn.addEventListener("click", () => {
    const nombre = prompt("Nombre de la nueva playlist:");
    if (nombre) {
      if (nombre.trim().length < 3) {
        showNotification("El nombre debe tener al menos 3 caracteres", "error");
        return;
      }
      
      const nuevaPlaylist = agregarPlaylist(nombre);
      showNotification(`Playlist "${nombre}" creada`, "success");
      renderizarPlaylists();
    }
  });
  
  // Agregar estilos
  const style = document.createElement("style");
  style.textContent = `
    .playlist-card {
      position: relative;
      overflow: hidden;
    }
    
    .playlist-header {
      position: relative;
    }
    
    .playlist-actions {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(0, 0, 0, 0.7);
      opacity: 0;
      transition: opacity 0.3s;
    }
    
    .playlist-card:hover .playlist-actions {
      opacity: 1;
    }
    
    .action-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.2rem;
      transition: transform 0.2s;
    }
    
    .action-btn:hover {
      transform: scale(1.2);
    }
    
    .playlist-songs {
      font-size: 0.8rem;
      color: #b3b3b3;
      margin-top: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .playlist-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .modal-content {
      background: #282828;
      border-radius: 8px;
      width: 90%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #404040;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: #b3b3b3;
      font-size: 1.5rem;
      cursor: pointer;
    }
    
    .modal-body {
      padding: 1rem;
    }
    
    .playlist-info {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .playlist-info img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .song-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
      border-radius: 4px;
      transition: background 0.2s;
    }
    
    .song-item:hover {
      background: #383838;
    }
    
    .song-number {
      color: #b3b3b3;
      width: 2rem;
      text-align: center;
    }
    
    .song-item img {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .song-info {
      flex: 1;
    }
    
    .song-info h4 {
      margin: 0;
      font-size: 0.9rem;
    }
    
    .song-info p {
      margin: 0;
      font-size: 0.8rem;
      color: #b3b3b3;
    }
    
    .remove-song {
      background: none;
      border: none;
      color: #b3b3b3;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0.2rem;
    }
    
    .remove-song:hover {
      color: #ff4444;
    }
    
    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #b3b3b3;
    }
    
    .empty-message {
      font-size: 1.2rem;
      margin-bottom: 0.5rem;
    }
    
    .empty-submessage {
      font-size: 0.9rem;
    }
  `;
  document.head.appendChild(style);
  
  // Inicializar vista
  renderizarPlaylists();
}