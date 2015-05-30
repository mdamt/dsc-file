var assert = require("assert");
var data = __dirname + "/assets/";
describe("DscGrabber", function() {
  var DscGrabber = require(__dirname + "/..");
  var dsc;
  
  it("parses a plain dsc", function(done) {
    dsc = new DscGrabber(data + "dsc-without-pgp.dsc");
    dsc.parse(function(err, parsed) {
      assert.strictEqual(parsed.format, "3.0 (native)");
      done();
    });
  });
});
