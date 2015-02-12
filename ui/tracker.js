var blessed = require('blessed');
var extend = require('extend');
var screen = require('./screen');
var container = new require('./Container')();
var STYLE = require('./STYLE')();
var STATUS = require('../STATUS');

var friendlyDeck = blessed.list({
  parent: container,
  label: 'Friendly',
  style: {
    scrollbar: {
      bg: '#005500'
    },
    border: {
      fg: '#005500',
      bg: STYLE.bg
    },
    label: {
      fg: '#00ff00',
      bg: STYLE.bg,
      bold: true
    },
    selected: {
      fg: '#00ff00',
      bg: '#000000'
    },
    fg: '#00ff00',
    bg: '#000000'
  },
  scrollbar: {
    ch: ' '
  },
  border: {
    type: 'line',
    fg: '#005500',
    bg: STYLE.bg
  },
  padding: 1,
  left: 'center',
  top: 2,
  interactive: false, // future proof
  keys: false,
  mouse: true,
  scrollable: true
});
// Temporary hack until ^
friendlyDeck._isList = false;
friendlyDeck.setCards = setCards;
// Hack to allow mouse support for log scrolling, but
// prevent the box from taking focus away from the container.
friendlyDeck.focus = container.focus.bind(container);

var opposingDeck = blessed.list({
  parent: container,
  label: 'Opposing',
  style: {
    scrollbar: {
      bg: '#550000'
    },
    border: {
      fg: '#550000',
      bg: STYLE.bg
    },
    label: {
      fg: '#ff0000',
      bg: STYLE.bg,
      bold: true
    },
    selected: {
      fg: '#ff0000',
      bg: '#000000'
    },
    fg: '#ff0000',
    bg: '#000000'
  },
  scrollbar: {
    ch: ' '
  },
  border: {
    type: 'line',
    fg: '#550000',
    bg: STYLE.bg
  },
  padding: 1,
  left: 'center',
  interactive: false, // future proof
  keys: false,
  mouse: true,
  scrollable: true
});
// Temporary hack until ^
opposingDeck._isList = false;
opposingDeck.setCards = setCards;
// Hack to allow mouse support for log scrolling, but
// prevent the box from taking focus away from the container.
opposingDeck.focus = container.focus.bind(container);

function setCards(cards) {
  var list = this;
  list.cards = cards;
  var meta = {};
  cards.forEach(function (card) {
    if (meta.hasOwnProperty(card.name)) {
      meta[card.name].push(card);
    } else {
      meta[card.name] = [card];
    }
  });
  var items = Object.keys(meta).map(function (cardName) {
    var cards = meta[cardName];
    if (cards.length === 1) {
      var cardStatus = cards[0].status;
      var fillerWidth = Math.floor(list.width * .75) - cardName.length;
      if (fillerWidth < 1) {
        fillerWidth = 1;
      }
      return cardName + new Array(fillerWidth).join('.') + cardStatus;
    }
    var statusMeta = {};
    cards.forEach(function (card) {
      Object.keys(STATUS).forEach(function (key) {
        if (card.status === STATUS[key]) {
          if (statusMeta.hasOwnProperty(key)) {
            statusMeta[key]++; 
          } else {
            statusMeta[key] = 1;
          }
        } 
      });
    });
    var statusString = '';
    Object.keys(statusMeta).forEach(function (key) {
      var statusCount = statusMeta[key];
      if (statusCount > 0) {
        statusString += STATUS[key] + 'x' + statusCount + '\033[0m '; 
      }
    });
    var fillerWidth = Math.floor(list.width * .75) - cardName.length;
    if (fillerWidth < 1) {
      fillerWidth = 1;
    }
    return cardName + new Array(fillerWidth).join('.') + statusString;
  });

  list.setItems(items);
  screen.render();
}

var debug = blessed.box({
  parent: container,
  label: 'Debug',
  style: {
    scrollbar: {
      bg: '#005555'
    },
    border: {
      fg: '#005555',
      bg: STYLE.bg
    },
    label: {
      fg: '#00ffff',
      bg: STYLE.bg,
      bold: true
    },
    fg: '#00ffff',
    bg: '#000000'
  },
  border: {
    type: 'line',
    fg: '#005555',
    bg: STYLE.bg
  },
  left: 'center',
  scrollbar: {
    ch: ' '
  },
  padding: 1,
  mouse: true,
  scrollable: true
});

// Hack to allow mouse support for log scrolling, but
// prevent the box from taking focus away from the container.
debug.focus = container.focus.bind(container);

