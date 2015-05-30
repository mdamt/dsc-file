var assert = require("assert");
var DscGrabber = function(file) {
  this.file = file;
}

DscGrabber.prototype.parse = function(cb) {
  assert.strictEqual(typeof(cb), "function", "Callback must be provided");
  var fs = require("fs");
  var InternetMessage = require("internet-message");
  var f = fs.readFile(this.file, { encoding: "ascii" }, function(err, data) {
    if (err) {
      return cb(err);
    } else {
      var parsed = InternetMessage.parse(data);
      cb(null, parsed);
    }
  });

}

module.exports = DscGrabber;
