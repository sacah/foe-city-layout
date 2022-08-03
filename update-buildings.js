// node update-buildings.js
// Git commit

const https = require('node:https');
const fs = require('node:fs');
const vm = require('node:vm');

https.get('https://foeen.innogamescdn.com/start/metadata?id=city_entities-ac01d629ce6a55503548052d3a459325f1b5d003', (res) => {
    let rawData = '';
    res.on('data', (chunk) => {
        rawData += chunk;
    });
    res.on('end', () => {
        try {
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
    let buildings = {};
    vm.createContext(buildings);
    vm.runInContext(fs.readFileSync('src/data/buildingInfo.js'), buildings);

    const nextId = lastId(buildings.buildingData) + 1;
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
    fs.writeFileSync('src/data/buildingInfo.js', `var buildingData = ${JSON.stringify(buildings)};`);
}