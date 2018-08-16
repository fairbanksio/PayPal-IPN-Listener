var mongoose = require('mongoose');

var schema = new mongoose.Schema(
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

var ipnMsg = mongoose.model('ipnMsg', schema);

module.exports = ipnMsg;