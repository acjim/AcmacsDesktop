(function () {
    'use strict';

    angular.module('acjim')
        .controller('customDialogCtrl', customDialogCtrl);

    function customDialogCtrl ($scope, $uibModalInstance){
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