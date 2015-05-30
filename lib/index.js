var assert = require("assert");
var DscGrabber = function(file) {
  this.file = file;
}

DscGrabber.prototype.parse = function(cb) {
  assert.strictEqual(typeof(cb), "function", "Callback must be provided");
  var fs = require("fs");
  var InternetMessage = require("internet-message");
  var self = this;
  var f = fs.readFile(this.file, { encoding: "ascii" }, function(err, data) {
    if (err) {
      return cb(err);
    } else {
      var parsed = InternetMessage.parse(data);
      if (parsed["-----begin pgp signed message----"] && parsed.body) {
        parsed = InternetMessage.parse(parsed.body);
        cb(null, parsed);
      } else {
        cb(null, parsed);
      }
    }
  });

}

module.exports = DscGrabber;
