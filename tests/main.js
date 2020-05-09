const fs = require('fs');
const { JSDOM } = require('jsdom');
const assert = require('assert');
const vm = require('vm');
var sinon = require('sinon');

const html = fs.readFileSync('index.html', 'utf8');
document = new JSDOM(html).window.document;

dialogPolyfill = {
  registerDialog: sinon.fake()
}

buildingData = {
  "A_ArcticFuture_Culture1": {
    name: "Holo-Holiday Park",
    width: 6,
    height: 6,
    type: "culture"
  }
};

const mainJs = fs.readFileSync('src/js/main.js', 'utf8');
localStorage = {
  getItem: sinon.fake.returns('[]')
};

const script = new vm.Script(mainJs);

script.runInThisContext();

describe('Loading data', () => {
  it('cityData', () => {
    assert.equal(localStorage.getItem.getCall(0).args[0], 'saved-city-data');
  });
  it('mapData', () => {
    assert.equal(localStorage.getItem.getCall(1).args[0], 'saved-map-data');
  });
});