debug.log = function (line) {
  var currentScrollIndex = debug.getScroll();
  var originalScrollHeight = debug.getScrollHeight() - 1;
  debug.content += line + '\n';
  if (currentScrollIndex === originalScrollHeight) {
    debug.setScrollPerc(100);
  }
  screen.render();
};
// Detect if a debug flag was used.
// If so, don't hide the debug box by default.
if (!/debug/g.test(process.execArgv.join())) {
  debug.hide();
}

container.key('C-d', function () {
  debug.toggle();
  calculateSizes();
  debug.setScrollPerc(100);
});

var legend = blessed.list({
  parent: container,
  label: 'Legend',
  style: extend(true, {}, STYLE, {
    selected: {
      fg: STYLE.fg,
      bg: STYLE.bg
    }
  }),
  border: {
    type: 'bg',
    fg: STYLE.border.fg,
    bg: STYLE.border.bg
  },
  padding: 1,
  top: 'center',
  left: 'center',
  height: 10,
  mouse: false,
  input: false,
  keys: false,
  interactive: false,
  items: [
    STATUS.inDeck + '\033[0m = In Deck',
    STATUS.inHand + '\033[0m = In Hand',
    STATUS.inPlay + '\033[0m = Active Minion',
    STATUS.inSecret + '\033[0m = Active Secret',
    STATUS.inWeapon + '\033[0m = Active Weapon',
    STATUS.inGraveyard + '\033[0m = Used/Dead'
  ]
});
legend._isList = false;
legend.hide();

container.key('l', function () {
  legend.toggle();
  screen.render();
});

var deckSelector = blessed.list({
  parent: container,
  label: 'Select Your Deck',
  style: extend(true, {}, STYLE, {
    bg: STYLE.border.bg
  }),
  border: {
    type: 'line',
    fg: STYLE.border.fg,
    bg: STYLE.border.bg
  },
  padding: 1,
  align: 'center',
  top: 'center',
  left: 'center',
  width: '75%',
  mouse: true,
  input: true,
  keys: true,
  vi: true
});
var deckCache = [];
var setDeckSelectorItems = deckSelector.setItems.bind(deckSelector);
deckSelector.setDecks = function (decks) {
  deckCache = decks;
  setDeckSelectorItems(decks);
  deckSelector.height = decks.length + 4;
  screen.render();
};
deckSelector.onSelect = function (callback) {
  deckSelector.on('select', function (elem, index) {
    deckSelector.hide();
    callback(deckCache[index]); 
  });
};
deckSelector.hide();

container.on('resize', calculateSizes);

var info = blessed.box({
  parent: container,
  style: {
    fg: '#ffffff',
    bg: STYLE.border.bg,
    bold: true
  },
  bottom: 0,
  height: 1,
  align: 'center',
  content: '[ L=Legend, Q=Quit ]'
});

function calculateSizes() {
  if (!debug.visible) {
    friendlyDeck.height = Math.floor(screen.rows * .60);
    opposingDeck.top = friendlyDeck.height + 2;
    opposingDeck.height = screen.rows - (opposingDeck.top + 2);
  } else {
    friendlyDeck.height = Math.floor(screen.rows * .5) - 2;
    opposingDeck.top = friendlyDeck.height + 2; 
    opposingDeck.height = Math.floor(friendlyDeck.height * .5) + 1
  }
  friendlyDeck.width = screen.cols - 4;
  opposingDeck.width = screen.cols - 4;
  debug.top = opposingDeck.top + opposingDeck.height;
  debug.height = screen.rows - debug.top - 2;
  debug.width = screen.cols - 4;

  screen.render();

  if (friendlyDeck.hasOwnProperty('cards')) {
    friendlyDeck.setCards(friendlyDeck.cards);
  }
  if (opposingDeck.hasOwnProperty('cards')) {
    opposingDeck.setCards(opposingDeck.cards);
  }
}

var hideContainer = container.hide.bind(container);
container.hide = function () {
  legend.hide();
  deckSelector.hide();
  delete friendlyDeck.cards;
  delete opposingDeck.cards;
  friendlyDeck.setItems([]);
  opposingDeck.setItems([]);
  calculateSizes();
  hideContainer();
};
var showContainer = container.show.bind(container);
container.show = function () {
  showContainer();
  calculateSizes();
};

module.exports = {
  title: 'Deck Tracker',
  container: container,
  friendlyDeck: friendlyDeck,
  opposingDeck: opposingDeck,
  debug: debug,
  legend: legend,
  deckSelector: deckSelector,
  info: info,
  show: container.show.bind(container)
};