'use strict';

angular.module('lheader', []).directive('lheader', [function() {
    return {
        restrict : 'AE',
        scope : { },
        templateUrl : 'app/components/lheader/lheader.html',
        replace : true
    };
}]);