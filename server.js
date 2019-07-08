const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const newIPN = require('./models/ipn');
const logger = require('./configs/logger');

const app = express();
app.use(bodyParser.urlencoded({	extended: false	}));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost/paypal';

mongoose.connect(MONGO_URI, { useNewUrlParser: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'DB Connection Error:')); // eslint-disable-line no-console
db.once('open', () => { console.log(`Connected to DB: ${MONGO_URI}\n`); }); // eslint-disable-line no-console

app.get('/', (req, res) => { res.send('OK'); }); // Health check

app.post('/', (req, res) => {
  // Before anything else, log the IPN
  logger.info(`New IPN Message: ${JSON.stringify(req.body)}`);

  // Read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
  res.status(200).send('OK');
  res.end();

  let postreq = 'cmd=_notify-validate';

  Object.keys(req.body).forEach((key) => {
    postreq = `${postreq}&${key}=${req.body[key]}`;
  });

  logger.debug(`IPN Postback: ${postreq}`);

  const options = {
    url: 'https://www.sandbox.paypal.com/cgi-bin/webscr',
    method: 'POST',
    headers: {
      Connection: 'close',
    },
    body: postreq,
    strictSSL: true,
    rejectUnauthorized: false,
    requestCert: true,
    agent: false,
  };

  request(options, (error, response, body) => {
    logger.debug(`${response.statusCode}: ${body}`);
    if (!error && response.statusCode === 200) {
      // inspect IPN validation result and act accordingly
      if (body.substring(0, 8) === 'VERIFIED') {
        // To loop through the &_POST array and print the NV pairs to the screen:
        logger.debug('IPN Data: ');
        Object.keys(req.body).forEach((key) => {
          logger.debug(`${key}=${req.body[key]}`);
        });
      } else if (body.substring(0, 7) === 'INVALID') {
        // IPN invalid, log for manual investigation
        logger.error(`IPN Invalid: ${body}`);
      }
      // Save the IPN and associated data to MongoDB
      newIPN.create({
        ipnMessageRaw: JSON.stringify(req.body),
        ipnMessage: req.body,
        ipnPostback: postreq,
        status: body,
        timestamp: Date.now(),
      }, (err) => {
        if (err) logger.error(`DB Create Error${err}`);
      });
    }
  });
});

const port = process.env.PORT || 8888;
app.listen(port);
console.log(`Listening for IPN's at http://localhost:${port}`); // eslint-disable-line no-console
