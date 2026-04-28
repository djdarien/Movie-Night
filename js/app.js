import * as api from './api.js';

const state = {
  movies: [],
  filters: {
    durationMin: null,
    durationMax: null,
    genre: null,
    platform: null,
    mood: null,
    decade: null
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
const decadeChipsContainer = document.getElementById('decade-chips');
const surpriseMeBtn = document.getElementById('surprise-me-btn');
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
const detailsModal = document.getElementById('details-modal');
const closeDetailsModalBtn = document.getElementById('close-details-modal');
const detailsPoster = document.getElementById('details-poster');
const detailsTitle = document.getElementById('details-title');
const detailsYear = document.getElementById('details-year');
const detailsRating = document.getElementById('details-rating');
const detailsDuration = document.getElementById('details-duration');
const detailsGenres = document.getElementById('details-genres');
const detailsSynopsis = document.getElementById('details-synopsis');
const detailsDirector = document.getElementById('details-director');
const detailsCast = document.getElementById('details-cast');
const detailsLanguage = document.getElementById('details-language');
const detailsMoods = document.getElementById('details-moods');
const watchTrailerBtn = document.getElementById('watch-trailer-btn');
const addToWatchlistBtn = document.getElementById('add-to-watchlist-btn');

async function init() {
  try {
    const data = await api.getGenres();
    (data.genres || []).forEach(g => {
      state.genreMap[g.id] = g.name;
    });
    renderMoodChips();
    renderDecadeChips();
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

function renderDecadeChips() {
  decadeChipsContainer.innerHTML = '';
  const decades = ['2020s', '2010s', '2000s', '1990s', '1980s'];
  decades.forEach(decade => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = decade;
    chip.onclick = () => {
      state.filters.decade = state.filters.decade === decade ? null : decade;
      updateFilterUI();
      if (!state.isSearching) fetchMovies(true);
    };
    decadeChipsContainer.appendChild(chip);
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

  document.querySelectorAll('#decade-chips .chip').forEach(chip => {
    chip.classList.toggle('active', state.filters.decade === chip.textContent);
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
      card.onclick = () => showMovieDetails(movie);
      card.querySelector('.trailer-btn').onclick = (e) => {
        e.stopPropagation();
        openTrailer(movie.id, movie.title);
      };
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

async function showMovieDetails(movie) {
  try {
    const details = await api.getMovieDetails(movie.id);
    const platformBadgesElement = document.getElementById('details-platform-badges');
    const watchlistText = document.getElementById('watchlist-text');
    // Main info
    detailsPoster.src = movie.poster_path ? api.IMAGE_BASE_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=No+Image';
    detailsPoster.alt = `${movie.title} poster`;
    detailsTitle.textContent = movie.title;
    detailsYear.textContent = movie.release_date?.substring(0, 4) || 'N/A';
    detailsRating.textContent = movie.vote_average?.toFixed(1) || 'N/A';
    detailsDuration.textContent = `${details.runtime || 'N/A'} min`;
    detailsGenres.innerHTML = movie.genre_ids?.map(id => `<span>${state.genreMap[id]}</span>`).join('') || '';
    detailsSynopsis.textContent = movie.overview || 'No description available.';
    detailsDirector.textContent = details.credits?.crew?.find(c => c.job === 'Director')?.name || 'N/A';
    detailsCast.textContent = details.credits?.cast?.slice(0, 3).map(c => c.name).join(', ') || 'N/A';
    detailsLanguage.textContent = details.original_language?.toUpperCase() || 'N/A';
    detailsMoods.textContent = 'Romantic, Cozy'; // Placeholder, can enhance
    // Extra info
    document.getElementById('details-budget').textContent = details.budget ? `$${details.budget.toLocaleString()}` : 'N/A';
    document.getElementById('details-revenue').textContent = details.revenue ? `$${details.revenue.toLocaleString()}` : 'N/A';
    document.getElementById('details-status').textContent = details.status || 'N/A';
    document.getElementById('details-imdb').innerHTML = details.imdb_id ? `<a href="https://www.imdb.com/title/${details.imdb_id}" target="_blank" rel="noopener" style="color:#ffe066;">IMDB</a>` : 'N/A';
    // Platform badges (simplified for demo)
    platformBadgesElement.innerHTML = '<span class="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded">NETFLIX</span>';
    detailsModal.style.display = 'flex';
    // Set up buttons
    watchTrailerBtn.onclick = () => {
      openTrailer(movie.id, movie.title);
      detailsModal.style.display = 'none';
    };
    addToWatchlistBtn.onclick = () => {
      alert('Added to watchlist! (Feature to be implemented)');
    };
  } catch (err) {
    showError('Failed to load movie details.');
  }
}

function hideDetailsModal() {
  detailsModal.style.display = 'none';
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
  state.filters = { durationMin: null, durationMax: null, genre: null, platform: null, mood: null, decade: null };
  genreBtn.querySelector('span').textContent = 'Select Genre';
  updateFilterUI();
  fetchMovies(true);
};

surpriseMeBtn.onclick = async () => {
  showLoading(true);
  try {
    const data = await api.discoverMovies({ page: Math.floor(Math.random() * 10) + 1 });
    const movies = data.results || [];
    if (movies.length > 0) {
      const randomMovie = movies[Math.floor(Math.random() * movies.length)];
      showMovieDetails(randomMovie);
    }
  } catch (err) {
    showError('Failed to find a surprise movie.');
  }
  showLoading(false);
};

decadeChipsContainer.onclick = (e) => {
  if (e.target.classList.contains('chip')) {
    const decade = e.target.textContent;
    state.filters.decade = state.filters.decade === decade ? null : decade;
    updateFilterUI();
    if (!state.isSearching) fetchMovies(true);
  }
};

loadMoreBtn.onclick = () => {
  state.page++;
  fetchMovies(false);
};

closeModalBtn.onclick = () => {
  trailerModal.style.display = 'none';
  videoContainer.innerHTML = '';
};

closeDetailsModalBtn.onclick = () => {
  detailsModal.style.display = 'none';
};

window.onclick = (e) => {
  if (e.target === trailerModal) closeModalBtn.onclick();
  if (e.target === detailsModal) closeDetailsModalBtn.onclick();
};

window.onkeydown = (e) => {
  if (e.key === 'Escape') {
    if (trailerModal.style.display === 'flex') closeModalBtn.onclick();
    if (detailsModal.style.display === 'flex') closeDetailsModalBtn.onclick();
  }
};

init();
