// JSON.stringify(MainParser.CityMapData)
var cityData = JSON.parse(localStorage.getItem('saved-city-data')) || [];

// JSON.stringify(CityMap.UnlockedAreas)
var mapData = JSON.parse(localStorage.getItem('saved-map-data')) || [];

const buildingDropdown = document.querySelector('#buildings');
const buildingInput = document.querySelector('#building');
const buildingList = [];
const grid = document.querySelector('.grid');

document.querySelector('#addBuilding').addEventListener('click', (e) => {
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
  document.querySelector('#importDialog').showModal();
});

document.querySelector('#helpModal').addEventListener('click', (e) => {
  document.querySelector('#helpDialog').showModal();
});

document.querySelector('#import').addEventListener('click', (e) => {
  let mapStr = document.querySelector('#mapJSON').value.trim().replace(/^"|"$/g, '');
  let cityStr = document.querySelector('#cityJSON').value.trim().replace(/^"|"$/g, '');
  mapData = JSON.parse(mapStr);
  cityData = JSON.parse(cityStr);

  renderCity();
});

document.querySelector('#share').addEventListener('click', (e) => {
  document.querySelector('#shareDialog').showModal();
  document.querySelector('#shareLink').value = generateShareLink();
});

document.querySelector('#save').addEventListener('click', (e) => {
  localStorage.setItem('saved-city-data', JSON.stringify(getMapLayout()));
  localStorage.setItem('saved-map-data', JSON.stringify(mapData));
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

function abbrBuildingName(name, minSize) {
  const abbr = name.replace(/[^A-Z]/g, '').split('-')[0];
  return minSize < 2 ? abbr[0] : abbr;
}

function findParent(el, tag) {
  return el.nodeName.toLowerCase() === tag ? el : findParent(el.parentNode, tag);
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

  cityData.forEach(building => {
    if (!isPlayerBuilding(buildingData[building.cityentity_id].type)) return;
    grid.appendChild(createBuilding(building));
  });

  let gridEl = document.querySelector('.grid');
  gridEl.style.width = maxWidth + xMove + 200 + 'px'; // 200 is a map gutter to allow dropping buildings
  gridEl.style.height = maxHeight + yMove + 200 + 'px';

  addInteract();
  
}

let str = '44,56,48,56,52,56,60,32,60,28,60,24,56,8,52,8,56,52,52,52,48,52,44,52,40,52,36,52,32,52,56,48,52,48,48,48,44,48,0,52,0,48,0,44,4,52,4,48,4,44,8,52,8,48,8,44,28,52,40,48,24,52,20,52,16,52,12,52,20,48,16,48,12,48,36,48,32,48,24,48,28,48,12,44,0,40,0,36,0,32,0,28,16,44,20,44,24,44,28,44,32,44,36,44,40,44,44,44,48,44,52,44,56,44,4,40,8,40,12,40,16,40,20,40,24,40,28,40,32,40,36,40,40,40,44,40,48,40,52,40,56,40,56,36,56,32,56,28,52,36,52,32,52,28,48,36,48,32,48,28,44,36,44,32,44,28,48,0,48,4,48,8,44,0,44,4,44,8,56,12,56,24,56,20,56,16,52,24,52,20,48,24,48,20,44,24,44,20,52,12,52,16,48,12,48,16,44,12,44,16,40,0,36,0,32,0,40,4,40,8,40,12,40,36,40,16,40,32,40,20,40,24,40,28,36,36,36,32,36,28,36,24,36,20,36,16,4,36,4,32,4,28,32,36,32,32,32,28,32,24,32,20,32,16,36,12,32,12,36,8,36,4,32,8,32,4,28,4,24,4,20,4,16,4,8,36,12,36,16,36,28,36,28,32,28,28,28,24,28,20,28,16,28,12,28,8,20,36,24,36,8,32,8,28,12,32,16,32,24,32,12,28,20,32,16,28,20,28,24,28,24,8,24,12,24,24,20,24,16,24,12,24,8,24,24,16,24,20,|43[57,20,48,19,48,22,44,19,57,23,51,22,57,17,44,22]46[51,13,51,18,54,13,54,8]60[56,32,40,32,27,19,27,16,30,13,27,13,32,26,30,16,30,19,48,26]65[37,23]175[53,11,51,16]195[34,20]208[59,31,61,28,48,32]210[32,32,40,30,53,31,43,31,35,28,27,31,51,28,29,28,48,29,56,30,56,27,45,28,40,27,37,31,32,29]215[44,56,50,17]268[-11,15]372[8,41]415[50,15]416[53,10,53,18,50,16,53,14,53,15,53,13,50,14]420[29,36,54,39,36,36,20,26,22,26,58,39,38,39,29,39,27,36,38,36,56,36,45,36,32,43,34,39,29,42,27,46,32,36,32,39,36,39,24,30,20,30,24,26,34,46,47,39,29,46,54,36,47,36,32,46,58,36,56,39,45,39,34,43,27,42,34,36,22,30,24,33]423[36,20]425[34,31,57,29,42,29,49,31]426[37,30,53,30,61,30,29,30,45,30]431[26,49,43,38,52,38,49,38,40,38]449[24,42]467[14,42,19,42]515[0,46]517[10,50,14,50,22,50,6,50,18,50]518[0,38]528[0,52,0,42]531[22,65]533[80,25]594[34,11,34,17,17,33,34,14]604[49,53,52,53,41,21,45,56,28,49,46,58,38,54,48,34,41,23,27,26,32,34]699[22,36]704[56,53,56,50]717[53,19,51,8]719[54,16,51,10]732[26,39]737[31,11,31,9,49,55]746[31,53]751[49,50,52,50,34,8]752[62,34]764[14,8,43,36,35,26,6,44,4,46,44,26,53,26,12,32,60,34,40,36,27,33,43,33,45,33,52,36,29,33,49,36,36,33,43,40,46,26,10,32,54,33,40,40,37,26,38,33,10,48,52,40,49,40,52,33,30,26,42,19,8,48,51,26]767[39,50,42,50,32,50,35,53,57,11,35,50,57,14,57,8]779[23,12,23,9,23,15]786[41,53]791[17,30,17,26]800[26,51]802[14,14,37,8,14,28,29,22,14,11,14,25,14,35,14,21,15,39,39,8,14,18,14,32]805[34,21]807[37,20]817[27,22,31,22,49,57,54,22]840[46,15]850[17,22]860[41,15,21,22]870[60,24]882[62,30,54,28,46,30,38,28,30,30]883[35,30,27,28,43,28,59,28,51,30]896[44,8,41,8]897[46,0,40,0]898[47,8,49,0,43,0,37,0]906[51,55]926[17,18]935[57,43]1000[6,42,16,48,12,48,14,48,4,48,18,48,6,46,4,50,22,48,20,48,6,48]1001[44,58,56,26,35,49,26,25,45,59,46,49,16,24,33,22,47,49,26,23,16,27,33,18,26,20,55,54,41,19,22,29,16,36,33,21,50,9,31,35,26,11,16,23,16,11,26,10,48,52,43,42,16,18,42,42,16,19,26,17,16,21,15,24,56,10,31,34,63,33,45,42,26,33,15,38,16,38,56,12,31,25,14,31,47,42,56,23,16,16,46,42,39,27,28,35,40,21,49,49,16,28,34,42,47,35,27,45,42,35,26,21,16,10,28,45,32,25,26,27,51,41,43,49,36,35,28,25,41,26,48,42,33,19,45,35,16,25,46,7,31,47,27,25,33,42,16,35,49,7,40,26,47,34,47,19,33,11,33,8,26,22,42,41,37,49,33,16,43,35,56,25,33,49,50,10,16,29,15,31,56,15,57,26,42,36,50,25,50,12,56,18,51,25,30,45,51,39,33,9,33,10,43,27,56,13,37,35,29,25,26,34,29,35,54,42,49,25,57,35,40,42,24,29,60,33,26,38,26,29,40,53,51,36,37,7,18,29,16,15,20,29,40,35,16,22,34,7,26,36,36,42,38,52,36,49,33,7,38,50,33,17,34,49,30,35,26,26,25,29,59,27,16,26,32,7,54,49,17,29,31,44,50,8,30,25,40,20,40,24,40,23,40,25,40,22,58,26,50,13,47,21,56,14,56,11,56,21,56,19,56,17,14,41,14,40,33,14,26,18,16,12,58,35,50,11,44,59,14,38,31,39,47,20,24,49,25,49,56,20,38,42,41,42,21,29,33,20,41,20,53,25,55,25,26,30,48,49,49,42,59,33,39,49,47,7,56,24,26,35,31,42,16,31,16,33,16,30,16,32,13,31,9,31,12,31,23,29,33,12,33,15,43,7,44,7,45,7,8,31,7,31,33,25,34,25,35,25,53,42,36,25,37,25,38,25,39,25,39,26,42,26,43,26,43,25,44,25,45,25,46,25,47,25,48,25,19,29,52,25,35,7,36,7,38,7,39,7,48,7,40,7,41,7,42,7,33,23,33,13,33,24,47,23,47,22,48,57,55,21,47,24,52,21,50,7,26,19,26,16,50,42,26,15,26,14,26,13,14,39,11,31,26,12,59,34,26,24,26,9,55,27,14,10,15,10,15,17,14,17,14,24,53,49,39,53,52,49,16,13,16,14,54,25,55,26,56,16,56,22,59,26,26,31,26,32,16,37,27,35,50,49,48,54,26,28,31,33,35,33,55,49,51,42,38,35,35,35,35,34,55,52,42,38,31,36,31,41,39,35,31,37,51,21,38,53,54,21,16,20,55,50,51,38,51,49,31,38,31,40,31,43,29,45,32,42,55,42,41,49,40,49,48,55,48,51,48,50,55,53,16,17,48,53,56,42,31,46,31,45,42,37,55,51,31,48,16,34,52,42,39,42,42,49,45,49,61,33,44,49,38,49,41,35,44,35,26,37,46,35,51,37,35,42,47,33,37,42,48,56,51,34,10,31,51,35,52,35,53,35,53,21,38,51,54,35,56,35,51,33,55,35,31,50,59,35,31,51,31,49,62,33,57,42,31,52,58,42,42,40,32,49,42,39,51,40,44,42]1010[7,41]1013[19,41,18,41,21,41,17,41,58,29,50,31,42,25,2,51,0,51,56,29,1,51,48,31,41,29,40,29,3,51,32,31,22,9,33,31,32,8,56,8,56,9,41,25,20,41]1018[29,66]1019[16,65]1020[94,36]1021[100,42]1022[101,43]1033[-10,25]1037[24,-7]1044[24,46]1048[7,34]1051[7,32]1055[8,8]1057[17,10]1058[32,0]1059[8,19]1060[16,4]1065[27,9]1067[22,4]1071[17,36]1073[21,18]1075[0,28]1076[8,14]1077[27,4]1081[17,14]1082[8,25]1083[12,-10]1085[36,-14]1087[36,43,51,46,36,46,39,43,45,53,39,46,45,43,48,43,54,46,45,50,42,46,51,43,54,43,48,46,45,46,42,43]';

const map = {};

for(let a = 0; a < str.length; a++) {
  let c2 = '';
  let c3 = '';
  let c4 = '';
  let c5 = '';
  if (a > 0) c2 = `${str[a - 1]}${str[a]}`;
  if (a > 1) c3 = `${str[a - 2]}${str[a - 1]}${str[a]}`;
  if (a > 2) c4 = `${str[a - 3]}${str[a - 2]}${str[a - 1]}${str[a]}`;
  if (a > 3) c5 = `${str[a - 4]}${str[a - 3]}${str[a - 2]}${str[a - 1]}${str[a]}`;

  if (map[c2]) map[c2]++;
  else map[c2] = 1; 

  if (map[c3]) map[c3]++;
  else map[c3] = 1; 

  if (map[c4]) map[c4]++;
  else map[c4] = 1; 

  if (map[c5]) map[c5]++;
  else map[c5] = 1;
}
