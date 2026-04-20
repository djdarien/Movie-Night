import { useEffect, useState, useRef } from 'react';
import { getGenres } from '../api/tdb';
import './FilterBar.css';

const DURATION_OPTIONS = [
  { label: 'Under 90 min', min: 0, max: 89 },
  { label: '90 min', min: 90, max: 90 },
  { label: '1h 30min', min: 85, max: 95 },
  { label: '2h 30min', min: 145, max: 155 },
  { label: '3h+', min: 180, max: null },
];

const PLATFORMS = [
  { id: 'netflix', name: 'Netflix', color: '#E50914' },
  { id: 'disney-plus', name: 'Disney+', color: '#0063e5' },
  { id: 'prime-video', name: 'Prime Video', color: '#00a8e1' },
];

const MOODS = [
  { id: 'feel-good', name: 'Feel-Good', emoji: '😊' },
  { id: 'romantic', name: 'Romantic', emoji: '💕' },
  { id: 'funny', name: 'Funny', emoji: '😂' },
  { id: 'adventurous', name: 'Adventurous', emoji: '🗺️' },
  { id: 'thought-provoking', name: 'Thought-Provoking', emoji: '🤔' },
  { id: 'intense', name: 'Intense', emoji: '😰' },
  { id: 'inspiring', name: 'Inspiring', emoji: '✨' },
  { id: 'suspenseful', name: 'Suspenseful', emoji: '😰' },
];

function FilterBar({ filters, onFilterChange, isSearching }) {
  const [genres, setGenres] = useState([]);
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [showMoodDropdown, setShowMoodDropdown] = useState(false);
  const genreDropdownRef = useRef(null);
  const moodDropdownRef = useRef(null);

  useEffect(() => {
    getGenres().then(data => setGenres(data.genres || []));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target)) {
        setShowGenreDropdown(false);
      }
      if (moodDropdownRef.current && !moodDropdownRef.current.contains(event.target)) {
        setShowMoodDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDurationClick = (duration) => {
    onFilterChange({
      ...filters,
      durationMin: duration.min,
      durationMax: duration.max,
      durationLabel: duration.label
    });
  };

  const handleGenreSelect = (genreId) => {
    onFilterChange({
      ...filters,
      genre: filters.genre === genreId ? null : genreId
    });
    setShowGenreDropdown(false);
  };

  const handlePlatformToggle = (platformId) => {
    onFilterChange({
      ...filters,
      platform: filters.platform === platformId ? null : platformId
    });
  };

  const handleMoodSelect = (moodId) => {
    onFilterChange({
      ...filters,
      mood: filters.mood === moodId ? null : moodId
    });
    setShowMoodDropdown(false);
  };

  const clearFilters = () => {
    onFilterChange({
      durationMin: null,
      durationMax: null,
      durationLabel: null,
      genre: null,
      platform: null,
      mood: null
    });
  };

  const selectedGenre = genres.find(g => g.id === filters.genre);
  const selectedMood = MOODS.find(m => m.id === filters.mood);

  return (
    <div className={`filter-bar ${isSearching ? 'disabled' : ''}`}>
      <div className="filter-section">
        <label className="filter-label">Duration</label>
        <div className="filter-chips">
          {DURATION_OPTIONS.map((duration) => (
            <button
              key={duration.label}
              className={`chip ${filters.durationLabel === duration.label ? 'active' : ''}`}
              onClick={() => handleDurationClick(duration)}
              disabled={isSearching}
            >
              {duration.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Genre</label>
        <div className="genre-dropdown-container" ref={genreDropdownRef}>
          <button
            className="genre-button"
            onClick={() => !isSearching && setShowGenreDropdown(!showGenreDropdown)}
            disabled={isSearching}
          >
            {selectedGenre ? selectedGenre.name : 'All Genres'}
            <span className="dropdown-arrow">▼</span>
          </button>
          {showGenreDropdown && !isSearching && (
            <div className="genre-dropdown">
              <button
                className={`genre-option ${!filters.genre ? 'selected' : ''}`}
                onClick={() => handleGenreSelect(null)}
              >
                All Genres
              </button>
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  className={`genre-option ${filters.genre === genre.id ? 'selected' : ''}`}
                  onClick={() => handleGenreSelect(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Mood</label>
        <div className="genre-dropdown-container" ref={moodDropdownRef}>
          <button
            className="genre-button"
            onClick={() => !isSearching && setShowMoodDropdown(!showMoodDropdown)}
            disabled={isSearching}
          >
            {selectedMood ? `${selectedMood.emoji} ${selectedMood.name}` : 'Any Mood'}
            <span className="dropdown-arrow">▼</span>
          </button>
          {showMoodDropdown && !isSearching && (
            <div className="genre-dropdown">
              <button
                className={`genre-option ${!filters.mood ? 'selected' : ''}`}
                onClick={() => handleMoodSelect(null)}
              >
                Any Mood
              </button>
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  className={`genre-option ${filters.mood === mood.id ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(mood.id)}
                >
                  {mood.emoji} {mood.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">Platform</label>
        <div className="platform-buttons">
          {PLATFORMS.map((platform) => (
            <button
              key={platform.id}
              className={`platform-btn ${filters.platform === platform.id ? 'active' : ''}`}
              style={{ '--platform-color': platform.color }}
              onClick={() => handlePlatformToggle(platform.id)}
              disabled={isSearching}
            >
              {platform.name}
            </button>
          ))}
        </div>
      </div>

      {(filters.durationLabel || filters.genre || filters.platform || filters.mood) && (
        <button className="clear-btn" onClick={clearFilters} disabled={isSearching}>
          Clear All Filters
        </button>
      )}

      {isSearching && (
        <div className="searching-notice">
          Filters disabled during search
        </div>
      )}
    </div>
  );
}

export default FilterBar;
