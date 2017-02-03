/*global angular*/
/*global $scope*/
/*global $http*/
/*global $httpParamSerializerJQLike*/
var module = angular.module('votingApp', []);
module.controller('NewPollController', 
  function($scope, $http, $httpParamSerializerJQLike) {
    var newPollCtrl = this;

    newPollCtrl.signInWithGoogle = function() {
      routeTo("auth/google");
    };
    newPollCtrl.showMyPolls = function() {
      routeTo("myPolls");
    };
    newPollCtrl.createPoll = function() {
      routeTo("createPoll");
    };
    newPollCtrl.signOut = function() {
      routeTo("logout");
    };
    newPollCtrl.save = function() {
      var headers = {
        headers : {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      };
      var values = {
        pollId: null,
        pollTitle: $scope.pollTitle,
        pollOptions: $scope.pollOptions
      };
      $http.post('/api/createPoll', $httpParamSerializerJQLike(values), headers)
      .then(function(response) {
        routeTo("/");
      }, function(response) {
        alert("Error. status: " + response.status + " statusText: " + response.statusText);
      });
    };
    newPollCtrl.cancel = function() {
      routeTo("/");
    };

    var routeTo = function (routeName) {
      var baseHref = document.getElementsByTagName('base')[0].href;
      if ((baseHref.indexOf("//") + 1) == baseHref.lastIndexOf("/"))
        window.location = baseHref + "/" + routeName;
      else
        window.location = baseHref.substring(0, baseHref.lastIndexOf("/")) + "/" + routeName;
    };
  }
);