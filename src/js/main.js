// JSON.stringify(MainParser.CityMapData)
var cityData = JSON.parse(localStorage.getItem('saved-city-data')) || [];

// JSON.stringify(CityMap.UnlockedAreas)
var mapData = JSON.parse(localStorage.getItem('saved-map-data')) || [];

const buildingDropdown = document.querySelector('#buildings');
const buildingInput = document.querySelector('#building');
const buildingList = [];
const grid = document.querySelector('.grid');

document.querySelector('#addBuilding').addEventListener('click', (e) => {
  gtag('event', 'menu', {
    'event_label': 'Add Building'
  });
  grid.appendChild(createBuilding({
    cityentity_id: buildingDropdown.querySelector(`OPTION[value="${buildingInput.value}"]`).getAttribute('data-building-id'),
    x: 0,
    y: 0
  }));
});

document.querySelectorAll('[data-action="close"]').forEach((el) => {
  el.addEventListener('click', (e) => {
    findParent(e.target, 'dialog').close();
  })
});

dialogPolyfill.registerDialog(document.querySelector('#importDialog'));
dialogPolyfill.registerDialog(document.querySelector('#helpDialog'));
dialogPolyfill.registerDialog(document.querySelector('#shareDialog'));

document.querySelector('#importModal').addEventListener('click', (e) => {
  gtag('event', 'menu', {
    'event_label': 'Import Modal'
  });
  document.querySelector('#importDialog').showModal();
});

document.querySelector('#helpModal').addEventListener('click', (e) => {
  gtag('event', 'menu', {
    'event_label': 'Help Modal'
  });
  document.querySelector('#helpDialog').showModal();
});

document.querySelector('#import').addEventListener('click', (e) => {
  gtag('event', 'import_modal', {
    'event_label': 'Import'
  });
  let mapStr = document.querySelector('#citymapJSON').value.trim();
  let cityStr = '';
  mapData = JSON.parse(mapStr);
  cityData = mapData.CityMapData;
  mapData = mapData.UnlockedAreas;
  renderCity();
});

document.querySelector('#share').addEventListener('click', (e) => {
  gtag('event', 'menu', {
    'event_label': 'Share'
  });
  document.querySelector('#shareDialog').showModal();
  document.querySelector('#shareLink').value = generateShareLink();
});

document.querySelector('#save').addEventListener('click', (e) => {
  gtag('event', 'menu', {
    'event_label': 'Save'
  });
  localStorage.setItem('saved-city-data', JSON.stringify(getMapLayout()));
  localStorage.setItem('saved-map-data', JSON.stringify(mapData));
});

document.addEventListener('click', (e) => {
  if (!e.target.classList.contains('buildingNode')) {
    multiSelectEls.forEach((value, key) => {
      key.classList.remove('selected');
    });
    multiSelectEls.clear();
  }
});

const compress = {
  map: {
    '1v': {
      '8,1': 'a',
      '8,2': 'b',
      '8,3': 'c',
      '8,4': 'd',
      '8,5': 'e'
    }
  },
  compress: function (str) {
    Object.keys(this.map['1v']).forEach((key) => {
      str = str.replace(new RegExp(key, 'g'), this.map['1v'][key]);
    });
    return str;
  },
  decompress: function (str) {
    Object.keys(this.map['1v']).forEach((key) => {
      str = str.replace(new RegExp(this.map['1v'][key], 'g'), key);
    });
    return str;
  }
}

function generateShareLink() {
  let link = window.location.href.replace(window.location.search, '') + '?1v';

  mapData.forEach((grid) => {
    // Remove the x: 8, y: 8, width: 16, height: 16 starting grid
    // 1,417 Map x,y | City id,x,y
    if (grid.width === 4) {
      link += `${grid.x},${grid.y},`;
    }
  });

  link += '|';

  const tmpBuilding = {};
  getMapLayout().forEach((building) => {
    let id = buildingData[building.cityentity_id].id;
    tmpBuilding[id] = tmpBuilding[id] || [];

    tmpBuilding[id].push(building.x * 1);
    tmpBuilding[id].push(building.y * 1);
  });

  Object.keys(tmpBuilding).forEach((id) => {
    if (tmpBuilding[id].length > 1) link += `${id}${JSON.stringify(tmpBuilding[id])}`;
    else `${id}.${tmpBuilding[id][0]},${tmpBuilding[id][1]}`
  });

  link = compress.compress(link);
  
  return link;
}

function loadShared() {
  let link = window.location.search.replace('?1v', '');

  link = compress.decompress(link).split('|');

  const tmpMap = link[0].split(',');
  const tmpCity = link[1].split(']');
  const map = [{
    x: 8, y: 8, width: 16, length: 16 
  }];
  const city = [];

  while (tmpMap.length > 1) {
    map.push({
      x: tmpMap.shift() * 1,
      y: tmpMap.shift() * 1,
      width: 4,
      length: 4
    });
  }

  while (tmpCity.length) {
    let tmp = tmpCity.shift().split('[');
    if (!tmp[0].length) continue;
    const xy = tmp[1].split(',');
    while (xy.length) {
      city.push({
        'cityentity_id': buildingToId[tmp[0]],
        x: xy.shift(),
        y: xy.shift()
      });
    }
  }
  mapData = map;
  cityData = city;
  renderCity();
}

function getMapLayout() {
  const data = [];
  grid.querySelectorAll('.buildingNode').forEach((el) => {
    let cityentity_id = el.getAttribute('data-cityentity-id');
    let x = (parseInt(el.style.left) - xMove) / zoomAmount;
    let y = (parseInt(el.style.top) - yMove) / zoomAmount;
    data.push({
      cityentity_id,
      x,
      y
    });
  });
  return data;
}

