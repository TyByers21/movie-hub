import React, { useState, useEffect } from 'react';
import { useDebounce } from "react-use";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import MovieModal from "./components/MovieModal.jsx";
import { getTrendingMovies, updateSearchCount } from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3/';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
};

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [errorMessage, setErrorMessage] = useState(null);
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [trending, setTrending] = useState([]);

    const [selectedMovie, setSelectedMovie] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

    // Fetch search or popular movies
    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);
            if (!response.ok) throw new Error("Failed to fetch movies");

            const data = await response.json();
            if (data.Response === 'False') {
                setErrorMessage(data.Error || 'Failed to fetch movies');
                setMovieList([]);
                return;
            }
            setMovieList(data.results || []);

            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.error(`fetchMovies error: ${error}`);
            setErrorMessage('Error fetching movies.');
        } finally {
            setIsLoading(false);
        }
    };

    // Load trending from Appwrite DB
    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();
            setTrending(movies);
            return movies;
        } catch (e) {
            console.error(`Error fetching trending movies: ${e}`);
        }
    };

    // Fetch full details for a movie
    const handleMovieClick = async (movieId) => {
        setModalLoading(true);
        setModalError(null);
        setIsModalOpen(true);

        try {
            const res = await fetch(
                `${API_BASE_URL}/movie/${movieId}?append_to_response=videos,credits`,
                API_OPTIONS
            );
            if (!res.ok) throw new Error("Failed to fetch movie details");

            const data = await res.json();
            setSelectedMovie(data);
        } catch (err) {
            console.error("Error fetching movie details:", err);
            setModalError("Could not load movie details.");
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setSelectedMovie(null);
        setIsModalOpen(false);
        setModalError(null);
    };

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header className="header">
                    <img src="/hero.png" alt="Hero" />
                    <h1 className="title">
                        Find <span className="text-gradient">Movies</span> You'll Enjoy Without The Hassle
                    </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trending.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trending.map((movie, index) => (
                                <li
                                    key={movie.$id}
                                    onClick={() => handleMovieClick(movie.tmdb_id)} // ← use TMDB id from DB
                                    style={{ cursor: "pointer" }}
                                >
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="all-movies">
                    <h2>All Movies</h2>
                    {isLoading ? (
                        <Spinner />
                    ) : errorMessage ? (
                        <p className="text-red-500">{errorMessage}</p>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard
                                    key={movie.id}
                                    movie={movie}
                                    onClick={() => handleMovieClick(movie.id)}
                                />
                            ))}
                        </ul>
                    )}
                </section>

                {isModalOpen && (
                    <MovieModal
                        movie={selectedMovie}
                        isLoading={modalLoading}
                        error={modalError}
                        onClose={closeModal}
                    />
                )}
            </div>
        </main>
    );
};

export default App;
