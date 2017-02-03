/*global angular*/
var module = angular.module('votingApp', []);
module.controller('VotingController', 
  function($scope, $http, $httpParamSerializerJQLike) {
    var votingCtrl = this;
    votingCtrl.polls = [];
 
    votingCtrl.signInWithGoogle = function() {
      routeTo("auth/google");
    };
    votingCtrl.showMyPolls = function() {
      routeTo("myPolls");
    };
    votingCtrl.createPoll = function() {
      routeTo("createPoll");
    };
    votingCtrl.signOut = function() {
      routeTo("logout");
    };
    votingCtrl.viewPoll = function(pollId) {
      routeTo("viewPoll/" + pollId);
    };
    votingCtrl.init = function (isMyVote) {
      var headers = {
        headers : {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      };
      var values = {};
      var queryURL = isMyVote ? "/api/getMyPolls" : "/api/getAllPolls";
      
      $http.post(queryURL, $httpParamSerializerJQLike(values), headers)
      .then(function(response) {
        votingCtrl.polls = response.data;
      }, function(response) {
        // handle error
        alert("Error. status: " + response.status + " statusText: " + response.statusText);
      });
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