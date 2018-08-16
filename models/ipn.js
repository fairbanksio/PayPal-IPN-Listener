var mongoose = require('mongoose');

var ipn = new mongoose.Schema(
  {
    ipnMessage: String,
    ipnPostback: String,
    status: String,
    timestamp: String,
  }, {
    collection: 'ipn',
    versionKey: false
  }
);

var ipnMsg = mongoose.model('ipnMsg', ipn);

module.exports = ipnMsg;