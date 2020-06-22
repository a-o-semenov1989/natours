/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic2VtZW5vdjE5ODkiLCJhIjoiY2tiZ2QyMmI1MDZ1MjJ5cDNvcTJmMjN6cCJ9.HxC8s0vYpTzAox4WRl01NQ';

  var map = new mapboxgl.Map({
    container: 'map', //отобразит карту в элементе с id map
    style: 'mapbox://styles/semenov1989/ckbgdoigr1s651isakdkbwbam',
    scrollZoom: false,
    //center: [-118.113491, 34.111745], //где карта будет отцентрована по-умолчанию
    //zoom: 4,
    //interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    // Создаем маркер
    const el = document.createElement('div');
    el.className = 'marker';

    // Добавляем маркер
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom', //низ маркера будет указывать на нужную точку
    })
      .setLngLat(loc.coordinates)
      .addTo(map); //присваиваем координаты локации маркеру и добавляем на карту

    // Add popup
    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extends map bounds to include the current location
    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
