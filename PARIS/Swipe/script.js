mapboxgl.accessToken =
  "pk.eyJ1IjoiZGV2dXByZXRpIiwiYSI6ImNtNXdjZjlxaDAxZ24yanNneGF2Y2g1ZGMifQ.Ouc9ZSrfNJLKzs0ykgSFqA";

const beforeMap = new mapboxgl.Map({
  container: "before",
  style: "mapbox://styles/devupreti/cm77t96zx00aq01r38vqlenoo",
  center: [2.3494, 48.8407],
  zoom: 11
});

const afterMap = new mapboxgl.Map({
  container: "after",
  style: "mapbox://styles/devupreti/cm77abaq801lk01sd23qx4xr0",
  center: [2.3494, 48.8407],
  zoom: 11
});
const container = "#comparison-container";
const map = new mapboxgl.Compare(beforeMap, afterMap, container, {});