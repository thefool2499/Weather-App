export default async (request) => {
  const url  = new URL(request.url);
  const type  = url.searchParams.get('type');   // ← changed from 'endpoint'
  const query = url.searchParams.get('query');

  const API_KEY  = Netlify.env.get('API_KEY');
  const BASE_URL = 'https://api.openweathermap.org/data/2.5';

  const decodedQuery = decodeURIComponent(query);
  const apiRes = await fetch(`${BASE_URL}/${type}?${decodedQuery}&appid=${API_KEY}`);
  const data   = await apiRes.json();

  return new Response(JSON.stringify(data), {
    status: apiRes.status,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const config = { path: '/api/weather' };