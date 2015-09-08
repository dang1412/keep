// Define Module with dependencies
var keepApp = angular.module('keepApp',['ui.router']);

// Setup Router
keepApp.config(function($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise('/');

    $stateProvider

        // HOME STATES AND NESTED VIEWS ========================================
        .state('home', {
            url: '/',
            templateUrl: '/keep/views/main.html',
            controller: 'keepController'
        });
});

keepApp.controller('keepController', ['$scope', 'keepService', keepController])
  .controller('headerController', ['$scope', 'keepService', headerController]);

function keepController ($scope, keepService) {
  keepService.setScope($scope);
  keepService.loadData();

  $scope.addTask = addTask;
  $scope.removeTask = removeTask;
  $scope.saveItem = keepService.saveItem;

  function addTask (item) { // for todo
    if (!item.tasks) item.tasks = [];
    item.tasks.push({
      label: '',
      done: false
    });
  }

  function removeTask (item, index) {
    if (!item.tasks) item.tasks = [];
    item.tasks.splice(index, 1);
  }
}

function headerController ($scope, keepService) {
  $scope.newTextItem = keepService.newTextItem;
  $scope.newTodoItem = keepService.newTodoItem;
  $scope.getInitData = keepService.getInitData;
}
