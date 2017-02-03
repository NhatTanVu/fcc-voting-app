/*global process*/
'use strict';

var passport = require('passport');
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var models = require('./models');
var mongoose = require('mongoose');
var User = models.User;

var passportConfig = {
    config: function(app) {
        console.log("callback: " + process.env.GOOGLE_CALLBACK_URL);
        
        // Initialize Passport and restore authentication state, if any, from the
        // session.
        app.use(passport.initialize());
        app.use(passport.session());
        
        // Configure Passport authenticated session persistence.
        //
        // In order to restore authentication state across HTTP requests, Passport needs
        // to serialize users into and deserialize users out of the session.  In a
        // production-quality application, this would typically be as simple as
        // supplying the user ID when serializing, and querying the user record by ID
        // from the database when deserializing.  However, due to the fact that this
        // example does not have a database, the complete Twitter profile is serialized
        // and deserialized.
        passport.serializeUser(function(user, cb) {
          cb(null, user.id);
        });
        
        passport.deserializeUser(function(id, cb) {
          var connection = mongoose.createConnection(process.env.MONGO_URI);
          User(connection).findById(id, function (err, user) {
            connection.close(function() {
              cb(err, user);
            });
		      });
        });
    
        // Use the GoogleStrategy within Passport.
        //   Strategies in Passport require a 'verify' function, which accept
        //   credentials (in this case, an accessToken, refreshToken, and Google
        //   profile), and invoke a callback with a user object.
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
          },
          function(accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
              var connection = mongoose.createConnection(process.env.MONGO_URI);
    		      User(connection).findOne({ 'google.id': profile.id }, function (err, user) {
    		        if (err) {
    		          return connection.close(function() {
    		            done(err);
    		          });
    	          }
    
    			      if (user) {
    			        return connection.close(function() {
    			          done(null, user);
    			        });
    			      } else {
    			        var newUser = new User(connection)();
    
    			        newUser.google.id = profile.id;
    			        newUser.google.displayName = profile.displayName;
    			        newUser.google.email = {
    			          value: profile.emails[0].value,
    			          emailType: profile.emails[0].type
    			        };
    			        newUser.google.photos = profile.photos;
    			        newUser.polls = [];
    
    			        newUser.save(function (err) {
    			          if (err) {
    			            connection.close();
    			            throw err;
    			          }
                    return connection.close(function() {
                      done(null, newUser);
                    });
    			        });
    			      }
    	        });
    		    });
          }
        ));
        
        console.log("Finish configure Passport");
    }
};

module.exports = passportConfig;