const buildingToId = {};

Object.keys(buildingData).forEach((key) => {
  if (!isPlayerBuilding(buildingData[key].type)) return;
  buildingToId[buildingData[key].id] = key;
  buildingList.push({
    name: buildingData[key].name,
    value: key
  });
});

buildingList.sort((a, b) => {
  return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
});

buildingList.forEach((building) => {
  const el = document.createElement('OPTION');
  //el.appendChild(document.createTextNode(building.name));
  el.value = building.name;
  el.setAttribute('data-building-id', building.value);
  buildingDropdown.appendChild(el);
});

function isPlayerBuilding(type) {
  switch (type.toLowerCase()) {
    case 'street':
    case 'outpost_ship':
    case 'friends_tavern':
    case 'off_grid':
    case 'hub_main':
    case 'hub_part':
      //case 'main_building':
    case 'impediment':
      return false;
  }
  return true;
}

const zoomAmount = 25;
let maxWidth = 0;
let maxHeight = 0;
const xMove = 100; // Really big cities push right up against the side, this number is just a quick push away from edges
const yMove = 100;
const multiSelectEls = new Map(); 

function abbrBuildingName(name, minSize) {
  const abbr = name.replace(/[^A-Z]/g, '').split('-')[0];
  return minSize < 2 ? abbr[0] : abbr;
}

function findParent(el, tag) {
  return el.nodeName.toLowerCase() === tag ? el : findParent(el.parentNode, tag);
}

function toggleBuilding(el) {
  if (multiSelectEls.has(el)) {
    multiSelectEls.delete(el);
    el.classList.remove('selected');
  } else {
    multiSelectEls.set(el, 1);
    el.classList.add('selected');
  }
}

function createMapTile(data) {
  const el = document.createElement('DIV');
  el.className = 'mapTile';
  let height = data.length * zoomAmount;
  let width = data.width * zoomAmount;
  el.style.height = height + 'px';
  el.style.width = width + 'px';

  el.style.top = data.y * zoomAmount + yMove + 'px';
  el.style.left = data.x * zoomAmount + xMove + 'px';

  if (maxWidth < (width + data.x * zoomAmount)) maxWidth = (width + data.x * zoomAmount);
  if (maxHeight < (height + data.y * zoomAmount)) maxHeight = (height + data.y * zoomAmount);
  return el;
}

function createBuilding(data) {
  const el = document.createElement('DIV');

  el.className = 'buildingNode';
  el.setAttribute('data-cityentity-id', data.cityentity_id);

  el.addEventListener('click', (e) => {
    if (e.ctrlKey) findParent(e.target, 'div').remove();
    if (e.altKey) toggleBuilding(findParent(e.target, 'div'));
  });

  data.x = data.x || 0; // Either FoE or FoE Helper put NULL if x or y is 0
  data.y = data.y || 0;

  el.style.height = (buildingData[data.cityentity_id].height * zoomAmount) + 'px';
  el.style.width = (buildingData[data.cityentity_id].width * zoomAmount) + 'px';

  el.style.top = data.y * zoomAmount + yMove + 'px';
  el.style.left = data.x * zoomAmount + xMove + 'px';

  el.innerHTML =
    `<span><abbr title="${buildingData[data.cityentity_id].name}">${abbrBuildingName(buildingData[data.cityentity_id].name, Math.min(buildingData[data.cityentity_id].height, buildingData[data.cityentity_id].width))}</abbr></span>`;
  return el;
}

function clearCity() {
  grid.querySelectorAll('.buildingNode').forEach((el) => el.remove());
}

function clearMap() {
  grid.querySelectorAll('.mapTile').forEach((el) => el.remove());
}

function addInteract(gridEl) {
  interact('.buildingNode').unset()
  interact('.buildingNode')
    .draggable({
      modifiers: [
        interact.modifiers.snap({
          targets: [
            interact.createSnapGrid({
              x: 25,
              y: 25
            })
          ],
          range: 30,
          relativePoints: [{
            x: 0,
            y: 0
          }]
        }),
        interact.modifiers.restrict({
          restriction: gridEl,
          elementRect: {
            top: 0,
            left: 0,
            bottom: 1,
            right: 1
          },
          endOnly: true
        })
      ]
    })
    .on('dragmove', function (event) {
      let x = parseInt(event.target.style.left);
      let y = parseInt(event.target.style.top);

      x += event.dx
      y += event.dy

      event.target.style.top = y + 'px';
      event.target.style.left = x + 'px';

      multiSelectEls.forEach((value, key) => {
        key.style.top = parseInt(key.style.top) + event.dy + 'px';
        key.style.left = parseInt(key.style.left) + event.dx + 'px';
      });
    });
}

function renderCity() {
  clearCity();
  clearMap();
  mapData.forEach(tile => {
    for (let a = 0; a < tile.length; a++) {
      for (let b = 0; b < tile.width; b++) {
        tile.x = tile.x || 0; // Either FoE or FoE Helper put NULL if x or y is 0
        tile.y = tile.y || 0;
        grid.appendChild(createMapTile({
          width: 1,
          length: 1,
          x: tile.x + a,
          y: tile.y + b
        }));
      }
    }
  });

  
  Object.keys(cityData).forEach(building => {
    building = cityData[building];
    if (!isPlayerBuilding(buildingData[building.cityentity_id].type)) return;
    grid.appendChild(createBuilding(building));
  });

  let gridEl = document.querySelector('.grid');
  gridEl.style.width = maxWidth + xMove + 200 + 'px'; // 200 is a map gutter to allow dropping buildings
  gridEl.style.height = maxHeight + yMove + 200 + 'px';

  addInteract();
  
}