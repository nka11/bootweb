define("bootweb", [
	"jquery",
	"libs/backbone",
	"libs/underscore-min",
	"libs/jquery.json-2.3",
	"libs/jquery-ui-1.9-latest.min"
	], // pre load jquery-ui 
function() {
    //require(["libs/jquery.ui.tooltip"], function() {
    require(["lib/audio"]); // load player framework
    require(window.mainConfig.scriptsLoad);
    //});
});
