import React, { useEffect, useId, useState } from 'react';
import { AP_DISTRICTS, translations } from '../translations';

const AP_BOUNDS = { minLon: 76.5, minLat: 12.5, maxLon: 84.8, maxLat: 19.2 };
const SETTLEMENT_TYPES = new Set(['city', 'town', 'village', 'hamlet', 'isolated_dwelling', 'locality']);

export default function LocationFields({ district, location, lang = 'en', onChange }) {
  const listId = useId().replace(/:/g, '');
  const [locationSearch, setLocationSearch] = useState('');
  const [places, setPlaces] = useState([]);
  const [searching, setSearching] = useState(false);
  const t = (key) => translations[lang]?.[key] || key;

  useEffect(() => {
    const query = locationSearch.trim();
    if (!query) return undefined;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q: query,
          limit: '100',
          lang: lang === 'te' ? 'en' : lang,
          bbox: `${AP_BOUNDS.minLon},${AP_BOUNDS.minLat},${AP_BOUNDS.maxLon},${AP_BOUNDS.maxLat}`
        });
        const response = await fetch(`https://photon.komoot.io/api/?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Location search unavailable');
        const data = await response.json();
        const results = (data.features || []).filter((feature) => {
          const [lon, lat] = feature.geometry?.coordinates || [];
          const properties = feature.properties || {};
          return properties.countrycode?.toUpperCase() === 'IN'
            && (properties.state || '').toLowerCase().includes('andhra pradesh')
            && properties.osm_key === 'place'
            && SETTLEMENT_TYPES.has(properties.osm_value)
            && (properties.name || properties.city || properties.locality || '').toLowerCase().startsWith(query.toLowerCase())
            && lon >= AP_BOUNDS.minLon && lon <= AP_BOUNDS.maxLon
            && lat >= AP_BOUNDS.minLat && lat <= AP_BOUNDS.maxLat;
        }).map((feature) => {
          const properties = feature.properties || {};
          const placeName = properties.name || properties.city || properties.locality;
          const area = properties.district || properties.county || properties.city;
          const label = [placeName, area && area !== placeName ? area : null].filter(Boolean).join(', ');
          return {
            label,
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0]
          };
        }).filter((place) => place.label);
        setPlaces([...new Map(results.map((place) => [place.label, place])).values()]);
      } catch (error) {
        if (error.name !== 'AbortError') setPlaces([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [locationSearch, lang]);

  const districtPrefix = (district || '').trim().replace(/\s+(district|region)$/i, '');
  const districtMatches = AP_DISTRICTS.filter((item) => item.toLowerCase().startsWith(districtPrefix.toLowerCase()));

  return (
    <>
      <div className="form-group">
        <label className="form-label" htmlFor={`${listId}-district`}>{t('lbl_district')}</label>
        <input
          id={`${listId}-district`}
          className="form-input"
          list={`${listId}-district-options`}
          value={district || ''}
          onChange={(event) => {
            setLocationSearch('');
            setPlaces([]);
            onChange({ district: event.target.value, location: '', location_latitude: null, location_longitude: null });
          }}
          required
          autoComplete="address-level2"
        />
        <datalist id={`${listId}-district-options`}>
          {districtMatches.map((item) => <option key={item} value={item} />)}
        </datalist>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor={`${listId}-location`}>{t('lbl_location')}</label>
        <input
          id={`${listId}-location`}
          className="form-input"
          list={`${listId}-place-options`}
          value={location || ''}
          onChange={(event) => {
            const value = event.target.value;
            const place = places.find((item) => item.label === value);
            setLocationSearch(place ? '' : value);
            onChange({
              location: value,
              location_latitude: place?.latitude ?? null,
              location_longitude: place?.longitude ?? null
            });
          }}
          required
          autoComplete="address-level3"
        />
        <datalist id={`${listId}-place-options`}>
          {places.map((place) => <option key={`${place.label}-${place.latitude}`} value={place.label} />)}
        </datalist>
        <small style={{ color: '#64748b' }}>
          {searching ? (lang === 'te' ? 'ప్రాంతాలను వెతుకుతోంది...' : 'Searching places...') : '© OpenStreetMap contributors'}
        </small>
      </div>
    </>
  );
}