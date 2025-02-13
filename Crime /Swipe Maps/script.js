mapboxgl.accessToken =
  "pk.eyJ1IjoiZGV2dXByZXRpIiwiYSI6ImNtNXdjZjlxaDAxZ24yanNneGF2Y2g1ZGMifQ.Ouc9ZSrfNJLKzs0ykgSFqA";

const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/devupreti/cm6mlagvn00k301qr7r21hr0g",
  center: [-0.089932, 51.514441],
  zoom: 14
});

const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/devupreti/cm6ml79ge00n801sa5c1fatfy",
  center: [-0.089932, 51.514441],
  zoom: 14
});
const container = "#comparison-container";
const map = new mapboxgl.Compare(beforeMap, afterMap, container, {});