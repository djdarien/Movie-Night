import { useEffect } from 'react';
import './TrailerModal.css';

function TrailerModal({ movie, trailerKey, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!trailerKey) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="trailer-header">
          <h2>{movie?.title}</h2>
          <p className="trailer-subtitle">Official Trailer</p>
        </div>
        <div className="video-container">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
            title="Movie Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default TrailerModal;
