'use strict';

angular.module('festivals').controller('MainCtrl', function ($scope, $http) {
    var allData;

    var generateMarkersFromData = function(data) {
        var markers = {};
        _.each(_.groupBy(data, 'town'), function(d, k) {
            markers[k.replace(/-/g, '_')] = {
                lng : parseFloat(d[0].lon),
                lat : parseFloat(d[0].lat),
                focus : false,
                message : _.pluck(d, 'name').join(', '),
                draggable : false
            };
        });
        return markers;
    };

    /*
    ** Map
    */
    $scope.map = {
        center : {
            lng : 2.35,
            lat : 47.85,
            zoom : 5
        },
        markers : {}
    };

    $scope.$on('category:change', function(event, category) {
        $scope.map.markers = generateMarkersFromData(_.filter(allData, function(d) {
            return category == null ? true : d.category === category;
        }));
    });

    $http.get('assets/tsv/festivals.tsv').then(function(response) {
        allData = d3.tsv.parse(response.data, function(d) {
            var lonlat = d['Lon,Lat'].split(',');
            return {
                name : d['Nom du festival'],
                category : d.Genre,
                town : d.Commune,
                lon : lonlat[0],
                lat : lonlat[1]
            };
        });

        $scope.map.markers = generateMarkersFromData(allData);
    });
});
