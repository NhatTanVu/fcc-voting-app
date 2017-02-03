'use strict';

var express = require('express');  
var passport = require('passport');
var models = require('./models');
var common = require('./common');
var mongoose = require('mongoose');
var User = models.User;
var Poll = models.Poll;
var PollOption = models.PollOption;

var routeConfig = {
    config: function(app) {
        app.use('/', express.static('client'));
        app.get('/', function(req, res) {
            initSessionUserInfo(req);
            res.render('pages/index', {
                userInfo: req.session.userInfo,
                isMyVote: false
            });
        });
        app.get('/myPolls', function(req, res) {
            initSessionUserInfo(req);
            res.render('pages/index', {
                userInfo: req.session.userInfo,
                isMyVote: true
            });
        });
        app.get('/logout', function(req, res) {
            req.logout();
            req.session.userInfo = {
                isAuthenticated: false,
                _id: null,
                displayName: null,
                email: null,
                photo: null
            };
            res.redirect('/');
        });
        app.get('/createPoll', function(req, res) {
            initSessionUserInfo(req);
            res.render('pages/newPoll', req.session.userInfo);
        });
        app.get('/viewPoll/:pollId', function(req, res) {
            var pollId = req.params.pollId;
            initSessionUserInfo(req);
            
            if (pollId) {
                getPollById(pollId, function(err, poll) {
                    if (err) {
                        res.status(500).send({ error: err });
                    }
                    else {
                        res.render('pages/pollDetails', {
                            userInfo: req.session.userInfo,
                            pollId: pollId,
                            pollTitle: poll.title
                        });
                    }
                });
            }
        });
        
        /* API methods */
        app.post('/api/getPollById', function (req, res) {
            var pollId = req.body.pollId;
            getPollById(pollId, function(err, poll) {
                if (err) {
                    res.status(500).send({ error: err });
                }
                else {
                    res.status(200).send(poll);
                }
            });
        });
        app.post('/api/getMyPolls', function (req, res) {
            var userId = req.session.userInfo._id;
            var connection = mongoose.createConnection(process.env.MONGO_URI);
            User(connection).aggregate([
                { "$match": {"_id": userId.toObjectId()} },
                { "$unwind": "$polls" },
                { "$project": {"_id": 0, "title": "$polls.title", "pollId": "$polls._id" }}
            ], function(err, myPolls) {
                connection.close(function() {
                    if (err) {
                        res.status(500).send({ error: err });
                    }
                    else {
                        res.status(200).send(myPolls);
                    }
                });
            });
        });
        app.post('/api/getAllPolls', function (req, res) {
            var connection = mongoose.createConnection(process.env.MONGO_URI);
            User(connection).aggregate([
                    { "$unwind": "$polls" },
                    { "$project": {"_id": 0, "title": "$polls.title", "pollId": "$polls._id" }}
                ], function(err, allPolls) {
                    connection.close(function() {
                        if (err) {
                            res.status(500).send({ error: err });
                        }
                        else {
                            res.status(200).send(allPolls);
                        }
                    });
                }
            );
        });
        app.post('/api/votePoll', function (req, res) {
            var isCustom = req.body.isCustom;
            var connection = mongoose.createConnection(process.env.MONGO_URI);
            
            var queryObj = {}, updateObj = {};
            if (isCustom === 'true') {
                var customValue = req.body.customValue;
                var pollId = req.body.pollId;
                queryObj = {"polls._id": pollId.toObjectId()};
                updateObj = {"$push": { "polls.$.options": {
                    name: customValue,
                    numOfVotes: 1
                }}};
            }
            else {
                var optionId = req.body.optionId.split("_")[0];
                var optionPos = req.body.optionId.split("_")[1];
                queryObj = {"polls.options._id": optionId.toObjectId()};
                updateObj = {"$inc": {}};
                updateObj["$inc"]["polls.$.options." + optionPos + ".numOfVotes"] = 1;
            }
            
            User(connection).update(queryObj, updateObj,
                function(err, doc) {
                    connection.close(function() {
                        if (err) {
                            res.status(500).send({ error: err });
                        }
                        else {
                            res.status(200).send({ success: true });
                        }
                    });
                }
            );
        });    
        app.post('/api/createPoll', function (req, res) {
            var userId = req.session.userInfo._id;
            var pollId = req.body.pollId;
            var pollTitle = req.body.pollTitle;
            var pollOptions = req.body.pollOptions.split("\n");
            var connection = mongoose.createConnection(process.env.MONGO_URI);
            
            if (!pollId) {
                var newPoll = new Poll(connection, {
                    title: pollTitle,
                    options: []
                });
                pollOptions.forEach(function(value){
                    newPoll.options.push(new PollOption(connection, {
                        name: value,
                        numOfVotes: 0
                    }));
                });
            
                // Create new poll
                User(connection).update(
                    { 
                        "_id": userId.toObjectId()
                    },
                    {
                        "$push": {
                            "polls": newPoll.toObject()
                        }
                    },
                    function(err, doc) {
                        connection.close(function() {
                            if (err) {
                                res.status(500).send({ error: err });
                            }
                            else {
                                res.status(200).send({ success: true });
                            }
                        });
                    }
                );
            }
        });
        app.post('/api/removePoll', function (req, res) {
            var userId = req.session.userInfo._id;
            var pollId = req.body.pollId;
            
            if (pollId && userId) {
                var connection = mongoose.createConnection(process.env.MONGO_URI);
                var queryObj = {
                    $and : [
                        { "polls._id": pollId.toObjectId() },
                        { "_id": userId.toObjectId() }
                    ]
                };
                var updateObj = {
                    $pull: { "polls": {"_id": pollId.toObjectId()}}
                };
                
                User(connection).update(queryObj, updateObj,
                    function(err, doc) {
                        connection.close(function() {
                            if (err) {
                                res.status(500).send({ error: err });
                            }
                            else {
                                res.status(200).send({ success: true });
                            }
                        });
                    }
                );
            }
            else {
                res.status(200).send({ success: true });
            }
        });
        // GET /auth/google
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  The first step in Google authentication will involve redirecting
        //   the user to google.com.  After authorization, Google will redirect the user
        //   back to this application at /auth/google/callback
        app.get('/auth/google', passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/userinfo.email'] }));
        // GET /auth/google/callback
        //   Use passport.authenticate() as route middleware to authenticate the
        //   request.  If authentication fails, the user will be redirected back to the
        //   login page.  Otherwise, the primary route function function will be called,
        //   which, in this example, will redirect the user to the home page.
        app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
            function(req, res) {
                req.session.userInfo = {
                    isAuthenticated: true,
                    _id: req.user._id,
                    displayName: req.user.google.displayName,
                    email: req.user.google.email.value,
                    photo: req.user.google.photos[0].value
                };
                res.redirect('/');
            }
        );
        
        var initSessionUserInfo = function(req) {
            if (!req.session.userInfo) {
                req.session.userInfo = {
                    isAuthenticated: false,
                    _id: null,
                    displayName: null,
                    email: null,
                    photo: null
                };
            }
        };
        var getPollById = function(pollId, callback) {
            var connection = mongoose.createConnection(process.env.MONGO_URI);
            User(connection).aggregate([
                { "$unwind": "$polls" },
                { "$match": {"polls._id": pollId.toObjectId() } },
                { "$project": {"_id": "$polls._id", "title": "$polls.title", "options": "$polls.options" }},
                { "$limit": 1 }
            ], function(err, polls) {
                connection.close(function() {
                    if (polls.length == 1) {
                        callback(err, polls[0]);
                    }
                    else {
                        callback(err, null);
                    }
                });
            });
        };
        console.log("Finish configure routes");
    }
};

module.exports = routeConfig;