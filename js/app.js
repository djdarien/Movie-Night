import * as api from './api.js';

const state = {
  movies: [],
  filters: {
    durationMin: null,
    durationMax: null,
    genre: null,
    platform: null,
    mood: null
  },
  searchQuery: '',
  isSearching: false,
  page: 1,
  totalPages: 0,
  genreMap: {}
};

// DOM Elements
const movieGrid = document.getElementById('movie-grid');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const searchResultsHeader = document.getElementById('search-results-header');
const searchQueryText = document.getElementById('search-query-text');
const resultsCount = document.getElementById('results-count');
const filterBar = document.getElementById('filter-bar');
const moodChipsContainer = document.getElementById('mood-chips');
const genreBtn = document.getElementById('genre-btn');
const genreDropdown = document.getElementById('genre-dropdown');
const platformButtons = document.getElementById('platform-buttons');
const durationChipsContainer = document.getElementById('duration-chips');
const clearFiltersBtn = document.getElementById('clear-filters');
const searchingNotice = document.getElementById('searching-notice');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const errorMessage = document.getElementById('error-message');
const loadMoreContainer = document.getElementById('load-more-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const trailerModal = document.getElementById('trailer-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');
const modalSubtitle = document.getElementById('modal-subtitle');
const videoContainer = document.getElementById('video-container');

async function init() {
  try {
    const data = await api.getGenres();
    (data.genres || []).forEach(g => {
      state.genreMap[g.id] = g.name;
    });
    renderMoodChips();
    renderGenreDropdown();
    await fetchMovies();
  } catch (err) {
    showError('Failed to initialize application.');
  }
}

function renderMoodChips() {
  moodChipsContainer.innerHTML = '';
  Object.keys(api.MOOD_KEYWORDS).forEach(mood => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = mood.replace('-', ' ');
    chip.onclick = () => {
      state.filters.mood = state.filters.mood === mood ? null : mood;
      updateFilterUI();
      if (!state.isSearching) fetchMovies(true);
    };
    moodChipsContainer.appendChild(chip);
  });
}

function renderGenreDropdown() {
  genreDropdown.innerHTML = '';
  Object.entries(state.genreMap).forEach(([id, name]) => {
    const option = document.createElement('button');
    option.className = 'genre-option';
    option.textContent = name;
    option.onclick = () => {
      state.filters.genre = id;
      genreBtn.querySelector('span').textContent = name;
      genreDropdown.style.display = 'none';
      updateFilterUI();
      if (!state.isSearching) fetchMovies(true);
    };
    genreDropdown.appendChild(option);
  });
}

function updateFilterUI() {
  document.querySelectorAll('#mood-chips .chip').forEach(chip => {
    chip.classList.toggle('active', state.filters.mood === chip.textContent.toLowerCase().replace(' ', '-'));
  });
  
  document.querySelectorAll('.platform-btn').forEach(btn => {
    btn.classList.toggle('active', state.filters.platform === btn.dataset.platform);
  });

  document.querySelectorAll('#duration-chips .chip').forEach(chip => {
    const range = chip.dataset.duration;
    const isActive = (range === '90-120' && state.filters.durationMin === 90 && state.filters.durationMax === 120) ||
                      (range === '120-150' && state.filters.durationMin === 120 && state.filters.durationMax === 150) ||
                      (range === '150+' && state.filters.durationMin === 150);
    chip.classList.toggle('active', isActive);
  });
}

async function fetchMovies(reset = true) {
  if (reset) {
    state.page = 1;
    state.movies = [];
  }

  showLoading(true);
  showError(null);

  try {
    let data;
    if (state.isSearching) {
      data = await api.searchMovies(state.searchQuery, state.page);
    } else {
      data = await api.discoverMovies({ ...state.filters, page: state.page });
    }

    const results = data.results || [];
    const moviesWithDetails = await Promise.all(
      results.map(async (movie) => {
        if (!movie.runtime) {
          try {
            const details = await api.getMovieDetails(movie.id);
            return { ...movie, runtime: details.runtime };
          } catch { return movie; }
        }
        return movie;
      })
    );

    state.movies = reset ? moviesWithDetails : [...state.movies, ...moviesWithDetails];
    state.totalPages = data.total_pages || 0;
    renderMovies();
  } catch (err) {
    showError('Failed to load movies.');
  } finally {
    showLoading(false);
  }
}

