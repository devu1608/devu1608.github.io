'use strict';

class FieldEaseMull {
    constructor() {
        this.currentTheme = 'light';
        this.currentSection = 'hero';
        this.mapInstance = null;
        this.siteMarkers = [];
        this.toiletMarkers = [];
        this.activePopup = null;
        this.weatherCache = new Map();
        this.isMapInitialized = false;
        
        this.config = {
            mapbox: {
                token: 'pk.eyJ1IjoiZGV2dXByZXRpIiwiYSI6ImNtNXdjZjlxaDAxZ24yanNneGF2Y2g1ZGMifQ.Ouc9ZSrfNJLKzs0ykgSFqA',
                style: 'mapbox://styles/mapbox/outdoors-v12',
                center: { lng: -6.05, lat: 56.45 },
                zoom: 9
            },
            weather: {
                key: '5ea16122404a77c5427779129155d036',
                cacheDuration: 30 * 60 * 1000
            }
        };

        this.sitesData = [
            { name: 'Kintra Bay', coords: [-6.3500, 56.3400], tags: ['flat', 'rest'] },
            { name: 'Ardalanish Peninsula', coords: [-6.2431, 56.2920], tags: ['firm'] },
            { name: 'Scarisdale River Valley', coords: [-6.0394, 56.4540], tags: ['flat', 'firm'] },
            { name: 'Glen More', coords: [-5.9040, 56.3916], tags: ['rest', 'firm'] },
            { name: 'Torosay Quarry Complex', coords: [-5.6832, 56.4463], tags: ['flat'] },
            { name: 'Lochdon Moraine Field', coords: [-5.6670, 56.4402], tags: ['firm', 'rest'] },
            { name: 'Loch na Keal Shore', coords: [-6.097537, 56.449877], tags: [] }
        ];

        this.toiletsData = [
            { name: 'Iona', coords: [-6.3922237, 56.3302206] },
            { name: 'Fionnphort', coords: [-6.3692341, 56.3254217] },
            { name: 'TSL Contractors Office', coords: [-5.6902495, 56.4485739] },
            { name: 'Salen', coords: [-5.949668, 56.5179213] },
            { name: 'Craignure', coords: [-5.7068028, 56.4708733] }
        ];

        this.init();
    }

    init() {
        this.loadTheme();
        this.setupEventListeners();
        this.loadSiteImages();
        this.setupIntersectionObserver();
        console.log('Field Ease Mull initialized successfully');
    }

    loadTheme() {
        try {
            const savedTheme = sessionStorage.getItem('theme') || localStorage.getItem('theme') || 'light';
            this.currentTheme = savedTheme;
            this.applyTheme(savedTheme);
        } catch (error) {
            console.warn('Theme storage not available, using default theme');
            this.applyTheme('light');
        }
    }

    applyTheme(theme) {
        const body = document.body;
        const themeToggle = document.getElementById('theme-toggle');
        
        if (theme === 'dark') {
            body.classList.add('dark');
            if (themeToggle) themeToggle.textContent = '☀️';
        } else {
            body.classList.remove('dark');
            if (themeToggle) themeToggle.textContent = '🌙';
        }
        
        this.currentTheme = theme;
        
        try {
            sessionStorage.setItem('theme', theme);
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('Could not save theme preference');
        }
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        this.setupNavigation();
        
        this.setupMobileNavigation();

        window.addEventListener('popstate', (e) => this.handlePopState(e));

        document.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }

    setupNavigation() {
        const navMenu = document.querySelector('.nav-menu');
        const ctaButton = document.querySelector('.cta-button');

        if (navMenu) {
            navMenu.addEventListener('click', (event) => this.handleNavClick(event));
        }

        if (ctaButton) {
            ctaButton.addEventListener('click', (event) => this.handleNavClick(event));
        }
    }

    handleNavClick(event) {
        const target = event.target;
        const sectionId = target.dataset.section;

        if (sectionId) {
            event.preventDefault();
            this.showSection(sectionId, true);
            this.closeMobileMenu();
        }
    }

