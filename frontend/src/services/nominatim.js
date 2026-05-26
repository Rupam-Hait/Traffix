const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

function normalizePlace(place) {
  const title =
    place.name ||
    place.display_name?.split(',').slice(0, 2).join(',') ||
    'Selected place';

  return {
    id: `${place.place_id}-${place.lat}-${place.lon}`,
    name: title,
    address: place.display_name,
    lat: Number(place.lat),
    lng: Number(place.lon),
  };
}

export async function searchPlaces(query) {
  const url = new URL(`${NOMINATIM_URL}/search`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('q', query);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) {
    throw new Error('Place search is temporarily unavailable.');
  }

  const data = await response.json();
  return data.map(normalizePlace);
}

export async function reverseGeocode(lat, lng) {
  const url = new URL(`${NOMINATIM_URL}/reverse`);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return normalizePlace(data);
}
