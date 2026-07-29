import L from "leaflet";

function initMaps() {
  document.querySelectorAll<HTMLElement>("[data-map]").forEach((el) => {
    if (el.dataset.mapInitialized) return;
    const lat = Number(el.dataset.lat);
    const lng = Number(el.dataset.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const map = L.map(el, { scrollWheelZoom: false }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    L.marker([lat, lng]).addTo(map).bindPopup(el.dataset.title ?? "");
    el.dataset.mapInitialized = "true";
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMaps);
} else {
  initMaps();
}