    setupMobileNavigation() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                const isOpen = navMenu.classList.toggle('open');
                navToggle.setAttribute('aria-expanded', String(isOpen));
            });
        }
    }

    closeMobileMenu() {
        const navMenu = document.querySelector('.nav-menu');
        const navToggle = document.getElementById('nav-toggle');

        if (navMenu && navToggle) {
            navMenu.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    }

    showSection(sectionId, pushState = true) {
        const allSections = document.querySelectorAll('.section');
        const targetSection = document.getElementById(sectionId);

        if (!targetSection) {
            console.error(`Section ${sectionId} not found`);
            return;
        }

        allSections.forEach(section => {
            section.classList.toggle('active', section.id === sectionId);
        });

        this.updateActiveNavLink(sectionId);

        const heading = targetSection.querySelector('h1, h2');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            setTimeout(() => heading.focus(), 100);
        }

        if (pushState) {
            history.pushState({ sectionId }, '', `#${sectionId}`);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (sectionId === 'map-interactive' && !this.isMapInitialized) {
            setTimeout(() => this.initializeMap(), 300);
        }

        this.currentSection = sectionId;
    }

    updateActiveNavLink(sectionId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const isActive = link.dataset.section === sectionId;
            if (isActive) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    }

    handlePopState(event) {
        const sectionId = (event.state && event.state.sectionId) || 
                             (location.hash ? location.hash.slice(1) : 'hero');
        this.showSection(sectionId, false);
    }

    handleKeyboardNavigation(event) {
        if (event.key === 'Escape') {
            this.closeMobileMenu();
            if (this.activePopup) {
                this.activePopup.remove();
                this.activePopup = null;
            }
        }
    }

    loadSiteImages() {
        const siteCards = document.querySelectorAll('.site-card[data-site-name]');
        siteCards.forEach(card => {
            const siteName = card.dataset.siteName;
            const img = card.querySelector('.site-image img');
            if (siteName && img) {
                const site = this.sitesData.find(s => s.name === siteName);
                if (site) {
                    site.image = img.src;
                }
            }
        });
    }

    setupIntersectionObserver() {
        const mapSection = document.getElementById('map-interactive');
        if (!mapSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isMapInitialized) {
                    setTimeout(() => this.initializeMap(), 300);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        observer.observe(mapSection);
    }

    async initializeMap() {
        if (this.isMapInitialized || !window.mapboxgl) {
            return;
        }

        try {
            mapboxgl.accessToken = this.config.mapbox.token;
            
            this.mapInstance = new mapboxgl.Map({
                container: 'map',
                style: this.config.mapbox.style,
                center: [this.config.mapbox.center.lng, this.config.mapbox.center.lat],
                zoom: this.config.mapbox.zoom,
                attributionControl: true
            });

            this.setupMapControls();

            this.mapInstance.on('load', () => {
                this.loadWeatherData();
                this.createMarkers();
                this.setupMapEventListeners();
                this.populateSidebar();
                this.isMapInitialized = true;
                console.log('Map initialized successfully');
            });

        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.showMapError('Failed to load map. Please check your internet connection.');
        }
    }

    setupMapControls() {
        const mainMapContainer = document.getElementById('main-map');
        
        const sidebarToggle = document.getElementById('sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                mainMapContainer.classList.toggle('sidebar-collapsed');
                setTimeout(() => {
                    if (this.mapInstance) {
                        this.mapInstance.resize();
                    }
                }, 300);
            });
        }

        const fullscreenBtn = document.getElementById('map-fullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                const isFullscreen = mainMapContainer.classList.toggle('fullscreen');
                fullscreenBtn.innerHTML = isFullscreen ? '↘↙' : '⛶';
                fullscreenBtn.title = isFullscreen ? 'Exit Fullscreen' : 'Toggle Fullscreen';
                setTimeout(() => {
                    if (this.mapInstance) {
                        this.mapInstance.resize();
                    }
                }, 300);
            });
        }

        const recenterBtn = document.getElementById('map-recenter');
        if (recenterBtn) {
            recenterBtn.addEventListener('click', () => {
                if (this.mapInstance) {
                    this.mapInstance.flyTo({
                        center: [this.config.mapbox.center.lng, this.config.mapbox.center.lat],
                        zoom: this.config.mapbox.zoom
                    });
                }
            });
        }

        this.setupMapSearch();

        this.setupMapFilters();
    }

    setupMapSearch() {
        const searchInput = document.getElementById('map-search-input');
        const searchBtn = document.getElementById('map-search-btn');

        const performSearch = () => {
            const query = searchInput.value.toLowerCase().trim();
            if (!query) return;

            const allLocations = [...this.sitesData, ...this.toiletsData];
            const allMarkers = [...this.siteMarkers, ...this.toiletMarkers];
            
            const resultIndex = allLocations.findIndex(loc => 
                loc.name.toLowerCase().includes(query)
            );

            if (resultIndex >= 0) {
                if (this.activePopup) {
                    this.activePopup.remove();
                }
                
                const resultLoc = allLocations[resultIndex];
                const resultMarker = allMarkers[resultIndex];
                
                this.mapInstance.flyTo({
                    center: resultLoc.coords,
                    zoom: 14
                });
                
                setTimeout(() => {
                    resultMarker.togglePopup();
                }, 1000);
                
                searchInput.value = '';
            } else {
                this.showSearchNotFound(query);
            }
        };

        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }

        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    performSearch();
                }
            });
        }
    }

    setupMapFilters() {
        const filtersContainer = document.getElementById('filters');
        if (!filtersContainer) return;

        filtersContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                filtersContainer.querySelectorAll('button').forEach(btn => 
                    btn.classList.remove('active')
                );
                e.target.classList.add('active');

                const filter = e.target.dataset.filter;
                this.applyMarkerFilter(filter);
            }
        });
    }

    applyMarkerFilter(filter) {
        const showSites = filter === 'all' || filter === 'sites';
        const showToilets = filter === 'all' || filter === 'toilets';

        this.siteMarkers.forEach(marker => {
            marker.getElement().style.display = 'none';
        });
        
        this.toiletMarkers.forEach(marker => {
            marker.getElement().style.display = showToilets ? 'flex' : 'none';
        });

        if (showSites) {
            this.applyAccessibilityFilters();
        }
    }

    createMarkers() {
        this.siteMarkers = this.sitesData.map(site => this.createMarker(site, 'site'));
        
        this.toiletMarkers = this.toiletsData.map(toilet => this.createMarker(toilet, 'toilet'));
    }

    createMarker(location, type) {
        const el = document.createElement('div');
        el.className = `marker ${type}`;
        el.innerHTML = type === 'site' ? '⛰️' : '🚻';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `${type === 'site' ? 'Site' : 'Toilet'}: ${location.name}`);

        const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: true,
            closeOnClick: false
        });

        const marker = new mapboxgl.Marker(el)
            .setLngLat(location.coords)
            .setPopup(popup)
            .addTo(this.mapInstance);

        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                marker.togglePopup();
            }
        });

        popup.on('open', async () => {
            this.activePopup = popup;
            await this.loadPopupContent(popup, location, type);
        });

        popup.on('close', () => {
            if (this.activePopup === popup) {
                this.activePopup = null;
            }
        });

        return marker;
    }

    async loadPopupContent(popup, location, type) {
        popup.setHTML(`
            <div class="popup-details">
                <h3>${location.name}</h3>
                <p><span class="loading"></span> Loading details...</p>
            </div>
        `);

        try {
            const weatherData = await this.getLocationWeather(location.coords);
            
            let popupHTML = '';
            
            if (type === 'site') {
                const slope = await this.calculateSlope(location.coords);
                const imageHTML = location.image ? 
                    `<img src="${location.image}" alt="${location.name}" class="popup-image" loading="lazy">` : '';
                
                popupHTML = `
                    ${imageHTML}
                    <div class="popup-details">
                        <h3>${location.name}</h3>
                        <p>📐 Approx. Slope: ${slope}°</p>
                        <p>🌦️ Weather: ${weatherData.temp}°C, ${weatherData.description}</p>
                        ${location.tags.length > 0 ? `<p>🏷️ Features: ${location.tags.join(', ')}</p>` : ''}
                    </div>
                `;
            } else {
                popupHTML = `
                    <div class="popup-details">
                        <h3>🚽 ${location.name}</h3>
                        <p>🌦️ Weather: ${weatherData.temp}°C, ${weatherData.description}</p>
                        <p>📍 Public toilet facility</p>
                    </div>
                `;
            }

            popup.setHTML(popupHTML);
        } catch (error) {
            console.error('Error loading popup content:', error);
            popup.setHTML(`
                <div class="popup-details">
                    <h3>${location.name}</h3>
                    <p>Could not load additional details.</p>
                </div>
            `);
        }
    }

    async getLocationWeather(coords) {
        const cacheKey = `weather_${coords[0]}_${coords[1]}`;
        const now = Date.now();
        
        if (this.weatherCache.has(cacheKey)) {
            const cached = this.weatherCache.get(cacheKey);
            if (now - cached.timestamp < this.config.weather.cacheDuration) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${coords[1]}&lon=${coords[0]}&units=metric&appid=${this.config.weather.key}`
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const weatherData = {
                temp: data.main.temp.toFixed(1),
                description: data.weather[0].main
            };

            this.weatherCache.set(cacheKey, {
                data: weatherData,
                timestamp: now
            });

            return weatherData;
        } catch (error) {
            console.error('Weather API error:', error);
            return {
                temp: 'N/A',
                description: 'Unknown'
            };
        }
    }

    async calculateSlope(coords) {
        try {
            const estimates = {
                'Glen More': '5.2',
                'Ardalanish Peninsula': '8.1',
                'Scarisdale River Valley': '3.4',
                'Torosay Quarry Complex': '12.7',
                'Lochdon Moraine Field': '4.8',
                'Loch na Keal Shore': '2.1',
                'Kintra Bay': '1.5'
            };

            const locationName = this.sitesData.find(site => 
                Math.abs(site.coords[0] - coords[0]) < 0.01 && 
                Math.abs(site.coords[1] - coords[1]) < 0.01
            )?.name;

            return estimates[locationName] || '3.5';
        } catch (error) {
            console.error('Slope calculation error:', error);
            return 'N/A';
        }
    }

    async loadWeatherData() {
        const weatherList = document.getElementById('weather-list');
        if (!weatherList) return;

        weatherList.innerHTML = '<li><span class="loading"></span> Loading weather data...</li>';

        try {
            const cacheKey = 'forecast_mull';
            const now = Date.now();
            let forecastData = null;

            if (this.weatherCache.has(cacheKey)) {
                const cached = this.weatherCache.get(cacheKey);
                if (now - cached.timestamp < this.config.weather.cacheDuration) {
                    forecastData = cached.data;
                }
            }

            if (!forecastData) {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?lat=${this.config.mapbox.center.lat}&lon=${this.config.mapbox.center.lng}&units=metric&appid=${this.config.weather.key}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                forecastData = await response.json();
                
                this.weatherCache.set(cacheKey, {
                    data: forecastData,
                    timestamp: now
                });
            }

            const middayForecasts = forecastData.list
                .filter(item => item.dt_txt.includes('12:00:00'))
                .slice(0, 5);

            weatherList.innerHTML = '';
            middayForecasts.forEach(forecast => {
                const date = new Date(forecast.dt * 1000);
                const dateLabel = date.toLocaleDateString('en-GB', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                const temp = forecast.main.temp.toFixed(1);
                const description = forecast.weather[0].main;

                const li = document.createElement('li');
                li.textContent = `${dateLabel}: ${temp}°C, ${description}`;
                weatherList.appendChild(li);
            });

        } catch (error) {
            console.error('Weather loading error:', error);
            weatherList.innerHTML = '<li class="error-message">Weather data unavailable</li>';
        }
    }

    populateSidebar() {
        this.populateSiteList();
        this.populateToiletList();
        this.setupAccessibilityFilters();
    }

    populateSiteList() {
        const siteList = document.getElementById('site-list');
        if (!siteList) return;

        siteList.innerHTML = '';
        this.sitesData.forEach((site, index) => {
            const li = document.createElement('li');
            li.textContent = site.name;
            li.setAttribute('tabindex', '0');
            li.setAttribute('role', 'button');
            li.addEventListener('click', () => this.focusOnLocation(site, this.siteMarkers[index]));
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.focusOnLocation(site, this.siteMarkers[index]);
                }
            });
            siteList.appendChild(li);
        });
    }

    populateToiletList() {
        const toiletList = document.getElementById('toilet-list');
        if (!toiletList) return;

        toiletList.innerHTML = '';
        this.toiletsData.forEach((toilet, index) => {
            const li = document.createElement('li');
            li.textContent = toilet.name;
            li.setAttribute('tabindex', '0');
            li.setAttribute('role', 'button');
            li.addEventListener('click', () => this.focusOnLocation(toilet, this.toiletMarkers[index]));
            li.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.focusOnLocation(toilet, this.toiletMarkers[index]);
                }
            });
            toiletList.appendChild(li);
        });
    }

    focusOnLocation(location, marker) {
        if (this.activePopup) {
            this.activePopup.remove();
        }

        this.mapInstance.flyTo({
            center: location.coords,
            zoom: 13,
            duration: 1500
        });

        setTimeout(() => {
            marker.togglePopup();
        }, 1000);
    }

    setupAccessibilityFilters() {
        const preferencesForm = document.getElementById('preferences');
        if (!preferencesForm) return;

        const checkboxes = preferencesForm.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.applyAccessibilityFilters());
        });

        this.applyAccessibilityFilters();
    }

    applyAccessibilityFilters() {
        const preferencesForm = document.getElementById('preferences');
        if (!preferencesForm) return;

        const selectedTags = Array.from(preferencesForm.querySelectorAll('input:checked'))
            .map(input => input.value);

        const siteList = document.getElementById('site-list');
        if (siteList) {
            siteList.innerHTML = '';
        }

        this.siteMarkers.forEach((marker, index) => {
            const site = this.sitesData[index];
            const meetsPreferences = selectedTags.length === 0 || 
                selectedTags.every(tag => site.tags.includes(tag));

            marker.getElement().style.display = meetsPreferences ? 'flex' : 'none';

            if (meetsPreferences && siteList) {
                const li = document.createElement('li');
                li.textContent = site.name;
                li.setAttribute('tabindex', '0');
                li.setAttribute('role', 'button');
                li.addEventListener('click', () => this.focusOnLocation(site, marker));
                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.focusOnLocation(site, marker);
                    }
                });
                siteList.appendChild(li);
            }
        });
    }

    setupMapEventListeners() {
        this.mapInstance.on('error', (e) => {
            console.error('Map error:', e);
            this.showMapError('Map encountered an error. Please refresh the page.');
        });

        this.mapInstance.on('styleimagemissing', (e) => {
            console.warn('Missing map image:', e.id);
        });
    }

    showMapError(message) {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="error-message" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <h3>Map Error</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    showSearchNotFound(query) {
        const notification = document.createElement('div');
        notification.className = 'search-notification';
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--accent);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px var(--shadow);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = `Location "${query}" not found`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        new FieldEaseMull();
    } catch (error) {
        console.error('Failed to initialize Field Ease Mull:', error);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = 'position: fixed; top: 20px; left: 20px; right: 20px; z-index: 10000;';
        errorDiv.innerHTML = `
            <h3>Application Error</h3>
            <p>Failed to initialize the application. Please refresh the page or check your internet connection.</p>
            <button onclick="location.reload()" style="margin-top: 0.5rem;">Reload Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
});