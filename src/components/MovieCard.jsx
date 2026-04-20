import { useState } from 'react';
import { IMAGE_BASE_URL } from '../api/tdb';
import './MovieCard.css';

function MovieCard({ movie, onWatchTrailer }) {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const posterUrl = movie.poster_path 
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : null;

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const year = movie.release_date ? movie.release_date.split('-')[0] : '';
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : '';
  const overview = movie.overview || 'No description available.';

  const truncatedOverview = overview.length > 150 ? overview.slice(0, 150) + '...' : overview;

  return (
    <div className={`movie-card ${expanded ? 'expanded' : ''}`}>
      <div className="poster-container">
        {posterUrl && !imageError ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="poster"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="poster-placeholder">
            <span>No Poster</span>
          </div>
        )}
        <div className="poster-overlay">
          <button 
            className="trailer-btn"
            onClick={() => onWatchTrailer(movie.id)}
          >
            Watch Trailer
          </button>
        </div>
        <div className="rating-badge">
          <span className="star">★</span>
          <span>{rating}</span>
        </div>
      </div>
      
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <div className="movie-meta">
          <span className="year">{year}</span>
          {runtime && <span className="runtime">{runtime}</span>}
        </div>
        
        <p 
          className={`movie-description ${expanded ? 'full' : ''}`}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? overview : truncatedOverview}
          {overview.length > 150 && (
            <span className="read-more">
              {expanded ? ' Show less' : ' Read more'}
            </span>
          )}
        </p>
        
        {movie.genreNames && movie.genreNames.length > 0 && (
          <div className="genres">
            {movie.genreNames.slice(0, 3).map((genre, index) => (
              <span key={index} className="genre-tag">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
