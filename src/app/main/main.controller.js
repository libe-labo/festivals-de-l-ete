'use strict';

angular.module('festivals').controller('MainCtrl', function ($scope, $http, leafletData, $rootScope) {
    var allData;
    $scope.festivals = [];
    $scope.category = undefined;
    $scope.day = undefined;

    var allForCategory = function() {
        if ($scope.category == null) {
            return allData;
        }
        return _.filter(allData, { category : $scope.category });
    };

    // Filter `allData` depending on key / value
    var filterFestivals = function() {
        return _.filter(allData, function(d) {
            var isCat = $scope.category == null ? true : d.category === $scope.category;
            var isDate = $scope.day == null ? true
                                            : moment($scope.day).isBetween(d.startDate,
                                                                           moment(d.endDate).add(1, 'day'));
            return isCat && isDate;
        });
    };

    $scope.changeDate = function() {
        $scope.festivals = filterFestivals();
        $scope.map.markers = generateMarkersFromData($scope.festivals);
    };

    $scope.selectFestival = function(i) {
        $scope.selectedFestival = _.clone(_.find(allData, { id : i }));
        if ($scope.selectedFestival != null) {
            var marker = allMarkers[$scope.selectedFestival.town.replace(/-/g, '_')];
            if (marker != null && !marker.getPopup()._isOpen) {
                marker.openPopup();
            }
        }
    };

    /*
    ** Map
    */
    var allMarkers;
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
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">' +
                             'OpenStreetMap</a> contributors, &copy; ' +
                             '<a href="http://cartodb.com/attributions">CartoDB</a>'
            }
        },
        markers : {}
    };

    // Creates an array of Leaftlet Markers from an array of festivals
    var generateMarkersFromData = (function() {
        var markerMap = {
            null : '01',
            undefined : '01',
            'BD' : '02',
            'Cinéma' : '03',
            'Danse' : '04',
            'Musique' : '06',
            'Littérature' : '05',
            'Photo / Art contemporain' : '07',
            'Theâtre / Arts de la rue / Cirque' : '08',
            'Autres' : '09'
        };

        return function(data) {
            var markers = {};
            _.each(_.groupBy(allForCategory(), 'town'), function(d, k) {
                var scope = $scope.$new();
                scope.festivals = _.clone(d);
                var id = k.replace(/-/g, '_');
                var opacity = 0.1;
                _.each(d, function(_d) {
                    if (_.contains(data, _d)) {
                        opacity = 1;
                    }
                });
                markers[id] = {
                    lng : parseFloat(d[0].lon),
                    lat : parseFloat(d[0].lat),
                    focus : false,
                    draggable : false,
                    message : '<li class="popup__item" ng-repeat="festival in festivals" ' +
                                  'ng-click="$parent.selectFestival(festival.id)">{{ festival.name }}</li>',
                    getMessageScope : (function() { return this; }).bind(scope),
                    compileMessage : true,
                    alt : id,
                    opacity : opacity,
                    icon : {
                        iconUrl : 'assets/images/marqueurs-' + markerMap[d[0].category] + '.png',
                        iconSize : [25, 40],
                        iconAnchor : [12, 39],
                        popupAnchor : [0, -39]
                    }
                };
            });
            return markers;
        };
    })();

    $scope.$on('category:change', function(event, category) {
        // If `category == null` then we want everything
        $scope.category = category;
        $scope.festivals = filterFestivals();
        $scope.map.markers = generateMarkersFromData($scope.festivals);
    });

    var initMap = function() {
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

        $scope.map.markers = generateMarkersFromData($scope.festivals);
    };


    /*
    ** Data
    */
    $http.get('assets/tsv/festivals.tsv').then(function(response) {
        allData = d3.tsv.parse(response.data, function(d, i) {
            var lonlat = d['Lon,Lat'].split(','),
                startDate = d['Début'].substr(0, 10).split('-'),
                endDate = d.Fin.substr(0, 10).split('-');
            return {
                id : i,
                name : d['Nom du festival'],
                category : d.Genre,
                town : d.Commune,
                lon : lonlat[0],
                lat : lonlat[1],
                startDate : moment(new Date(+startDate[0], (+startDate[1]) - 1, +startDate[2])),
                endDate : moment(new Date(+endDate[0], (+endDate[1]) - 1, +endDate[2])),
                description : d.Texte,
                website : (d['Site web'].indexOf('://') < 0 ? 'http://' : '') + d['Site web'],
                phoneNumber : d['Téléphone'],
                citationName : d.Nom,
                citationSub : d.Fonction,
                citation : d.Citation
            };
        });

        var lastDate = moment(_.max(_.pluck(allData, 'endDate')));

        $scope.day = new Date();
        if (moment($scope.day).isAfter(lastDate)) {
            $scope.day = lastDate.toDate();
        }

        $scope.festivals = filterFestivals();

        initMap();
    });

    /*
    **
    */
    $scope.getFestivalClass = function(festival) {
        return {
            selected : $scope.selectedFestival != null && festival.id === $scope.selectedFestival.id
        };
    };

    $scope.$watch('map.markers', function() {
        allMarkers = {};
        leafletData.getMap().then(function(map) {
            map.eachLayer(function(layer) {
                if (layer.openPopup != null) {
                    allMarkers[layer.options.alt] = layer;
                }
            });
        });
    });

    $scope.$watch('category', function() {
            $rootScope.$broadcast('category:change', $scope.category);
    });

    $scope.getColorClass = (function() {
        var classesMap = {
            null : 'color-all',
            undefined : 'color-all',
            'BD' : 'color-bd',
            'Cinéma' : 'color-cinema',
            'Danse' : 'color-danse',
            'Musique' : 'color-musique',
            'Littérature' : 'color-litterature',
            'Photo / Art contemporain' : 'color-photo',
            'Theâtre / Arts de la rue / Cirque' : 'color-theatre',
            'Autres' : 'color-autres'
        };
        return function() {
            var classes = {};
            classes[classesMap[$scope.category]] = true;
            return classes;
        };
    })();
});
