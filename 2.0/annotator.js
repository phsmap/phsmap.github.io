function initAnnotator() {
	window.svgmap = new PVMap("map3_main");
	window.svgmap.setCallbacks("onclick", function(evt) {
		new_id = prompt("The current ID is: "+evt.target.id+"; what is the new ID?");
		window.svgmap.set_property(evt.target.id, "id", new_id);
		window.svgmap.placeText(new_id, null, evt.target.id, -1, -1, "#FFFF00", "18px", "Verdana");
	});
}