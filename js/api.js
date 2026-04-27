const API_KEY = 'e96047d1dc01082a4aca6ad912f36b61';
const BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const PLATFORM_MAP = {
  netflix: 8,
  'disney-plus': 337,
  'prime-video': 9
};

export const MOOD_KEYWORDS = {
  'feel-good': [13089, 9713, 10596, 9826],
  'intense': [9663, 10714, 10702],
  'thought-provoking': [9840, 9951, 10183],
  'romantic': [9837, 13088, 12192],
  'date-night': [9837, 13088, 12192, 9713], // Romantic + feel-good
  'adventurous': [9663, 10596, 9715],
  'funny': [9713, 10596],
  'suspenseful': [9663, 10714],
  'inspiring': [9840, 13089]
};

// Content filter: removing movies related to suicide and schizophrenia
// These are keyword IDs from TMDB that match those themes
const SENSITIVE_KEYWORDS = [
  1931,  2103,  2104,  10491,  10492,  470,  14819,  2934,  9828,
  12217,  3393,  11056,  10778,  14551,  2325,  1828,  3265,  11083
];

async function fetchFromTMDB(endpoint, params = {}) {
  const searchParams = new URLSearchParams({
    api_key: API_KEY,
    ...params
  });
  const response = await fetch(`${BASE_URL}${endpoint}?${searchParams}`);
  if (!response.ok) throw new Error('API request failed');
  return response.json();
}

export async function getGenres() {
  return fetchFromTMDB('/genre/movie/list');
}

export async function discoverMovies(filters = {}) {
  const { genre, durationMin, durationMax, platform, mood, decade, page = 1 } = filters;
  
  const params = {
    language: 'en-US',
    sort_by: 'popularity.desc',
    include_adult: false,
    page,
  };

  if (genre) params.with_genres = genre;
  if (durationMin) params['with_runtime.gte'] = durationMin;
  if (durationMax) params['with_runtime.lte'] = durationMax;
  
  if (platform) {
    const providerId = PLATFORM_MAP[platform];
    if (providerId) {
      params.with_watch_providers = providerId;
      params.watch_region = 'US';
    }
  }
  
  if (mood && MOOD_KEYWORDS[mood]) {
    const moodKeywords = MOOD_KEYWORDS[mood].join('|');
    params.with_keywords = moodKeywords;
  }

  if (decade) {
    const startYear = decade.replace('s', '');
    const endYear = (parseInt(startYear) + 9).toString();
    params['primary_release_date.gte'] = `${startYear}-01-01`;
    params['primary_release_date.lte'] = `${endYear}-12-31`;
  }
  
  // Apply the safety filter
  if (SENSITIVE_KEYWORDS.length > 0) {
    params.without_keywords = SENSITIVE_KEYWORDS.join(',');
  }
  
  return fetchFromTMDB('/discover/movie', params);
}

export async function getMovieVideos(movieId) {
  const data = await fetchFromTMDB(`/movie/${movieId}/videos`);
  const trailer = data.results?.find(
    video => video.type === 'Trailer' && video.site === 'YouTube'
  );
  return trailer?.key || null;
}

export async function searchMovies(query, page = 1) {
  const params = {
    query,
    page,
    include_adult: false,
    language: 'en-US'
  };
  
  // Apply safety filter to search as well
  if (SENSITIVE_KEYWORDS.length > 0) {
    params.without_keywords = SENSITIVE_KEYWORDS.join(',');
  }
  
  return fetchFromTMDB('/search/movie', params);
}

export async function getMovieDetails(movieId) {
  return fetchFromTMDB(`/movie/${movieId}`, {
    append_to_response: 'keywords'
  });
}
