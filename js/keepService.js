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
  var store = new KeepStore();
  return {
    setScope: setScope,
    getInitData: getInitData,
    loadData: loadData,
    openEditItem: openEditItem,
    newTextItem: newTextItem,
    newTodoItem: newTodoItem,
    saveItem: saveItem,
    removeItem: removeItem
  }

  function setScope ($scope) {
    scope = $scope;
  }

  function getInitData () {
    if (!scope) return;
    $http.get('/keep/data/initial.json').success(function (data) {
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
    if (index_pos >= 0) { // update
      scope.items[ index_pos ] = item;
    }
    else {  // insert
      item.id = utils.nextId(scope.items);
      scope.items.push(item);
    }

    // TODO save state, save storage
    store.save(scope.items);

    $('#editModal').modal('hide');
  }

  function removeItem (item) {
    if (!scope) return;
    var index_pos = _.findIndex(scope.items, function(_item) {
      return _item.id == item.id;
    });
    if (index_pos >= 0) { // remove
      scope.items.splice(index_pos, 1);
      store.save(scope.items);
    }
  }

  function undo () {// TODO
  }

  function redo () {// TODO
  }
}

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
