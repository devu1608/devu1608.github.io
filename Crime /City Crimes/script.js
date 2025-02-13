mapboxgl.accessToken =
  "pk.eyJ1IjoiZGV2dXByZXRpIiwiYSI6ImNtNXdjZjlxaDAxZ24yanNneGF2Y2g1ZGMifQ.Ouc9ZSrfNJLKzs0ykgSFqA";
const style_2022 = "mapbox://styles/devupreti/cm6mlagvn00k301qr7r21hr0g";
const style_2024 = "mapbox://styles/devupreti/cm6ml79ge00n801sa5c1fatfy";
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: style_2022,
  center: [-0.089932, 51.514441],
  zoom: 14
});

const layerList = document.getElementById("menu");
const inputs = layerList.getElementsByTagName("input");

for (const input of inputs) {
  input.onclick = (layer) => {
    if (layer.target.id == "style_2022") {
      map.setStyle(style_2022);
    }
    if (layer.target.id == "style_2024") {
      map.setStyle(style_2024);
    }
  };
}