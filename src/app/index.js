'use strict';

angular.module('festivals', ['ngAnimate', 'ngTouch', 'ngSanitize', 'ui.router',
                             'ngMaterial', 'leaflet-directive', 'ui.date'])
    .config(function ($stateProvider, $urlRouterProvider) {
        $stateProvider.state('home', {
            url: '/',
            templateUrl: 'app/main/main.html',
            controller: 'MainCtrl'
        });

        $urlRouterProvider.otherwise('/');
    });
