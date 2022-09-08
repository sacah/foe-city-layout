// node update-buildings.js
// Git commit

const https = require('node:https');
const fs = require('node:fs');
const vm = require('node:vm');

// Load game with DevTools Network tab open, look for a request similar to below, and copy new URL
https.get('https://foeen.innogamescdn.com/start/metadata?id=city_entities-d4fe4938fd15117edb67e96652ccb1e780ed5d97', (res) => {
    let rawData = '';
    res.on('data', (chunk) => {
        rawData += chunk;
    });
    res.on('end', () => {
        try {
            console.log('Parsing data');
            const parsedData = JSON.parse(rawData);
            processData(parsedData);
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});

function lastId(buildingList) {
    let highest = 0;
    Object.entries(buildingList).forEach((building) => {
        highest = highest < building[1].id ? building[1].id : highest;
    });
    return highest;
}

function fixDimensions(building) {
    if (!building.width) {
        building.width = building?.components?.AllAge?.placement?.size?.x || 0;
    }
    if (building.length) building.height = building.length;
    if (!building.height) {
        building.height = building?.components?.AllAge?.placement?.size?.y || 0;
    }
}

function processData(data) {
    console.log('Processing data');
    let buildings = {};
    vm.createContext(buildings);
    vm.runInContext(fs.readFileSync('src/data/buildingInfo.js'), buildings);

    let nextId = lastId(buildings.buildingData) + 1;
    buildings = buildings.buildingData;

    data.forEach((building) => {
        //console.log(building);
        fixDimensions(building);
        if (buildings[building.id]) {
            buildings[building.id].name = building.name;
            buildings[building.id].width = building.width;
            buildings[building.id].height = building.height;
            buildings[building.id].type = building.type || 'placement';
        } else {
            buildings[building.id] = {
                name: building.name,
                width: building.width,
                height: building.height,
                type: building.type || 'placement',
                id: nextId
            }
            nextId++;
        }
    });
    console.log('Writting data');
    fs.writeFileSync('src/data/buildingInfo.js', `var buildingData = ${JSON.stringify(buildings)};`);
}