document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;
  function applyTheme(theme) {
    if (theme === 'dark') { body.classList.add('dark'); themeToggle.textContent = '☀️'; }
    else { body.classList.remove('dark'); themeToggle.textContent = '🌙'; }
  }
  themeToggle.addEventListener('click', () => {
    const newTheme = body.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  });
  applyTheme(localStorage.getItem('theme') || 'light');

  const allSections = document.querySelectorAll('.section');
  const navMenu = document.querySelector('.nav-menu');

  function setActiveLink(sectionId) {
    document.querySelectorAll('.nav-link').forEach(a => {
      const on = a.getAttribute('href') === `#${sectionId}`;
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  function showSection(sectionId, push = true) {
    allSections.forEach(s => s.classList.toggle('active', s.id === sectionId));
    const target = document.getElementById(sectionId);
    const heading = target && target.querySelector('h2, h1');
    if (heading) { heading.setAttribute('tabindex','-1'); heading.focus(); }
    setActiveLink(sectionId);
    if (push) history.pushState({ sectionId }, '', `#${sectionId}`);
    window.scrollTo({ top: 0 });
  }

  window.addEventListener('popstate', (e) => {
    const target = (e.state && e.state.sectionId) || (location.hash ? location.hash.slice(1) : 'hero');
    showSection(target, false);
  });

  const initial = location.hash ? location.hash.slice(1) : 'hero';
  showSection(initial, false);

  navMenu.addEventListener('click', (event) => {
    if (event.target.matches('.nav-link')) {
      event.preventDefault();
      const sectionId = event.target.getAttribute('href').substring(1);
      showSection(sectionId);
      navMenu.classList.remove('open');
      document.getElementById('nav-toggle').setAttribute('aria-expanded','false');
    }
  });
  const cta = document.querySelector('.cta-button');
  if (cta) cta.addEventListener('click', (event) => {
    event.preventDefault();
    const sectionId = event.target.getAttribute('href').substring(1);
    showSection(sectionId);
  });

  const navToggle = document.getElementById('nav-toggle');
  navToggle.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  const MAPBOX_TOKEN = 'pk.eyJ1IjoiZGV2dXByZXRpIiwiYSI6ImNtNXdjZjlxaDAxZ24yanNneGF2Y2g1ZGMifQ.Ouc9ZSrfNJLKzs0ykgSFqA';
  const OPENWEATHER_KEY = '5ea16122404a77c5427779129155d036';
  const MULL_CENTER = { lng: -6.05, lat: 56.45 };
  const MULL_ZOOM = 9;

  let SITES_DATA = [
    { name: 'Kintra Bay', coords: [-6.3500, 56.3400], tags: ['flat', 'rest'] },
    { name: 'Ardalanish Peninsula', coords: [-6.2431, 56.2920], tags: ['firm'] },
    { name: 'Scarisdale River Valley', coords: [-6.0394, 56.4540], tags: ['flat', 'firm'] },
    { name: 'Glen More', coords: [-5.9040, 56.3916], tags: ['rest', 'firm'] },
    { name: 'Torosay Quarry Complex', coords: [-5.6832, 56.4463], tags: ['flat'] },
    { name: 'Lochdon Moraine Field', coords: [-5.6670, 56.4402], tags: ['firm', 'rest'] },
    { name: 'Loch na Keal Shore', coords: [-6.097537, 56.449877], tags: [] }
  ];

  const TOILETS_DATA = [
    { name: 'Iona', coords: [-6.3922237, 56.3302206] },
    { name: 'Fionnphort', coords: [-6.3692341, 56.3254217] },
    { name: 'TSL Contractors Office', coords: [-5.6902495, 56.4485739] },
    { name: 'Salen', coords: [-5.949668, 56.5179213] },
    { name: 'Craignure', coords: [-5.7068028, 56.4708733] }
  ];

  const siteImages = new Map();
  document.querySelectorAll('.site-card').forEach(card => {
    const siteName = card.dataset.siteName;
    const imgSrc = card.querySelector('.site-image img').src;
    if (siteName) siteImages.set(siteName, imgSrc);
  });
  SITES_DATA.forEach(site => { if (siteImages.has(site.name)) site.image = siteImages.get(site.name); });

  let mapInstance = null;
  let siteMarkers = [], toiletMarkers = [];
  let activePopup = null;

  function metersPerPixel(lat, zoom) {
    const earthCircumference = 40075016.686;
    return Math.cos(lat * Math.PI/180) * earthCircumference / (256 * Math.pow(2, zoom));
  }

  async function getSlope([lon, lat]) {
    try {
      const z = 14;
      const x = Math.floor((lon + 180) / 360 * Math.pow(2, z));
      const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI/180) + 1/Math.cos(lat * Math.PI/180)) / Math.PI) / 2 * Math.pow(2, z));
      const url = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${z}/${x}/${y}@2x.pngraw?access_token=${MAPBOX_TOKEN}`;
      const resp = await fetch(url);
      const blob = await resp.blob();

      const canvas = ('OffscreenCanvas' in window) ? new OffscreenCanvas(512,512) : Object.assign(document.createElement('canvas'), {width:512, height:512});
      const ctx = canvas.getContext('2d');
      const img = await createImageBitmap(blob);
      ctx.drawImage(img, 0, 0);

      const p1 = ctx.getImageData(256, 256, 1, 1).data;
      const p2 = ctx.getImageData(260, 256, 1, 1).data;
      const decode = (r,g,b) => -10000 + (r*256*256 + g*256 + b) * 0.1;

      const e1 = decode(p1[0], p1[1], p1[2]);
      const e2 = decode(p2[0], p2[1], p2[2]);

      const mpp = metersPerPixel(lat, z) / 2; // @2x tile
      const horizontal = 4 * mpp;
      const slopeDeg = Math.atan(Math.abs(e2 - e1) / horizontal) * 180 / Math.PI;
      return slopeDeg.toFixed(1);
    } catch { return 'N/A'; }
  }

  async function loadWeatherSidebar() {
    const listEl = document.getElementById('weather-list');
    listEl.innerHTML = '<li>Loading weather…</li>';
    try {
      const key = 'forecast_v1';
      const now = Date.now();
      const ttl = 1000 * 60 * 30;
      let data = null;
      const cached = localStorage.getItem(key);
      if (cached) {
        const { t, v } = JSON.parse(cached);
        if (now - t < ttl) data = v;
      }
      if (!data) {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${MULL_CENTER.lat}&lon=${MULL_CENTER.lng}&units=metric&appid=${OPENWEATHER_KEY}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
        localStorage.setItem(key, JSON.stringify({ t: now, v: data }));
      }
      const middayForecasts = data.list.filter(i => i.dt_txt.includes('12:00:00')).slice(0, 5);
      listEl.innerHTML = '';
      middayForecasts.forEach(item => {
        const date = new Date(item.dt * 1000);
        const label = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
        const temp = item.main.temp.toFixed(1);
        const desc = item.weather[0].main;
        const li = document.createElement('li');
        li.textContent = `${label}: ${temp}°C, ${desc}`;
        listEl.appendChild(li);
      });
    } catch { listEl.innerHTML = '<li>Error loading forecast</li>'; }
  }

  function createListItem(item, listElement, markersArray) {
    const li = document.createElement('li');
    li.textContent = item.name;
    li.addEventListener('click', () => {
      if (activePopup) activePopup.remove();
      const markerIndex = listElement.id === 'site-list' ? SITES_DATA.indexOf(item) : TOILETS_DATA.indexOf(item);
      mapInstance.flyTo({ center: item.coords, zoom: 13 });
      markersArray[markerIndex].togglePopup();
    });
    listElement.appendChild(li);
    return li;
  }

  function makeMarker(loc, type) {
    const el = document.createElement('div');
    el.className = `marker ${type}`;
    el.innerText = type === 'site' ? '⛰️' : '🚻';
    el.setAttribute('role','button');
    el.setAttribute('tabindex','0');
    el.setAttribute('aria-label', `${type === 'site' ? 'Site' : 'Toilet'}: ${loc.name}`);

    const popup = new mapboxgl.Popup({ offset: 25, closeButton: true });
    const marker = new mapboxgl.Marker(el).setLngLat(loc.coords).setPopup(popup).addTo(mapInstance);

    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') marker.togglePopup(); });

    popup.on('open', async () => {
      activePopup = popup;
      let popupHTML = `<div class="popup-details"><h3>${loc.name}</h3><p>Loading details...</p></div>`;
      popup.setHTML(popupHTML);
      try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${loc.coords[1]}&lon=${loc.coords[0]}&units=metric&appid=${OPENWEATHER_KEY}`);
        const weather = await weatherRes.json();
        const weatherInfo = `<p>🌦️ Weather: ${weather.main.temp.toFixed(1)}°C, ${weather.weather[0].main}</p>`;
        if (type === 'site') {
          const slope = await getSlope(loc.coords);
          const slopeInfo = `<p>📐 Approx. Slope: ${slope}°</p>`;
          const imageHTML = loc.image ? `<img src="${loc.image}" alt="${loc.name}" class="popup-image" loading="lazy" width="600" height="300">` : '';
          popupHTML = `${imageHTML}<div class="popup-details"><h3>${loc.name}</h3>${slopeInfo}${weatherInfo}</div>`;
        } else {
          popupHTML = `<div class="popup-details"><h3>🚽 ${loc.name}</h3>${weatherInfo}</div>`;
        }
      } catch {
        popupHTML = `<div class="popup-details"><h3>${loc.name}</h3><p>Could not load details.</p></div>`;
      }
      popup.setHTML(popupHTML);
    });
    return marker;
  }

  function applyFilters() {
    const selected = Array.from(document.querySelectorAll('#preferences input:checked')).map(c => c.value);
    const siteList = document.getElementById('site-list');
    siteList.innerHTML = '';
    siteMarkers.forEach((marker, i) => {
      const site = SITES_DATA[i];
      const hasAll = selected.every(tag => site.tags.includes(tag));
      marker.getElement().style.display = hasAll ? 'flex' : 'none';
      if (hasAll) createListItem(site, siteList, siteMarkers);
    });
  }

  function initializeMap() {
    if (mapInstance) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    mapInstance = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [MULL_CENTER.lng, MULL_CENTER.lat],
      zoom: MULL_ZOOM
    });

    const mainMapContainer = document.getElementById('main-map');

    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      mainMapContainer.classList.toggle('sidebar-collapsed');
      setTimeout(() => mapInstance.resize(), 300);
    });

    const fullscreenBtn = document.getElementById('map-fullscreen');
    fullscreenBtn.addEventListener('click', () => {
      mainMapContainer.classList.toggle('fullscreen');
      const fs = mainMapContainer.classList.contains('fullscreen');
      fullscreenBtn.innerHTML = fs ? '↘↙' : '⛶';
      fullscreenBtn.title = fs ? 'Exit Fullscreen' : 'Toggle Fullscreen';
      setTimeout(() => mapInstance.resize(), 300);
    });

    document.getElementById('map-recenter').addEventListener('click', () => {
      mapInstance.flyTo({ center: [MULL_CENTER.lng, MULL_CENTER.lat], zoom: MULL_ZOOM });
    });

    const searchInput = document.getElementById('map-search-input');
    const searchBtn = document.getElementById('map-search-btn');
    function performSearch() {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) return;
      const allLocations = [...SITES_DATA, ...TOILETS_DATA];
      const allMarkers = [...siteMarkers, ...toiletMarkers];
      const resultIndex = allLocations.findIndex(loc => loc.name.toLowerCase().includes(query));
      if (resultIndex > -1) {
        if (activePopup) activePopup.remove();
        const resultLoc = allLocations[resultIndex];
        const resultMarker = allMarkers[resultIndex];
        mapInstance.flyTo({ center: resultLoc.coords, zoom: 14 });
        resultMarker.togglePopup();
      } else {
        alert(`Location "${searchInput.value}" not found.`);
      }
    }
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') performSearch(); });

    mapInstance.on('load', () => {
      loadWeatherSidebar();
      siteMarkers = SITES_DATA.map(s => makeMarker(s, 'site'));
      toiletMarkers = TOILETS_DATA.map(t => makeMarker(t, 'toilet'));

      const toiletList = document.getElementById('toilet-list');
      toiletList.innerHTML = '';
      TOILETS_DATA.forEach(t => createListItem(t, toiletList, toiletMarkers));

      applyFilters();
      document.querySelectorAll('#preferences input').forEach(cb => cb.addEventListener('change', applyFilters));

      document.getElementById('filters').addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          document.querySelectorAll('#filters button').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          const filter = e.target.dataset.filter;
          const showSites = filter === 'all' || filter === 'sites';
          const showToilets = filter === 'all' || filter === 'toilets';

          siteMarkers.forEach(m => m.getElement().style.display = 'none');
          toiletMarkers.forEach(m => m.getElement().style.display = showToilets ? 'flex' : 'none');
          if (showSites) applyFilters();
        }
      });
    });
  }

  const mapSection = document.getElementById('map-interactive');
  const mapObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => { if (entry.isIntersecting) { initializeMap(); observer.unobserve(entry.target); } });
  }, { threshold: 0.1 });
  mapObserver.observe(mapSection);
});