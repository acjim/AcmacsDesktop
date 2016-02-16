(function () {
    'use strict';

    angular.module('acjim')
        .controller('customDialogCtrl', customDialogCtrl);

    var customDialogCtrl = function($scope, $uibModalInstance){
    //-- Methods --//

    $scope.cancel = function(){
        $uibModalInstance.dismiss('canceled');
    };

    $scope.yes = function(){
        $uibModalInstance.close('yes');
    };

    $scope.no = function(){
        $uibModalInstance.close('no');
    };

}

})();