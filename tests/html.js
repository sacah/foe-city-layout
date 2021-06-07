const fs = require('fs');
const { JSDOM } = require('jsdom');
const assert = require('assert');
const contract = require('./contract');

const html = fs.readFileSync('index.html', 'utf8');
const document = new JSDOM(html).window.document;

function nodeName(el) {
  return (node = document.querySelector(el)) && node.nodeName.toLowerCase();
}

function nodeAttr(el, attr) {
  return (node = document.querySelector(el)) && node.getAttribute(attr);
}

describe('help dialog', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.helpDialogId}`), 'dialog');
  });
});

describe('import dialog', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.importDialogId}`), 'dialog');
  });
  it('map json textarea exists', () => {
    assert.equal(nodeName(`#${contract.mapJSONTextId}`), 'textarea');
  });
  it('import button exists', () => {
    assert.equal(nodeName(`#${contract.importBtnId}`), 'button');
  });
});

describe('share dialog', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.shareDialogId}`), 'dialog');
  });
  it('share link input exists', () => {
    assert.equal(nodeName(`#${contract.shareLinkTextId}`), 'input');
  });
});

describe('buildings dropdown', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.buildingInputId}`), 'input');
  });
  it('datalist exists', () => {
    assert.equal(nodeName(`#${contract.buildingListId}`), 'datalist');
  });
  it('links to datalist', () => {
    assert.equal(nodeAttr(`#${contract.buildingInputId}`, 'list'), contract.buildingListId);
  });
});

describe('add building button', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.addBuildingBtnId}`), 'button');
  });
});

describe('import modal button', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.importModalBtnId}`), 'button');
  });
});

describe('share button', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.shareBtnId}`), 'button');
  });
});

describe('save button', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.saveBtnId}`), 'button');
  });
});

describe('help modal button', () => {
  it('exists', () => {
    assert.equal(nodeName(`#${contract.helpModalBtnId}`), 'button');
  });
});