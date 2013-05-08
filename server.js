var express = require('express');
var app = express();

app.use("/", express.static(__dirname + '/static'));

// app.disable('x-powered-by');

app.use(function (req, res, next) {
  res.header("X-Powered-by", "michalb");
  next();
});

app.get('/api/', function (req, res) {

	res.header("XXX", "ou yeah");
	res.send('hello from express.js framework - michalb');

})

app.get('/api/hello', function(req, res) {

	var who = req.query['who'];
	res.send('hello ' + (who ? who : "<nikdo>"));

});


app.listen(8080)