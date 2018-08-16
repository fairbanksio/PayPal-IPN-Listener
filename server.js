var express = require('express');
var queryString = require('querystring');
var request = require('request');
var bodyParser = require('body-parser');
//var logger = require('../config/logger')

var app = express();
app.use(bodyParser.urlencoded({	extended: false }))


app.post('/', function(req, res) {
  // Before anything else, log the IPN
	//logger.info('IPN Request: ' + req.body);

	// Read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
	req.body = req.body || {};
	res.status(200).send('OK');
	res.end();



	req.body.cmd = "_notify-validate"
	postreq = JSON.toString(req.body)
	//console.log(req.body)


	var postreq = 'cmd=_notify-validate';
	for (var key in req.body) {
		var value = queryString.escape(req.body[key]);
		postreq = postreq + "&" + key + "=" + value;
	}

	var options = {
		url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
		method: 'POST',
		headers: {
			'Connection': 'close'
		},
		body: postreq,
		strictSSL: true,
		rejectUnauthorized: false,
		requestCert: true,
		agent: false
	};

	request(options, function callback(error, response, body) {
		console.log(response.statusCode);
		if (!error && response.statusCode === 200) {
			// inspect IPN validation result and act accordingly
			if (body.substring(0, 8) === 'VERIFIED') {
				// The IPN is verified, process it
				console.log('IPN Verified\n\n');

				var item_name = req.body['item_name'];
				var item_number = req.body['item_number'];
				var payment_status = req.body['payment_status'];
				var payment_amount = req.body['mc_gross'];
				var payment_currency = req.body['mc_currency'];
				var txn_id = req.body['txn_id'];
				var receiver_email = req.body['receiver_email'];
				var payer_email = req.body['payer_email'];

				// To loop through the &_POST array and print the NV pairs to the screen:
				console.log('IPN Data: ')
				for (var key in req.body) {
					var value = req.body[key];
					console.log(key + "=" + value);
				}

        // Save the IPN and associated data to MongoDB

			} else if (body.substring(0, 7) === 'INVALID') {
				// IPN invalid, log for manual investigation
				console.log('IPN Invalid: ' + body);
			}
		}
	});
});

var port = 3000;
app.listen(port);
var msg = 'Listening at http://localhost:' + port;
console.log(msg);
