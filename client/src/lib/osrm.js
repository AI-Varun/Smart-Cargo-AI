const OSRM_BASE_URL = import.meta.env.VITE_OSRM_BASE_URL || 'https://router.project-osrm.org';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export async function searchAddress(query) {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=5`
    );
    const data = await response.json();
    return data.map(item => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      importance: item.importance
    }));
  } catch (error) {
    console.error('Error searching address:', error);
    return [];
  }
}

export async function getRoute(start, end) {
  try {
    const response = await fetch(
      `${OSRM_BASE_URL}/route/v1/driving/${start.join(',')};${end.join(',')}`
    );
    const data = await response.json();
    return data.routes[0];
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
}