function renderMovies() {
  movieGrid.innerHTML = '';
  if (state.movies.length === 0) {
    showEmptyState(true);
  } else {
    showEmptyState(false);
    state.movies.forEach(movie => {
      const genres = movie.genre_ids?.map(id => state.genreMap[id]).filter(Boolean).join(', ') || '';
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.innerHTML = `
        <div class="poster-container">
          <img class="poster" src="${movie.poster_path ? api.IMAGE_BASE_URL + movie.poster_path : ''}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/500x750?text=No+Image'">
          <div class="rating-badge">⭐ ${movie.vote_average?.toFixed(1)}</div>
          <div class="poster-overlay">
            <button class="trailer-btn" data-id="${movie.id}">Watch Trailer</button>
          </div>
        </div>
        <div class="movie-info">
          <h3 class="movie-title">${movie.title}</h3>
          <div class="movie-meta">
            <span class="year">${movie.release_date?.substring(0, 4) || 'N/A'}</span>
            <span class="runtime">${movie.runtime || 'N/A'} min</span>
          </div>
          <p class="movie-description">${movie.overview || 'No description available.'}</p>
          <div class="genres">
            ${genres.split(', ').map(g => `<span class="genre-tag">${g}</span>`).join('')}
          </div>
        </div>
      `;
      card.querySelector('.trailer-btn').onclick = () => openTrailer(movie.id, movie.title);
      movieGrid.appendChild(card);
    });
  }
  
  loadMoreContainer.style.display = state.page < state.totalPages ? 'flex' : 'none';
}

async function openTrailer(id, title) {
  const key = await api.getMovieVideos(id);
  if (!key) return alert('No trailer available.');

  modalTitle.textContent = title;
  modalSubtitle.textContent = 'Official Trailer';
  videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${key}" frameborder="0" allowfullscreen></iframe>`;
  trailerModal.style.display = 'flex';
}

function showLoading(isLoading) {
  loadingState.style.display = isLoading ? 'flex' : 'none';
}

function showEmptyState(isEmpty) {
  emptyState.style.display = isEmpty ? 'flex' : 'none';
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = msg ? 'block' : 'none';
}

// Event Listeners
searchForm.onsubmit = (e) => {
  e.preventDefault();
  state.searchQuery = searchInput.value;
  state.isSearching = !!state.searchQuery;
  state.page = 1;
  
  searchQueryText.textContent = state.searchQuery;
  searchResultsHeader.style.display = state.isSearching ? 'flex' : 'none';
  searchingNotice.style.display = state.isSearching ? 'block' : 'none';
  filterBar.classList.toggle('disabled', state.isSearching);
  
  fetchMovies(true);
};

searchInput.oninput = () => {
  clearSearchBtn.style.display = searchInput.value ? 'flex' : 'none';
};

clearSearchBtn.onclick = () => {
  searchInput.value = '';
  state.searchQuery = '';
  state.isSearching = false;
  clearSearchBtn.style.display = 'none';
  searchResultsHeader.style.display = 'none';
  searchingNotice.style.display = 'none';
  filterBar.classList.remove('disabled');
  fetchMovies(true);
};

genreBtn.onclick = () => {
  genreDropdown.style.display = genreDropdown.style.display === 'none' ? 'block' : 'none';
};

platformButtons.onclick = (e) => {
  if (e.target.classList.contains('platform-btn')) {
    const platform = e.target.dataset.platform;
    state.filters.platform = state.filters.platform === platform ? null : platform;
    updateFilterUI();
    if (!state.isSearching) fetchMovies(true);
  }
};

durationChipsContainer.onclick = (e) => {
  if (e.target.classList.contains('chip')) {
    const range = e.target.dataset.duration;
    if (range === '90-120') { state.filters.durationMin = 90; state.filters.durationMax = 120; }
    else if (range === '120-150') { state.filters.durationMin = 120; state.filters.durationMax = 150; }
    else if (range === '150+') { state.filters.durationMin = 150; state.filters.durationMax = null; }
    else { state.filters.durationMin = null; state.filters.durationMax = null; }
    
    updateFilterUI();
    if (!state.isSearching) fetchMovies(true);
  }
};

clearFiltersBtn.onclick = () => {
  state.filters = { durationMin: null, durationMax: null, genre: null, platform: null, mood: null };
  genreBtn.querySelector('span').textContent = 'Select Genre';
  updateFilterUI();
  fetchMovies(true);
};

loadMoreBtn.onclick = () => {
  state.page++;
  fetchMovies(false);
};

closeModalBtn.onclick = () => {
  trailerModal.style.display = 'none';
  videoContainer.innerHTML = '';
};

window.onclick = (e) => {
  if (e.target === trailerModal) closeModalBtn.onclick();
};

init();
