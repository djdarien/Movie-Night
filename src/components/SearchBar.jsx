import { useState, useEffect, useRef } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch, onClear }) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
        handleClear();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (e.target.value === '') {
      onClear();
    }
  };

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className={`search-input-wrapper ${isFocused ? 'focused' : ''}`}>
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Search movies by title..."
            className="search-input"
          />
          {query && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={handleClear}
            >
              ×
            </button>
          )}
        </div>
        <button type="submit" className="search-btn">
          Search
        </button>
      </form>
      <p className="search-hint">Press / to search, Esc to clear</p>
    </div>
  );
}

export default SearchBar;
