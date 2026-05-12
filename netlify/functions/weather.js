export default async (request) => {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint'); // e.g. 'weather', 'forecast', 'air_pollution'
  const query    = url.searchParams.get('query');    // everything after the endpoint

  const API_KEY  = Netlify.env.get('API_KEY');
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  const apiRes  = await fetch(`${BASE_URL}/${endpoint}?${query}&appid=${API_KEY}`);
  const data    = await apiRes.json();

  return new Response(JSON.stringify(data), {
    status: apiRes.status,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/weather' };