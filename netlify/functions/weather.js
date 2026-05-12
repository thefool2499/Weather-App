export default async (request) => {
  const url   = new URL(request.url);
  const type  = url.searchParams.get('type');
  const query = url.searchParams.get('query');

  const API_KEY  = Netlify.env.get('API_KEY');
  const OWM_BASE = 'https://api.openweathermap.org';

  let apiUrl;

  if (type === 'geo') {
    // Autocomplete/suggestions — uses geo endpoint
    const decodedQuery = decodeURIComponent(query);
    apiUrl = `${OWM_BASE}/geo/1.0/direct?${decodedQuery}&limit=5&appid=${API_KEY}`;
  } else if (type === 'air_pollution') {
    // AQI
    const decodedQuery = decodeURIComponent(query);
    apiUrl = `${OWM_BASE}/data/2.5/air_pollution?${decodedQuery}&appid=${API_KEY}`;
  } else {
    // weather or forecast
    const decodedQuery = decodeURIComponent(query);
    apiUrl = `${OWM_BASE}/data/2.5/${type}?${decodedQuery}&appid=${API_KEY}&units=metric`;
  }

  const apiRes = await fetch(apiUrl);
  const data   = await apiRes.json();

  return new Response(JSON.stringify(data), {
    status:  apiRes.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const config = { path: '/api/weather' };