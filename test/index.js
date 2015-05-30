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

  it("parses a dsc enclosed in PGP body", function(done) {
    dsc = new DscGrabber(data + "dsc-with-pgp.dsc");
    dsc.parse(function(err, parsed) {
      assert.strictEqual(parsed.format, "1.0");
      done();
    });
  });

  it("breaks because specified file doesn't exist", function(done) {
    dsc = new DscGrabber(data + "nonexistant-dsc");
    dsc.parse(function(err, parsed) {
      assert.strictEqual(err.code, "ENOENT");
      assert.notStrictEqual(err, "undefined");
      done();
    });
  });



});
