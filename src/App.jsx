import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import FilterBar from './components/FilterBar';
import MovieCard from './components/MovieCard';
import TrailerModal from './components/TrailerModal';
import { discoverMovies, searchMovies, getMovieVideos, getMovieDetails, getGenres } from './api/tdb';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    durationMin: null,
    durationMax: null,
    durationLabel: null,
    genre: null,
    platform: null,
    mood: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [trailerKey, setTrailerKey] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [genreMap, setGenreMap] = useState({});

  useEffect(() => {
    getGenres().then(data => {
      const map = {};
      (data.genres || []).forEach(g => {
        map[g.id] = g.name;
      });
      setGenreMap(map);
    });
  }, []);

  const fetchMovies = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await discoverMovies({
        ...filters,
        page: pageNum
      });
      
      const moviesWithDetails = await Promise.all(
        (data.results || []).map(async (movie) => {
          if (!movie.runtime) {
            try {
              const details = await getMovieDetails(movie.id);
              return { ...movie, runtime: details.runtime };
            } catch {
              return movie;
            }
          }
          return movie;
        })
      );
      
      if (append) {
        setMovies(prev => [...prev, ...moviesWithDetails]);
      } else {
        setMovies(moviesWithDetails);
      }
      setTotalPages(data.total_pages || 0);
    } catch (err) {
      setError('Failed to load movies. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const performSearch = useCallback(async (query, pageNum = 1, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchMovies(query, pageNum);
      
      const moviesWithDetails = await Promise.all(
        (data.results || []).map(async (movie) => {
          if (!movie.runtime) {
            try {
              const details = await getMovieDetails(movie.id);
              return { ...movie, runtime: details.runtime };
            } catch {
              return movie;
            }
          }
          return movie;
        })
      );
      
      if (append) {
        setMovies(prev => [...prev, ...moviesWithDetails]);
      } else {
        setMovies(moviesWithDetails);
      }
      setTotalPages(data.total_pages || 0);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setPage(1);
      fetchMovies(1);
    }
  }, [filters, fetchMovies, searchQuery]);

  useEffect(() => {
    if (searchQuery) {
      setPage(1);
      performSearch(searchQuery, 1);
    }
  }, [searchQuery, performSearch]);

  useEffect(() => {
    if (page > 1) {
      if (searchQuery) {
        performSearch(searchQuery, page, true);
      } else {
        fetchMovies(page, true);
      }
    }
  }, [page, fetchMovies, performSearch, searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    setPage(1);
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      setPage(prev => prev + 1);
    }
  };

  const handleWatchTrailer = async (movieId) => {
    try {
      const movie = movies.find(m => m.id === movieId);
      setSelectedMovie(movie);
      
      const key = await getMovieVideos(movieId);
      if (key) {
        setTrailerKey(key);
      } else {
        alert('No trailer available for this movie.');
      }
    } catch (err) {
      console.error('Failed to load trailer:', err);
      alert('Failed to load trailer.');
    }
  };

  const handleCloseModal = () => {
    setTrailerKey(null);
    setSelectedMovie(null);
  };

  const getGenreNames = (genreIds) => {
    return genreIds?.map(id => genreMap[id]).filter(Boolean) || [];
  };

  return (
    <div className="app">
      <Header />
      <SearchBar onSearch={handleSearch} onClear={handleClearSearch} />
      <FilterBar filters={filters} onFilterChange={setFilters} isSearching={isSearching} />
      
      <main className="main-content">
        {searchQuery && (
          <div className="search-results-header">
            <h2>Search results for "{searchQuery}"</h2>
            <span className="results-count">{movies.length} movies found</span>
          </div>
        )}
        
        {error && <div className="error-message">{error}</div>}
        
        {loading && movies.length === 0 ? (
          <div className="loading-state">
            <div className="projector">
              <div className="film-reel"></div>
              <div className="film-reel"></div>
            </div>
            <p>Loading movies...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3>No movies found</h3>
            <p>Try adjusting your filters or search for something else</p>
          </div>
        ) : (
          <>
            <div className="movie-grid">
              {movies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={{
                    ...movie,
                    genreNames: getGenreNames(movie.genre_ids)
                  }}
                  onWatchTrailer={handleWatchTrailer}
                />
              ))}
            </div>
            
            {page < totalPages && (
              <div className="load-more-container">
                <button 
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Movies'}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {trailerKey && (
        <TrailerModal
          movie={selectedMovie}
          trailerKey={trailerKey}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default App;
