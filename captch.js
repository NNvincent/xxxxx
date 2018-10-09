
var PW = require("png-word"),
    fs = require("fs");
var pngword = new PW(PW.GREEN);
pngword.on("parsed", function () {
  pngword.createPNG("hello, world!", function (png) {
    fs.writeFileSync("pngword.png", png);
  });
});