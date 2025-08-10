import React from 'react';

const MovieModal = ({ movie, onClose }) => {
    if (!movie) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>

                <img
                    src={movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : `/no-movie.png`}
                    alt={movie.title}
                />
                <h2>{movie.title}</h2>
                <p><strong>Release Date:</strong> {movie.release_date}</p>
                <p><strong>Language:</strong> {movie.original_language}</p>
                <p><strong>Rating:</strong> {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</p>
                <p>{movie.overview || "No description available."}</p>
            </div>
        </div>
    );
};

export default MovieModal;
