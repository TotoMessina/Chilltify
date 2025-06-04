import { canciones } from "./data.js";
import { reproducirPorIndice } from "./player.js";
import { showNotification } from "./state.js";

let timeoutId;
let cacheBusqueda = new Map();

export function inicializarBusqueda() {
  const searchInput = document.querySelector(".header input");
  const seccionBuscar = document.getElementById("buscar");
  const contenedorBusqueda = document.querySelector("#buscar .card-grid");
  
  // Agregar filtros de búsqueda
  const filtrosContainer = document.createElement("div");
  filtrosContainer.className = "search-filters";
  filtrosContainer.innerHTML = `
    <button class="filter-btn active" data-filter="all">Todos</button>
    <button class="filter-btn" data-filter="songs">Canciones</button>
    <button class="filter-btn" data-filter="artists">Artistas</button>
    <button class="filter-btn" data-filter="genres">Géneros</button>
  `;
  seccionBuscar.insertBefore(filtrosContainer, contenedorBusqueda);
  
  let filtroActual = "all";
  
  // Event listeners para filtros
  filtrosContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("filter-btn")) {
      filtrosContainer.querySelectorAll(".filter-btn").forEach(btn => {
        btn.classList.remove("active");
      });
      e.target.classList.add("active");
      filtroActual = e.target.dataset.filter;
      realizarBusqueda(searchInput.value, filtroActual);
    }
  });
  
  searchInput.addEventListener("input", (e) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      realizarBusqueda(e.target.value, filtroActual);
    }, 300);
  });
  
  function realizarBusqueda(termino, filtro) {
    const terminoLower = termino.toLowerCase();
    const cacheKey = `${terminoLower}-${filtro}`;
    
    // Verificar caché
    if (cacheBusqueda.has(cacheKey)) {
      mostrarResultadosBusqueda(cacheBusqueda.get(cacheKey));
      return;
    }
    
    let resultados = [];
    
    switch (filtro) {
      case "songs":
        resultados = canciones.filter(c => 
          c.titulo.toLowerCase().includes(terminoLower)
        );
        break;
      case "artists":
        resultados = canciones.filter(c => 
          c.artista.toLowerCase().includes(terminoLower)
        );
        break;
      case "genres":
        resultados = canciones.filter(c => 
          c.genero.toLowerCase().includes(terminoLower)
        );
        break;
      default:
        resultados = canciones.filter(c => 
          c.titulo.toLowerCase().includes(terminoLower) || 
          c.artista.toLowerCase().includes(terminoLower) ||
          c.genero.toLowerCase().includes(terminoLower)
        );
    }
    
    // Guardar en caché
    cacheBusqueda.set(cacheKey, resultados);
    
    // Limpiar caché antigua
    if (cacheBusqueda.size > 100) {
      const primeraKey = cacheBusqueda.keys().next().value;
      cacheBusqueda.delete(primeraKey);
    }
    
    mostrarResultadosBusqueda(resultados);
  }
  
  function mostrarResultadosBusqueda(resultados) {
    contenedorBusqueda.innerHTML = "";
    
    if (resultados.length === 0) {
      contenedorBusqueda.innerHTML = `
        <div class="empty-state">
          <p class="empty-message">No se encontraron resultados.</p>
          <p class="empty-submessage">Intenta con otros términos de búsqueda</p>
        </div>
      `;
      return;
    }
    
    resultados.forEach((cancion, i) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img loading="lazy" src="${cancion.imagen}" alt="${cancion.titulo}" />
        <h3>${cancion.titulo}</h3>
        <p>${cancion.artista}</p>
        <span class="genre-tag">${cancion.genero}</span>
      `;
      
      card.addEventListener("click", () => {
        const indexOriginal = canciones.findIndex(c => c.id === cancion.id);
        reproducirPorIndice(indexOriginal);
        showNotification(`Reproduciendo: ${cancion.titulo}`, "info");
      });
      
      contenedorBusqueda.appendChild(card);
    });
  }
  
  // Agregar estilos
  const style = document.createElement("style");
  style.textContent = `
    .search-filters {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0 1rem;
    }
    
    .filter-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 20px;
      background: #282828;
      color: #b3b3b3;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .filter-btn:hover {
      background: #383838;
      color: white;
    }
    
    .filter-btn.active {
      background: #1db954;
      color: white;
    }
    
    .genre-tag {
      font-size: 0.8rem;
      padding: 0.2rem 0.5rem;
      background: #282828;
      border-radius: 10px;
      color: #b3b3b3;
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