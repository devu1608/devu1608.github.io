mapboxgl.accessToken =
  "pk.eyJ1IjoiZGV2dXByZXRpIiwiYSI6ImNtNXdjZjlxaDAxZ24yanNneGF2Y2g1ZGMifQ.Ouc9ZSrfNJLKzs0ykgSFqA";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/devupreti/cm761vpli01vc01s2516hfgwy",
  center: [2.3494, 48.8407],
  zoom: 11.2
});

map.on("load", () => {
  // Define color gradient for geothermal data
  const layers = [
    "T1", "T2", "T3", "T4",
    "T5", "T6", "T7", "T8","T9","T10","T11","T12"
  ];
  const colors = [
    '#a6cee3',
'#1f78b4',
'#b2df8a',
'#33a02c',
'#fb9a99',
'#e31a1c',
'#fdbf6f',
'#ff7f00',
'#cab2d6',
'#6a3d9a',
'#ffff99',
'#b15928',
  ];

  // Create legend dynamically with interactivity
  const legend = document.getElementById("legend");
  legend.style.display = "flex";
  legend.style.flexWrap = "wrap";

  layers.forEach((layer, i) => {
    const key = document.createElement("div");
    key.className = "legend-key";
    key.style.backgroundColor = colors[i];
    key.style.width = "30px";
    key.style.height = "15px";
    key.style.margin = "3px";
    key.style.borderRadius = "3px";
    key.style.cursor = "pointer";
    key.dataset.layer = layer;
    legend.appendChild(key);

    const label = document.createElement("span");
    label.innerText = layer;
    label.style.marginRight = "10px";
    label.style.fontSize = "12px";
    label.style.cursor = "pointer";
    legend.appendChild(label);

    key.addEventListener("click", () => toggleLayer(layer));
    label.addEventListener("click", () => toggleLayer(layer));
  });

  function toggleLayer(layerId) {
    const visibility = map.getLayoutProperty(layerId, "visibility");
    map.setLayoutProperty(layerId, "visibility", visibility === "visible" ? "none" : "visible");
  }

  // Create hover source for interactive map layer
  map.addSource("hover", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  map.on("mousemove", (event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: ["energie-potentiel-de-geothe-dr425k"]
    });

    const infoBox = document.getElementById("pd");
    if (features.length) {
      const properties = features[0].properties;
      infoBox.innerHTML = `
        <p style="font-family: 'Courier New';">District Code: ${properties.codeiris}</p>
        <p style="font-family: Courier New;">Heating Energy: ${properties.echaud} kWh</p>
        <p style="font-family: Courier New;">Cooling Energy: ${properties.efroid} kWh</p>
        <p style="font-family: Courier New;">Geothermal Heating Ratio: ${properties.ratiogthch}%</p>
        <p style="font-family: Courier New;">Geothermal Cooling Ratio: ${properties.ratiogthfr}%</p>
      `;
    } else {
      infoBox.innerHTML = `<p>Hover over a data zone!</p>`;
    }
  });

  // Add navigation and geolocation controls
  map.addControl(new mapboxgl.NavigationControl(), "top-left");
  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    }),
    "top-left"
  );

  // Add search (geocoder) control
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    placeholder: "Search for places in Paris",
    proximity: { longitude: 2.3494, latitude: 48.8407 }
  });
  map.addControl(geocoder, "top-left");

  // Paris Tourist Spots with Image Popups
  const photoLocations = [
    { lat: 48.8584, lng: 2.2945, img: "https://cdn.pixabay.com/photo/2017/07/11/21/29/paris-2495107_1280.jpg", title: "Eiffel Tower" },
    { lat: 48.8606, lng: 2.3376, img: "https://cdn.pixabay.com/photo/2018/12/12/13/08/paris-3870798_1280.jpg", title: "Louvre Museum" },
    { lat: 48.8529, lng: 2.35, img: "https://cdn.pixabay.com/photo/2019/04/23/18/28/notre-dame-4150231_1280.jpg", title: "Notre-Dame Cathedral" },
    { lat: 48.8867, lng: 2.3431, img: "https://cdn.pixabay.com/photo/2020/06/01/07/59/church-5245585_1280.jpg", title: "Montmartre" },
    { lat: 48.8698, lng: 2.307, img: "https://cdn.pixabay.com/photo/2014/11/05/13/48/arc-de-triomphe-517899_1280.jpg", title: "Arc de Triomphe" },
    { lat: 48.86, lng: 2.3266, img: "https://cdn.pixabay.com/photo/2016/08/23/16/25/musee-dorsay-1614902_1280.jpg", title: "Musée d'Orsay" },
    { lat: 48.8462, lng: 2.3371, img: "https://cdn.pixabay.com/photo/2022/12/20/11/16/mullerthal-7667616_1280.jpg", title: "Luxembourg Gardens" },
    { lat: 48.8566, lng: 2.3522, img: "https://cdn.pixabay.com/photo/2014/10/13/18/52/paris-487148_1280.jpg", title: "Seine River View" }
  ];

  // Add markers with enhanced image popups
  photoLocations.forEach((location) => {
    new mapboxgl.Marker()
      .setLngLat([location.lng, location.lat])
      .addTo(map)
      .setPopup(
        new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
          <h4 style="text-align: center;">${location.title}</h4>
          <div style="width: 100%; height: 180px; overflow: hidden; border-radius: 8px;">
            <img src="${location.img}" alt="${location.title}" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        `)
      );
  });
});