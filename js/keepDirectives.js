// Directives
keepApp.directive('uiKeepItem', ['keepService', '$document', uiKeepItem])
  .directive('uiBindMarkdown', ['$timeout', uiBindMarkdown]);

var Sortable = {
  initItemId: null,
  targetItemId: null,
  clear: function () {
    this.initItemId = null;
    this.targetItemId = null;
  }
}

function uiKeepItem (keepService, $document) {
  return {
    restrict: 'EA',
    templateUrl: function(elem, attrs) {
      return '/keep/views/partials/uiKeep' + capitalizeFirstLetter(attrs.type) + '.html';
    },
    scope: {
      'item': '='
    },
    link: link
  };

  function link ($scope, element, attrs) {
    $scope.percent = percent;
    $scope.editItem = editItem;
    $scope.removeItem = keepService.removeItem;

    $scope.item.widthUnitNumber = $scope.item.widthUnitNumber || 4;

    // Sortable
    var sortable = new Sortable(element, $scope.item, function (startId, targetId) {
      keepService.switchItems(startId, targetId);
    });

    var resizable = new Resizable(element, $scope.item, function (widthUnitChange, heightChange) {
      console.log('widthUnitChange:', widthUnitChange, 'heightChange:', heightChange);
      keepService.resizeItem($scope.item.id, widthUnitChange, heightChange);
    });

    element.on('$destroy', function() {
      console.log('item destroy');
      sortable.destroy();
      resizable.destroy();
    });

  }

  function percent (tasks) {
    if (tasks.length === 0) return 0;
    return Math.floor(_.filter(tasks, function(task) {
      return task.done;
    }).length / tasks.length * 100);
  }

  function editItem (item) {
    keepService.openEditItem(item);
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

/*
 * Sortable
 */
var Sortable = function (element, item, callback) {
  this.element = element;
  this.item = item;
  this.targetItemId = null;
  this.callback = callback;
  element.find('.panel-heading').on('mousedown', this.initialize.bind(this));
}

Sortable.prototype = {
  initialize: function (event) {
    event.preventDefault();
    //console.log(event.target.tagName);
    if (event.target.tagName === 'I') return; // clicked on edit or delete
    console.log('Sortable initialized');
    //this.initItemId = $scope.item.id;
    this.element.find('.ui-item').addClass('started');
    $(document).on('mousemove', this.mousemove.bind(this));
    $(document).on('mouseup', this.mouseup.bind(this));
    $('body').css({cursor: 'move'});
  },
  mousemove: function (event) {
    $('.ui-item.targetted').removeClass('targetted');
    var targetItemElement = angular.element(event.target).closest('.ui-item');
    this.targetItemId = null;
    if ( targetItemElement.length > 0 && !targetItemElement.hasClass('started')) {
      targetItemElement.addClass('targetted');
      var scope = targetItemElement.scope();
      this.targetItemId = scope && scope.item ? scope.item.id : null;
    }
  },
  mouseup: function (event) {
    this.callback(this.item.id, this.targetItemId);
    this.targetItemId = null;
    $(document).off('mousemove');
    $(document).off('mouseup');
    $('.ui-item.started').removeClass('started');
    $('.ui-item.targetted').removeClass('targetted');
    $('body').css({cursor: 'auto'});
  },
  destroy: function () {
    this.element.find('.panel-heading').off('mousedown');
  }
}

var Resizable = function (element, item, callback) {
  this.element = element.find('.ui-item');
  this.item = item;
  this.handleBase = -5;
  this.callback = callback;
  this.initialize();
}

Resizable.prototype = {
  initialize: function () {
    var self = this;
    this.element.find('.ui-resizable-handle').on('mousedown', function (event) {
      event.preventDefault();
      self.startX = event.pageX;
      self.startY = event.pageY;
      self.handle = $(event.target);
      self.direction = self.handle.hasClass('ui-resizable-e') ? 'e' : 's';
      self.widthUnitLength = parseInt(self.element.width() / self.item.widthUnitNumber);
      self.widthUnitChange = 0;
      self.heightChange = 0;
      self.element.addClass('resizing-' + self.direction);
      $(document).on('mousemove', self.mousemove.bind(self));
      $(document).on('mouseup', self.mouseup.bind(self));
    });
  },
  mousemove: function (event) {
    if (this.direction === 'e') {
      var moved = event.pageX - this.startX;
      this.widthUnitChange = parseInt(moved / this.widthUnitLength);
      this.handle.css('right', this.handleBase - this.widthUnitChange * this.widthUnitLength);
    }
    else {
      var moved = event.pageY - this.startY;
      this.handle.css('bottom', this.handleBase - moved);
      this.heightChange = moved;
    }
  },
  mouseup: function () {
    this.element.removeClass('resizing-' + this.direction);
    this.handle.css('right', this.handleBase);
    this.handle.css('bottom', this.handleBase);
    $(document).off('mousemove');
    $(document).off('mouseup');
    this.callback(this.widthUnitChange, this.heightChange);
  },
  destroy: function () {
    this.element.find('.ui-resizable-handle').off('mousedown');
  }
}

function uiBindMarkdown($timeout){
  return {
    restrict: 'EA',
    scope: {
      mdSource: '='
    },
    compile: function compile() {
      //return postLink;
      return function (scope, iElement, iAttrs) {
          $timeout(function(){
              postLink(scope, iElement, iAttrs);
          }, 100);
      };
    }
  };

  function postLink (scope, iElement, iAttrs) {
    scope.$watch('mdSource', function () {
      iElement.html( window.marked(scope.mdSource) );
    });
  }
}
