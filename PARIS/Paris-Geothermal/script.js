mapboxgl.accessToken =
  "pk.eyJ1IjoiZGV2dXByZXRpIiwiYSI6ImNtNXdjZjlxaDAxZ24yanNneGF2Y2g1ZGMifQ.Ouc9ZSrfNJLKzs0ykgSFqA";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/devupreti/cm77abaq801lk01sd23qx4xr0",
  center: [2.3494, 48.8407],
  zoom: 11
});

map.on("load", () => {
  const layers = [
    "0 - 10",
    "10 - 20",
    "20 - 30",
    "30 - 40",
    "40 - 50",
    "50 - 60",
    "60 - 70",
    "70 - 80"
  ];
  const colors = [
    "#ffffd9",
    "#edf8b1",
    "#c7e9b4",
    "#7fcdbb",
    "#41b6c4",
    "#1d91c0",
    "#225ea8",
    "#253494"
  ];

  // create legend
  const legend = document.getElementById("legend");

  layers.forEach((layer, i) => {
    const color = colors[i];
    const key = document.createElement("div");
    key.className = "legend-key";
    key.style.backgroundColor = color;
    key.innerHTML = `${layer}`;
    legend.appendChild(key);
  });

  map.addSource("hover", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] }
  });

  map.on("mousemove", (event) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: ["energie-potentiel-de-geothe-dr425k"]
    });

    if (features.length) {
      const properties = features[0].properties;
      let hoverInfo = `<p style="font-family: 'Courier New', Courier, monospace; font-size: 14px;">District Code: ${properties.codeiris}</p>`;
      hoverInfo += `<p style="font-family: 'Courier New', Courier, monospace; font-size: 14px;">Energy for Heating: ${properties.echaud}</p>`;
      hoverInfo += `<p style="font-family: 'Courier New', Courier, monospace; font-size: 14px;">Energy for Cooling: ${properties.efroid}</p>`;
      hoverInfo += `<p style="font-family: 'Courier New', Courier, monospace; font-size: 14px;">Ratio of Geothermal Heating: ${properties.ratiogthch}</p>`;
      hoverInfo += `<p style="font-family: 'Courier New', Courier, monospace; font-size: 14px;">Ratio of Geothermal Cooling: ${properties.ratiogthfr}</p>`;
      document.getElementById("pd").innerHTML = hoverInfo;
    } else {
      document.getElementById(
        "pd"
      ).innerHTML = `<p style="font-family: 'Courier New', Courier, monospace; font-size: 14px;">Hover over a point!</p>`;
    }
  });

  const codeirisData = [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [2.3494, 48.8407],
            [2.3594, 48.8407],
            [2.3594, 48.8507],
            [2.3494, 48.8507],
            [2.3494, 48.8407]
          ]
        ]
      },
      properties: {
        codeiris: "751010101",
        echaud: 10739.588458,
        efroid: 1260.777825,
        ratiogthch: 5.0,
        ratiogthfr: 3.0
      }
    }
  ];

  map.getSource("hover").setData({
    type: "FeatureCollection",
    features: codeirisData
  });

  map.addControl(new mapboxgl.NavigationControl(), "top-left");

  map.addControl(
    new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }),
    "top-left"
  );

  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl: mapboxgl,
    marker: false,
    placeholder: "Search for places in Paris",
    proximity: {
      longitude: 2.3494,
      latitude: 48.8407
    }
  });

  map.addControl(geocoder, "top-left");

  // Top 10 Tourist Spots in Paris with Pexels image URLs
  const photoLocations = [
    {
      lat: 48.8584,
      lng: 2.2945,
      img:
        "https://cdn.pixabay.com/photo/2017/07/11/21/29/paris-2495107_1280.jpg",
      title: "Eiffel Tower"
    },
    {
      lat: 48.8606,
      lng: 2.3376,
      img:
        "https://cdn.pixabay.com/photo/2018/12/12/13/08/paris-3870798_1280.jpg",
      title: "Louvre Museum"
    },
    {
      lat: 48.8529,
      lng: 2.35,
      img:
        "https://cdn.pixabay.com/photo/2019/04/23/18/28/notre-dame-4150231_1280.jpg",
      title: "Notre-Dame Cathedral"
    },
    {
      lat: 48.8867,
      lng: 2.3431,
      img:
        "https://cdn.pixabay.com/photo/2020/06/01/07/59/church-5245585_1280.jpg",
      title: "Montmartre"
    },
    {
      lat: 48.8698,
      lng: 2.307,
      img:
        "https://cdn.pixabay.com/photo/2014/11/05/13/48/arc-de-triomphe-517899_1280.jpg",
      title: "Arc de Triomphe"
    },
    {
      lat: 48.86,
      lng: 2.3266,
      img:
        "https://cdn.pixabay.com/photo/2016/08/23/16/25/musee-dorsay-1614902_1280.jpg",
      title: "Musée d'Orsay"
    },
    {
      lat: 48.8462,
      lng: 2.3371,
      img:
        "https://cdn.pixabay.com/photo/2022/12/20/11/16/mullerthal-7667616_1280.jpg",
      title: "Luxembourg Gardens"
    },
    {
      lat: 48.8566,
      lng: 2.3522,
      img:
        "https://cdn.pixabay.com/photo/2014/10/13/18/52/paris-487148_1280.jpg",
      title: "Seine River View"
    }
  ];

  // Add markers with image popups for each tourist spot
  photoLocations.forEach((location) => {
    new mapboxgl.Marker()
      .setLngLat([location.lng, location.lat])
      .addTo(map)
      .setPopup(
        new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
          <h4>${location.title}</h4>
          <div style="width: 100%; height: 200px; overflow: hidden; position: relative;">
            <img src="${location.img}" alt="${location.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
          </div>`)
      );
  });
});