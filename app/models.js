'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PollOptionSchema = new Schema({ name: String, numOfVotes: Number });
var PollSchema = new Schema({
    title: String,
    options: [PollOptionSchema]
});
var UserSchema = new Schema({
	google: {
		id: String,
		displayName: String,
		email: {
			value: String,
			emailType: String
		},
		photos: [{
			value: String
		}]
	},
    polls: [PollSchema]
});

var models = {
	User: function(connection, document) {
		if (!document)
			return connection.model('User', UserSchema);
		else
			return connection.model('User', UserSchema)(document);
	},
	Poll: function(connection, document) {
		if (!document)
			return connection.model('Poll', PollSchema);
		else
			return connection.model('Poll', PollSchema)(document);
	},
	PollOption: function(connection, document) {
		if (!document)
			return connection.model('PollOption', PollOptionSchema);
		else
			return connection.model('PollOption', PollOptionSchema)(document);
	}
};

module.exports = models;