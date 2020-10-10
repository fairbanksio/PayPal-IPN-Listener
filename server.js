const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const newIPN = require('./models/ipn');
const logger = require('./configs/logger');

const app = express();
app.use(bodyParser.urlencoded({	extended: false	}));

const connectToDB = () => {
  mongoose.connect(
    process.env.MONGO_URI || 'mongodb://localhost/paypal',
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    },
  ).catch(
    err => console.warn(`MongoDB connect error: ${err}`) // eslint-disable-line no-console
  );
};

connectToDB();

mongoose.connection.on('connected', () => {
  const port = process.env.PORT || 8888;
  app.listen(port);
  console.log(`Listening for PayPal IPN's at http://localhost:${port}`); // eslint-disable-line no-console
});

mongoose.connection.on('disconnected', (err) => {
  console.warn(`MongoDB disconnected: ${err}`); // eslint-disable-line no-console
  setTimeout(() => { connectToDB(); }, 3000);
});

mongoose.connection.on('error', (err) => {
  console.warn(`MongoDB error: ${err}`); // eslint-disable-line no-console
  setTimeout(() => { connectToDB(); }, 3000);
});

let paypal_url = null;
if (process.env.PAYPAL_ENV && process.env.PAYPAL_ENV.toUpperCase() === "LIVE") {
  paypal_url = 'https://www.paypal.com/cgi-bin/webscr';
} else if (process.env.PAYPAL_ENV && process.env.PAYPAL_ENV.toUpperCase() === "SANDBOX") {
  paypal_url = 'https://www.sandbox.paypal.com/cgi-bin/webscr';
} else {
  paypal_url = 'https://www.sandbox.paypal.com/cgi-bin/webscr';
}

app.get('/', (_req, res) => { res.send('OK'); }); // Health check
app.post('/', (req, res) => {
  // Before anything else, log the IPN
  logger.info(`[${Date.now()}] New IPN Message: ${JSON.stringify(req.body)}`);

  // Read the IPN message sent from PayPal and prepend 'cmd=_notify-validate'
  res.status(200).send('OK');
  res.end();

  let postreq = 'cmd=_notify-validate';

  Object.keys(req.body).forEach((key) => {
    postreq = `${postreq}&${key}=${req.body[key]}`;
  });

  logger.debug(`[${Date.now()}] IPN Postback: ${postreq}`);

  const options = {
    url: paypal_url,
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
        logger.debug(`[${Date.now()}] IPN Data: `);
        Object.keys(req.body).forEach((key) => {
          logger.debug(`${key}=${req.body[key]}`);
        });
      } else if (body.substring(0, 7) === 'INVALID') {
        // IPN invalid, log for manual investigation
        logger.error(`[${Date.now()}] IPN Invalid: ${body}`);
      }
      // Save the IPN and associated data to MongoDB
      newIPN.create({
        ipnMessageRaw: JSON.stringify(req.body),
        ipnMessage: req.body,
        ipnPostback: postreq,
        status: body,
        timestamp: Date.now(),
      }, (err) => {
        if (err) logger.error(`[${Date.now()}] DB Create Error${err}`);
      }).catch(err => {logger.error(`[${Date.now()}] DB Create Error${err}`);});
    }
  });
});