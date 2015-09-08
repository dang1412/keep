// Directives
keepApp.directive('uiKeepItem', ['keepService', uiKeepItem]);

function uiKeepItem (keepService) {
  return {
    restrict: 'EA',
    templateUrl: function(elem, attrs){
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
  }

  function percent (tasks) {
    console.log('percent 10%', tasks.length);
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


function uiKeepEdit () {
  return {
    restrict: 'EA',
    require: '?ngModel',
    templateUrl: '/keep/views/uiKeepTodo.html',
    compile: function compile() {
      return postLink;
    }
  };

  function postLink () {

  }
}
