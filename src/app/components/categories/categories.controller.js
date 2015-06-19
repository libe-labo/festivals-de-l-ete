'use strict';

angular.module('festivals').controller('CategoriesCtrl', function ($scope, $rootScope) {
    $scope.categories = [
        'Tous', 'BD', 'Cinéma', 'Danse', 'Littérature', 'Musique',
        'Photo / Art contemporain', 'Theâtre / Arts de la rue / Cirque', 'Autres'
    ];

    /*
    ** Handle buttons
    */

    var selectedCategory = 'Tous';

    $scope.selectCategory = function(category) {
        if (_.contains($scope.categories, category)) {
            selectedCategory = category;
            $rootScope.$broadcast('category:change',
                                  selectedCategory === 'Tous' ? null : selectedCategory);
        }
    };

    $scope.getCategoryClass = function(category) {
        return {
            'md-primary' : category === selectedCategory
        };
    };
});
