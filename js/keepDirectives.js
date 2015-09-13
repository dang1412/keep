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
    element.on('$destroy', function() {
      console.log('item destroy');
    });

    // Sortable
    element.on('mousedown', '.panel-heading', function (event) {
      event.preventDefault();
      //console.log(event.target.tagName);
      if (event.target.tagName === 'I') return; // clicked on edit or delete
      console.log('Sortable initialized');
      Sortable.initItemId = $scope.item.id;
      element.find('.ui-item').addClass('started');
      $document.on('mousemove', mousemove);
      $document.on('mouseup', mouseup);
      $('body').css({cursor: 'move'});
    });

    function mousemove (event) {
      $('.ui-item.targetted').removeClass('targetted');
      var itemElement = angular.element(event.target).closest('.ui-item');
      Sortable.targetItemId = null;
      if ( itemElement.length > 0 && !itemElement.hasClass('started')) {
        itemElement.addClass('targetted');
        var scope = itemElement.scope();
        Sortable.targetItemId = scope && scope.item ? scope.item.id : null;
      }

    }

    function mouseup (event) {
      $document.off('mousemove', mousemove);
      $document.off('mouseup', mouseup);
      $('.ui-item.started').removeClass('started');
      $('.ui-item.targetted').removeClass('targetted');
      $('body').css({cursor: 'auto'});
      keepService.switchItems(Sortable.initItemId, Sortable.targetItemId);
      Sortable.clear();
    }
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


// function uiKeepEdit () {
//   return {
//     restrict: 'EA',
//     require: '?ngModel',
//     templateUrl: '/keep/views/uiKeepTodo.html',
//     compile: function compile() {
//       return postLink;
//     }
//   };
//
//   function postLink () {
//
//   }
// }

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
