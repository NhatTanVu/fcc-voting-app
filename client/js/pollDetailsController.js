/*global angular*/
/*global Chart*/
angular.module('votingApp', [])
  .controller('PollDetailsController', function($scope, $http, $httpParamSerializerJQLike) {
    var pollDetailsController = this;
    pollDetailsController.poll = null;
    pollDetailsController.selectedOptionId = null;
    pollDetailsController.CUSTOM_OPTION_ID = "#c#u#s#t#o#m#";
    pollDetailsController.customValue = null;
 
    pollDetailsController.signInWithGoogle = function() {
      routeTo("auth/google");
    };
    pollDetailsController.showMyPolls = function() {
      routeTo("myPolls");
    };
    pollDetailsController.createPoll = function() {
      routeTo("createPoll");
    };
    pollDetailsController.signOut = function() {
      routeTo("logout");
    };
    pollDetailsController.shareOnTwitter = function() {
      var encodedBaseHref = encodeURI(document.getElementsByTagName('base')[0].href);
      var url = 'https://twitter.com/intent/tweet?original_referer=https%3A%2F%2Fabout.twitter.com%2Fresources%2Fbuttons&ref_src=twsrc%5Etfw&text=' 
        + pollDetailsController.poll.title + '%20%7C%20FCC%20Voting%20%7C&tw_p=tweetbutton&url='
        + encodedBaseHref + 'viewPoll%2F' 
        + pollDetailsController.poll._id;
      window.open(url, 'Share a link on Twiter', 'width=550, height=420'); 
      return false;
    };
    pollDetailsController.changeOption = function () {
      //alert(pollDetailsController.selectedOption);
    };
    pollDetailsController.submitVote = function () {
      var headers = {
        headers : {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      };
      var queryURL = '/api/votePoll';
      
      var values = {};
      if (pollDetailsController.selectedOptionId == pollDetailsController.CUSTOM_OPTION_ID)
        values = {"isCustom": true, "pollId": pollDetailsController.poll._id, "customValue": pollDetailsController.customValue};
      else
        values = {"isCustom": false, "optionId": pollDetailsController.selectedOptionId};
      
      $http.post(queryURL, $httpParamSerializerJQLike(values), headers)
      .then(function(response) {
        if (response.data.success === true) {
          pollDetailsController.init(pollDetailsController.poll._id);
        }
      }, function(response) {
        // handle error
        alert("Error. status: " + response.status + " statusText: " + response.statusText);
      });
    };
    pollDetailsController.removePoll = function () {
      var headers = {
        headers : {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      };
      var queryURL = '/api/removePoll';
      
      var values = {"pollId": pollDetailsController.poll._id};
      
      $http.post(queryURL, $httpParamSerializerJQLike(values), headers)
      .then(function(response) {
        if (response.data.success === true) {
          routeTo("/");
        }
      }, function(response) {
        // handle error
        alert("Error. status: " + response.status + " statusText: " + response.statusText);
      });
    }
    pollDetailsController.init = function (pollId) {
      var headers = {
        headers : {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      };
      var values = {"pollId": pollId};
      var queryURL = '/api/getPollById';
      
      $http.post(queryURL, $httpParamSerializerJQLike(values), headers)
      .then(function(response) {
        pollDetailsController.poll = response.data;
        drawChart(pollDetailsController.poll.options);
      }, function(response) {
        // handle error
        alert("Error. status: " + response.status + " statusText: " + response.statusText);
      });
      
      //!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');
    };
    
    var routeTo = function (routeName) {
      var baseHref = document.getElementsByTagName('base')[0].href;
      if ((baseHref.indexOf("//") + 1) == baseHref.lastIndexOf("/"))
        window.location = baseHref + "/" + routeName;
      else
        window.location = baseHref.substring(0, baseHref.lastIndexOf("/")) + "/" + routeName;
    };
    var drawChart = function(options) {
      var ctx = document.getElementById("chart-area").getContext("2d");
      var chartConfig = setupChartConfig(options);
      if (window.myDoughnut)
        window.myDoughnut.destroy();
      window.myDoughnut = new Chart(ctx, chartConfig);
    };
    var setupChartConfig = function(options) {
      var chartConfig = {
        type: 'doughnut',
        data: {
          datasets: [{
              data: [],
              backgroundColor: [],
              label: '# of Votes'
          }],
          labels: []
        },
        options: {
          responsive: true,
          legend: {
              position: 'top',
          },
          title: {
              display: false,
              text: '# of Votes'
          }
        }
      };
      
      options.forEach(function(option) {
        chartConfig.data.datasets[0].data.push(option.numOfVotes);
        chartConfig.data.labels.push(option.name);
      });
      
      var colors = rgbColors(options.length);
      colors.forEach(function(color) {
        chartConfig.data.datasets[0].backgroundColor.push("rgb("+color[0]+","+color[1]+","+color[2]+")");
      });
      
      return chartConfig;
    };
    /**
     * HSV to RGB color conversion
     *
     * H runs from 0 to 360 degrees
     * S and V run from 0 to 100
     * 
     * Ported from the excellent java algorithm by Eugene Vishnevsky at:
     * http://www.cs.rit.edu/~ncs/color/t_convert.html
     */
    var hsvToRgb = function(h, s, v) {
      var r, g, b;
      var i;
      var f, p, q, t;
    
      // Make sure our arguments stay in-range
      h = Math.max(0, Math.min(360, h));
      s = Math.max(0, Math.min(100, s));
      v = Math.max(0, Math.min(100, v));
    
      // We accept saturation and value arguments from 0 to 100 because that's
      // how Photoshop represents those values. Internally, however, the
      // saturation and value are calculated from a range of 0 to 1. We make
      // That conversion here.
      s /= 100;
      v /= 100;
    
      if (s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
      }
    
      h /= 60; // sector 0 to 5
      i = Math.floor(h);
      f = h - i; // factorial part of h
      p = v * (1 - s);
      q = v * (1 - s * f);
      t = v * (1 - s * (1 - f));
    
      switch (i) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
    
        case 1:
          r = q;
          g = v;
          b = p;
          break;
    
        case 2:
          r = p;
          g = v;
          b = t;
          break;
    
        case 3:
          r = p;
          g = q;
          b = v;
          break;
    
        case 4:
          r = t;
          g = p;
          b = v;
          break;
    
        default: // case 5:
          r = v;
          g = p;
          b = q;
      }
    
      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };
    /**
     * Generate distinct RGB colors
     * 
     * t is the total number of colors
     * you want to generate.
     */
    var rgbColors = function(t) {
      t = parseInt(t);
      if (t < 2)
        throw new Error("'t' must be greater than 1.");
    
      // distribute the colors evenly on
      // the hue range (the 'H' in HSV)
      var i = 360 / (t - 1);
    
      // hold the generated colors
      var r = [];
      var sv = 70;
      for (var x = 0; x < t; x++) {
        // alternate the s, v for more
        // contrast between the colors.
        sv = sv > 90 ? 70 : sv+10;
        r.push(hsvToRgb(i * x, sv, sv));
      }
      return r;
    };
    
    // at the bottom of your controller
    //var init = function () {
    //};
    // and fire it after definition
    //init();
  });