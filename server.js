var express = require('express');  
var app = express();

// bodyParser
app.use(express.json());
app.use(express.urlencoded());

// set the view engine to ejs
app.set('view engine', 'ejs');

app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));

require('dotenv').config();
require('./app/passportConfig.js').config(app);
require('./app/route.js').config(app);

var port = process.env.PORT || 8080;
app.listen(port, function () {
  console.log('NodeJS listening on port ' + port + '...');
});