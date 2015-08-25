angular.module('acjim')
    .controller('toolbarCtrl', ['$scope', '$rootScope', function ($scope, $rootScope) {

        $scope.mapTool = $rootScope.mapTool = 'brush';


        $scope.$watch('mapTool', function () {
            $rootScope.mapTool = $scope.mapTool;
            $rootScope.$emit('tool.changed');
        });

    }]);
