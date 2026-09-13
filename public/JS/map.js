maptilersdk.config.apiKey = mapToken;

const coordinates =
  listing.geometry &&
  listing.geometry.coordinates &&
  listing.geometry.coordinates.length
    ? listing.geometry.coordinates
    : [77.209, 28.6139];

const map = new maptilersdk.Map({
  container: "map",
  style: maptilersdk.MapStyle.STREETS,
  center: coordinates,
  zoom: 9,
});

new maptilersdk.Marker({ color: "#fe424d" })
  .setLngLat(coordinates)
  .setPopup(
    new maptilersdk.Popup({ offset: 25 }).setHTML(
      `<h4>${listing.title}</h4><p>${listing.location}, ${listing.country}</p><p>Exact location provided after booking</p>`,
    ),
  )
  .addTo(map);
