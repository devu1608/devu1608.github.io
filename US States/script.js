let config = {
  minZoom: 2,
  maxZoom: 18
};

const zoom = 4;
const lat = 37.8;
const lng = -96;

const map = L.map("map", config).setView([lat, lng], zoom);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const data_url =
  "https://raw.githubusercontent.com/mingshuwang/UoG-GEOG5015/main/features.geojson";

let html_list = "";
let geoJson;

fetch(data_url)
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    function getColor(d) {
      return d > 1000
        ? "#800026"
        : d > 500
        ? "#BD0026"
        : d > 200
        ? "#E31A1C"
        : d > 100
        ? "#FC4E2A"
        : d > 50
        ? "#FD8D3C"
        : d > 20
        ? "#FEB24C"
        : d > 10
        ? "#FED976"
        : "#FFEDA0";
    }

    function style(feature) {
      return {
        fillColor: getColor(feature.properties.density),
        weight: 2,
        opacity: 1,
        color: "white",
        dashArray: "3",
        fillOpacity: 0.7
      };
    }

    geoJson = L.geoJson(data, {
      style: style,
      onEachFeature: onEachFeature
    }).addTo(map);

    const legend = L.control({ position: "bottomright" });

    legend.onAdd = function (map) {
      const div = L.DomUtil.create("div", "info legend"),
        grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

      for (let i = 0; i < grades.length; i++) {
        div.innerHTML +=
          '<i style="background:' +
          getColor(grades[i] + 1) +
          '"></i> ' +
          grades[i] +
          (grades[i + 1] ? "–" + grades[i + 1] + "<br>" : "+");
      }

      return div;
    };

    legend.addTo(map);

    document.getElementById("panel").innerHTML = html_list;

    function onEachFeature(feature, layer) {
      const id = feature.id;
      const name = feature.properties.name;
      html_list += `<li id="${id}">${name}</li>`;
      layer.leafletId = id;

      layer.on("mouseover", function () {
        layer.setStyle(highlightStyle);
        const el = document.getElementById(layer.leafletId);
        el.classList.add("highlight");
        el.scrollIntoView({ behavior: "auto", block: "center" });
      });

      layer.on("mouseout", function () {
        geoJson.resetStyle(layer);
        const el = document.getElementById(layer.leafletId);
        el.classList.remove("highlight");
      });
    }

    // Highlight style for both map and list
    const highlightStyle = {
      weight: 2,
      fillOpacity: 1
    };

    // Add event listeners to list items in the panel
    let el = document.querySelectorAll("#panel li");
    for (let i = 0; i < el.length; i++) {
      el[i].addEventListener("mouseover", function (e) {
        const hoveredItem = e.target;
        const layer = geoJson.getLayers()[i];
        layer.setStyle(highlightStyle);
        hoveredItem.classList.add("highlight");
      });

      el[i].addEventListener("mouseout", function (e) {
        const hoveredItem = e.target;
        const layer = geoJson.getLayer(hoveredItem.id);
        geoJson.resetStyle(layer);
        hoveredItem.classList.remove("highlight");
      });
    }
  })
  .catch(function (error) {
    console.error("Error fetching GeoJSON data:", error);
  });