var utils = {
  clone: function (o) {
    return JSON.parse(JSON.stringify(o));
  },
  nextId: function(items) {
    return Math.max.apply(null, items.concat([0]).map(function(item) {
      return item.id || 0;
    })) + 1;
  }
}

keepApp.factory('keepService', ['$http', keepService]);

function keepService ($http) {
  //var data;
  var scope = null;
  var store = new KeepStore(),
      undoStack = new UndoStack();

  // Implemnt UndoStack's 2 functions
  undoStack.getStateSnapshot = function () {
    if (!scope) return;
    return {items: scope.items ? scope.items.slice(0) : null};
  }

  undoStack.setStateSnapshot = function (snapshotState) {
    if (!scope) return;
    scope.items = snapshotState.items;
    store.save(scope.items);
  }

  return {
    setScope: setScope,
    getInitData: getInitData,
    loadData: loadData,
    openEditItem: openEditItem,
    newTextItem: newTextItem,
    newTodoItem: newTodoItem,
    saveItem: saveItem,
    removeItem: removeItem,
    undo: undo,
    redo: redo,
    switchItems: switchItems,  // Sortable,
    resizeItem: resizeItem
  }

  function setScope ($scope) {
    scope = $scope;
  }

  function getInitData () {
    if (!scope) return;
    $http.get('/keep/data/initial.json').success(function (data) {
      undoStack.snapshot();
      scope.items = data;
    });
  }

  function loadData () {
    if (!scope) return;
    scope.items = store.load();
  }

  function newTextItem () {
    var textItem = {
      type: 'text',
      title: '',
      text: ''
    }
    openEditItem(textItem);
  }

  function newTodoItem () {
    var todoItem = {
      type: 'todo',
      title: '',
      tasks: [{label: '', done: false}]
    }
    openEditItem(todoItem);
  }

  function openEditItem (item) {
    if (!scope) return;
    console.log('openEditItem');
    scope.editItem = utils.clone(item);
    $('#editModal').modal('show');
  }

  // upsert item
  function saveItem (item) {
    if (!scope) return;
    console.log('savve item');
    var index_pos = _.findIndex(scope.items, function(_item) {
      return _item.id == item.id;
    });
    undoStack.snapshot(); // snapshot before change
    if (index_pos >= 0) { // update
      scope.items[ index_pos ] = item;
    }
    else {  // insert
      item.id = utils.nextId(scope.items);
      scope.items.push(item);
    }

    // save storage
    store.save(scope.items);

    $('#editModal').modal('hide');
  }

  function removeItem (item) {
    if (!scope) return;
    var index_pos = _.findIndex(scope.items, function(_item) {
      return _item.id == item.id;
    });
    if (index_pos >= 0) { // remove
      undoStack.snapshot();
      scope.items.splice(index_pos, 1);
      store.save(scope.items);
    }
  }

  function undo () {//
    undoStack.undo();
  }

  function redo () {//
    undoStack.redo();
  }

  function switchItems (startedId, targettedId) {
    if (!scope || !scope.items || startedId == null || targettedId == null) return;
    if (startedId === targettedId) return;
    var items = scope.items;
    var s_ind = _.findIndex(items, function (item) {
      return item.id == startedId;
    });
    var t_ind = _.findIndex(items, function (item) {
      return item.id == targettedId;
    });

    if (s_ind < 0 || t_ind < 0) return;

    var step = s_ind < t_ind ? 1 : -1;
    var startItem = items[s_ind];
    undoStack.snapshot();
    for (var i = s_ind; i != t_ind; i = i + step) {
      items[i] = items[i + step];
    }
    items[i] = startItem;
    store.save(items);
    scope.$apply();
  }

  function resizeItem (itemId, widthUnitChange, heightChange) {
    if (!scope || !scope.items) return;

    if (!widthUnitChange && !heightChange ) return;
    var item_ind = _.findIndex(scope.items, function (item) {
      return item.id == itemId;
    });

    var newItem = utils.clone(scope.items[item_ind]);
    if (widthUnitChange) {
      undoStack.snapshot();
      newItem.widthUnitNumber += widthUnitChange;
      if (newItem.widthUnitNumber < 1) newItem.widthUnitNumber = 1;
      if (newItem.widthUnitNumber > 12) newItem.widthUnitNumber = 12;
      scope.items[item_ind] = newItem;
      store.save(scope.items);
    }
    scope.$apply();
  }
}

// KeepStore definition
function KeepStore(options) {
  options = options || {};
  this._store = options.store || localStorage;
}

KeepStore.prototype = {
  load: function() {
    var data = this._store.getItem("keep.data");
    if (!data) {
      console.error("empty stored kept data:", data);
      return [];
    }
    try {
      return JSON.parse(data) || [];
    } catch (e) {
      console.error("failed parsing kept data:", data, e);
      return [];
    }
  },

  save: function(data) {
    try {
      this._store["keep.data"] = JSON.stringify(data);
    } catch (e) {
      console.error("failed saving keep data", e);
    }
  }
};

// UndoStack
var UndoStack = function() {
  this.state = {undo: [], redo: []};
}

UndoStack.prototype = {
  setState: function(state) {
    this.state = state;
  },

  snapshot: function() {
    var undo = this.state.undo.concat(this.getStateSnapshot());
    this.setState({undo: undo, redo: []});
  },

  hasUndo: function() {
    return this.state.undo.length > 0;
  },

  hasRedo: function() {
    return this.state.redo.length > 0;
  },

  redo: function() {
    this._undoImpl(true);
  },

  undo: function() {
    this._undoImpl();
  },

  _undoImpl: function(isRedo) {
    var undo = this.state.undo.slice(0);
    var redo = this.state.redo.slice(0);
    var snapshot;

    if (isRedo) {
      if (redo.length === 0) {
        return;
      }
      snapshot = redo.pop();
      undo.push(this.getStateSnapshot());
    } else {
      if (undo.length === 0) {
        return;
      }
      snapshot = undo.pop();
      redo.push(this.getStateSnapshot());
    }

    this.setStateSnapshot(snapshot);
    this.setState({undo:undo, redo:redo});
  }
};
