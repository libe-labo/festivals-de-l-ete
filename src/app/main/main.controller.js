'use strict';

angular.module('festivals').controller('MainCtrl', function ($scope, $http, leafletData) {
    /*
    ** Data
    */
    var allData;
    $scope.festivals = [];

    // Filter `allData` depending on key / value
    var filterFestivals = function(key, value) {
        if (key == null && value == null) {
            return _.clone(allData);
        }
        return _.filter(allData, function(d) {
            return d[key] === value;
        });
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
        tiles : {
            url : 'http://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
            type : 'sxyz',
            options : {
                opacity : 1,
                detectRetina : true,
                reuseTile : true,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
            }
        },
        markers : {}
    };

    // Creates an array of Leaftlet Markers from an array of festivals
    var generateMarkersFromData = function(data) {
        var markers = {};
        _.each(_.groupBy(data, 'town'), function(d, k) {
            var scope = $scope.$new();
            scope.names = _.pluck(d, 'name');
            markers[k.replace(/-/g, '_')] = {
                lng : parseFloat(d[0].lon),
                lat : parseFloat(d[0].lat),
                focus : false,
                draggable : false,
                message : '<li ng-repeat="name in names">{{ name }}</li>',
                getMessageScope : (function() { return this; }).bind(scope),
                compileMessage : true
            };
        });
        return markers;
    };

    $scope.$on('category:change', function(event, category) {
        // If `category == null` then we want everything
        $scope.festivals = filterFestivals.apply(this, category == null ? [] : ['category', category]);
        $scope.map.markers = generateMarkersFromData($scope.festivals);
    });

    $http.get('assets/tsv/festivals.tsv').then(function(response) {
        allData = d3.tsv.parse(response.data, function(d) {
            var lonlat = d['Lon,Lat'].split(','),
                startDate = d['Début'].split('/'),
                endDate = d.Fin.split('/');
            return {
                name : d['Nom du festival'],
                category : d.Genre,
                town : d.Commune,
                lon : lonlat[0],
                lat : lonlat[1],
                startDate : new Date(startDate[2], startDate[1] - 1, startDate[0]),
                endDate : new Date(endDate[2], endDate[1] - 1, endDate[0]),
                description : d.Texte,
                website : d['Site Web'],
                phoneNumber : d['Téléphone']
            };
        });


        leafletData.getMap().then(function(map) {
            var allLons = _.pluck(allData, 'lon'),
                allLats = _.pluck(allData, 'lat'),
                bounds = L.latLngBounds(L.latLng(_.min(allLats) - 0.5, _.max(allLons) + 0.5),
                                        L.latLng(_.max(allLats) + 0.5, _.min(allLons) - 0.5)),
            boundsCenter = bounds.getCenter();

            $scope.map.center = {
                lng : boundsCenter.lng,
                lat : boundsCenter.lat,
                zoom : map.getBoundsZoom(bounds)
            };
        });

        $scope.festivals = _.clone(allData);

        $scope.map.markers = generateMarkersFromData($scope.festivals);
    });
});
