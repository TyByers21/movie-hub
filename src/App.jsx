import React, {useState, useEffect} from 'react'
import {useDebounce} from "react-use";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";


    const API_BASE_URL = 'https://api.themoviedb.org/3/';

    const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

    const API_OPTIONS = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${API_KEY}`
        }
    }

const App = () => {
    const [searchTerm, setSearchTerm] = useState("");

    const [errorMessage, setErrorMessage] = useState(null);

    const [movieList, setMovieList] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [trending, setTrending] = useState([]);


    useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

    const fetchMovies = async(query = '') => {

        setIsLoading(true);
        setErrorMessage(null);
        try{
            const endpoint = query
               ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
               : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS)

            if(!response.ok){
                throw new Error("Failed to fetch movies");
            }
            const data = await response.json();

            console.log(data);

            if(data.Response === 'False'){
                setErrorMessage(data.Error || 'Failed to fetch movies')
                setMovieList([]);
            return;
            }
            setMovieList(data.results || []);

           if(query && data.results.length >0){
               await updateSearchCount(query, data.results[0]);
           }

        } catch (error){
            console.log(`fetchMovies error: ${error}`)
            setErrorMessage('Error fetching movies.')
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async() => {
        try{
            const movies = await getTrendingMovies()
            setTrending(movies)

            return movies
        } catch (e) {
            console.log(`Error fetching trending movies: ${e}`)
        }
    }


    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    },[debouncedSearchTerm])

    useEffect(() => {
        loadTrendingMovies();
    },[])


    return (
        <main>
            <div className={'pattern'}/>

            <div className='wrapper'>
                <header className='header'>
                    <img src='/hero.png' />
                    <h1 className='title'>
                        Find <span className='text-gradient'>Movies</span>  You'll Enjoy Without The Hassle
                    </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trending.length > 0 && (
                    <section className='trending'>
                        <h2>Trending Movies</h2>
                        <ul>
                            {trending.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title}/>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
<section className='all-movies'>

<h2 >All Movies</h2>
    {isLoading ? (
       <Spinner />
    ) : errorMessage ? (
        <p className='text-red-500'>{errorMessage}</p>
    ) : (
        <ul>
            {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
            ))}
        </ul>
    )}

    {errorMessage}
</section>

            </div>
        </main>
    )
}
export default App
