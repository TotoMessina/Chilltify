import { canciones } from "./data.js";
import { toggleFavorito } from "./data.js";
import { showNotification } from "./state.js";

export function inicializarFavoritos() {
  const seccionFavoritos = document.getElementById("favoritos");
  const contenedorFavoritos = document.querySelector("#favoritos .card-grid");
  
  // Botón para alternar favorito en cada tarjeta
  document.querySelectorAll(".card").forEach((card, index) => {
    const favBtn = document.createElement("button");
    favBtn.className = "favorite-btn";
    favBtn.setAttribute("aria-label", "Marcar como favorito");
    favBtn.innerHTML = canciones[index].favorita ? "❤️" : "🤍";
    card.appendChild(favBtn);
    
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const esFavorita = toggleFavorito(canciones[index].id);
      
      // Animación
      favBtn.classList.add("animating");
      setTimeout(() => favBtn.classList.remove("animating"), 300);
      
      // Actualizar icono
      favBtn.innerHTML = esFavorita ? "❤️" : "🤍";
      
      // Notificación
      showNotification(
        esFavorita 
          ? `${canciones[index].titulo} agregada a favoritos` 
          : `${canciones[index].titulo} removida de favoritos`,
        "success"
      );
      
      actualizarVistaFavoritos();
    });
  });
  
  function actualizarVistaFavoritos() {
    contenedorFavoritos.innerHTML = "";
    const favoritas = canciones.filter(c => c.favorita);
    
    if (favoritas.length === 0) {
      contenedorFavoritos.innerHTML = `
        <div class="empty-state">
          <p class="empty-message">No tienes canciones favoritas aún.</p>
          <p class="empty-submessage">Agrega canciones a favoritos haciendo clic en el corazón ❤️</p>
        </div>
      `;
      return;
    }
    
    favoritas.forEach(cancion => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img loading="lazy" src="${cancion.imagen}" alt="${cancion.titulo}" />
        <h3>${cancion.titulo}</h3>
        <p>${cancion.artista}</p>
        <button class="favorite-btn active" aria-label="Quitar de favoritos">❤️</button>
      `;
      
      // Agregar evento de clic para reproducir
      card.addEventListener("click", () => {
        const index = canciones.findIndex(c => c.id === cancion.id);
        if (index !== -1) {
          window.reproducirPorIndice(index);
        }
      });
      
      contenedorFavoritos.appendChild(card);
    });
  }
  
  // Inicializar vista
  actualizarVistaFavoritos();
  
  // Agregar estilos para animaciones
  const style = document.createElement("style");
  style.textContent = `
    .favorite-btn {
      transition: transform 0.3s ease;
    }
    
    .favorite-btn.animating {
      transform: scale(1.3);
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
}