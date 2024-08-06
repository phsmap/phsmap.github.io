function gebi(id) {
	return document.getElementById(id);
} 

function startUpDesktopListeners() {
	const zoomableDiv = document.getElementById('zoomableDiv');
	
    // MOUSE LISTENERS
	let beingHeld = false;
	let beganClickingX = 0;
	let beganClickingY = 0;
	document.addEventListener("mousedown", function(evt) {
		beganClickingX = evt.clientX;
		beganClickingY = evt.clientY;
		beingHeld = true;
		//console.log(`Click event start: ${beganClickingX}, ${beganClickingY}`);
	});
	document.addEventListener("mouseup", function(evt) {
		beingHeld = false;
	});
	document.addEventListener("mousemove", function(evt) {
		if (beingHeld) {
			dX = -0.95 * (beganClickingX - evt.clientX) * (1/1);
			dY = -0.95 * (beganClickingY - evt.clientY) * (1/1);
			//console.log(`dX, dY = ${dX}, ${dY}`);
			zoomableDiv.style.left = (Number(zoomableDiv.style.left.slice(0,-2)) + dX) + "px"; 
			zoomableDiv.style.top = (Number(zoomableDiv.style.top.slice(0,-2)) + dY) + "px"; 
			beganClickingX = evt.clientX;
			beganClickingY = evt.clientY;
		}
	});
	document.addEventListener("wheel", function(evt) {
		evt.preventDefault();
		//console.log(`dY_raw = ${evt.deltaY}`);
		scale += (evt.deltaY * -0.0005);
		zoomableDiv.style.transform = `scale(${scale})`;
		gebi("zoom").innerHTML = `zoom: ${scale.toFixed(2)}`;
	}, {passive: false});
	
	
	
	// TOUCH LISTENERS
    let scale = 1;
    let lastTouchX;
    let lastTouchY;

    zoomableDiv.addEventListener('touchstart', function(event) {
      if (event.touches.length === 2) {
        event.preventDefault();
        // If two fingers touch the screen, calculate the initial distance between them
        initialTouchDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
      } else if (event.touches.length === 1) {
        event.preventDefault();
        // If one finger touches the screen, record its position for dragging
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
      }
    });

    zoomableDiv.addEventListener('touchmove', function(event) {
      if (event.touches.length === 2) {
        // Calculate the current distance between the two fingers
        const currentTouchDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );

        // Calculate the scale factor based on the change in distance
        const scaleFactor = currentTouchDistance / initialTouchDistance;

        // Apply the scale transformation to the content inside the div
        scale *= scaleFactor;
        this.style.transform = `scale(${scale})`;
		gebi("zoom").innerHTML = `zoom: ${scale.toFixed(2)}`;

        // Update the initial touch distance for the next move event
        initialTouchDistance = currentTouchDistance;
      } else if (event.touches.length === 1) {
        // If one finger is used, calculate the movement distance
        const deltaX = event.touches[0].clientX - lastTouchX;
        const deltaY = event.touches[0].clientY - lastTouchY;

        // Move the content inside the div by the calculated distance
        this.style.left = `${parseFloat(this.style.left || 0) + deltaX}px`;
        this.style.top = `${parseFloat(this.style.top || 0) + deltaY}px`;

        // Update the last touch position for the next move event
        lastTouchX = event.touches[0].clientX;
        lastTouchY = event.touches[0].clientY;
      }
    });
  }
  
function resetViewport() {
	var obj = window.mapSet.activeMap.map_dataset_object;
	gebi("zoomableDiv").style.left = `${obj.desktop_default_x}px`;
	gebi("zoomableDiv").style.top = `${obj.desktop_default_y}px`;
	gebi("zoomableDiv").style.transform = `scale(${obj.desktop_default_zoom})`;
	let scale = obj.desktop_default_zoom;
	gebi("zoom").innerHTML = `zoom: ${scale.toFixed(2)}`;
}

function populateLookupMenu(id) {
	document.getElementById("show_landmark_data").style.display = "block";
	document.querySelectorAll('.landmark_datacell').forEach(e => e.remove());
	objectInReference = window.mapSet.activeMap.map_dataset_object.lookupFeatureObject(id);
	if (!objectInReference) {
		alert(`On populateLookupMenu( ${id} ), could not find the corresponding object on the active map.`);
		return null;
	}
	table_element = document.getElementById("lookup_table");
	keys = Object.keys(objectInReference);
	for (let i = 0; i < keys.length; i++) {
		if (objectInReference[keys[i]] && objectInReference[keys[i]] != ""  && ["landmark_id", "search_terms", "attached_to", "physical_location"].includes(keys[i]) == false) {
			newTR = document.createElement("tr");
			newTD1 = document.createElement("td");
			newTD2 = document.createElement("td");
			newTD1.textContent = keys[i];
			newTD2.textContent = objectInReference[keys[i]].replaceAll(";", "\n");
			newTD2.style.whiteSpace = "pre-wrap";
			newTR.appendChild(newTD1);
			newTR.appendChild(newTD2);
			newTR.classList.add("landmark_datacell");
			table_element.appendChild(newTR);
			tc = "(error!)";
			map_area = window.mapSet.activeMap.map_dataset_object.svg_id;
			if (objectInReference.long_name) {
				if (objectInReference.official_room_number) tc = `${objectInReference.long_name}/Rm ${objectInReference.official_room_number} (${map_area})`;
				else tc = `${landmark_name} (${map_area})`;
			} 
			else if (objectInReference.official_room_number) tc = `Rm ${objectInReference.official_room_number} (${map_area})`;
			else tc = `${objectInReference.type}: ${objectInReference.landmark_id}`;
			
			document.getElementById("lookup_informal_name").textContent = `${tc}`;
		}
	}
}

function handleKeyDownQuery(ev) {
	if (ev.key == "Enter") searchAndResolve(ev.target.value);
}

function searchAndResolve(search_term) {
	if (!search_term) {
		alert("Search term cannot be empty!");
		return null;
	}
	results = window.mapSet.searchAllMaps(search_term);
	console.log(results);
	pBody = document.getElementById("resolution_options");
	keys = Object.keys(results);
	
	document.querySelectorAll('.resolution_tr').forEach(e => e.remove());
	
	hits = 0
	
	for (let i = 0; i < keys.length; i++) {
		for (let j = 0; j < results[keys[i]].length; j ++) {
			hits++;
			//Add the row in (yes I chatgpt'd this code because lazy)
			map_area = keys[i];
			landmark_id = results[keys[i]][j];
			
			landmark = window.mapSet.pvmaps[map_area].map_dataset_object.lookupFeatureObject(landmark_id);
			
			landmark_type = landmark.type 
			room_number = landmark.official_room_number
			landmark_name = landmark.long_name 
			
			tc = "(error!)";
			if (landmark_name) {
				if (room_number) tc = `${landmark_name}/Rm ${room_number} (${map_area})`;
				else tc = `${landmark_name} (${map_area})`;
			} 
			else if (room_number) tc = `Rm ${room_number} (${map_area})`;
			else tc = `(obj: ${landmark_type} ${landmark_id}) (${map_area})`;
			
            newA = document.createElement('a');
			newA.textContent = tc;
			newA.classList.add("noselect");
			newA.classList.add("search");
			newA.classList.add("srt_clearable");
			newA.setAttribute("under_map", map_area)
			newA.setAttribute("on_id", landmark_id)
			newA.style.color = "gold";
			newA.onclick = function(evt) {
				window.mapSet.stowAway(window.mapSet.activeMap.map_dataset_object.svg_id);
				window.mapSet.makeActive(evt.target.getAttribute("under_map"));
				resetViewport();
				window.mapSet.pvmaps[evt.target.getAttribute("under_map")].map_dataset_object.flashBorder(evt.target.getAttribute("on_id"));
			}
			newbr = document.createElement("br");
			newbr.classList.add("srt_clearable");
			pBody.append();
			pBody.append(newbr);
			pBody.append(newA);
		}
	}
	if (hits < 1) {
		alert("No search results were returned after searching the whole campus.");
	}
}

window.onload = function() {
	document.addEventListener('keydown', function(event) {
	consoleElement = document.getElementById("console");
    // Check if the Shift key and Escape key are both pressed
    if (event.shiftKey && event.altKey && event.key == 'Enter') {
        // Get the element with the id "console"
        var consoleElement = document.getElementById('console');
        
        // If the element exists, set its display to 'block' to show it
        if (consoleElement.style.display == "none") {
            consoleElement.style.display = 'block';
        } else {
			consoleElement.style.display = 'none';
		}
    }
	});
	
	if (false) {
		console.log = function(content) {
			document.getElementById("console").innerHTML += content;
			document.getElementById("console").innerHTML += "<br><br>";
		}

		console.warn = function(content) {
			document.getElementById("console").innerHTML += `<b style="color:yellow">${content}</b>`;
			document.getElementById("console").innerHTML += "<br><br>";
		}

		console.error = function(content) {
			document.getElementById("console").innerHTML += `<b style="color:red">${content}</b>`;
			document.getElementById("console").innerHTML += "<br><br>";
		}
	}


	console.log("[window.onload] Starting up!");
	console.log("[window.onload] (c) Charles Hu 2024");
	
	window.mapSet = new PVMapGroup();
	window.tmpMaps = {};
	
	Postman.authorized_httpGET("2.0_phs_allmap_dev.txt/bundle.json", function(content) {
		console.log(`[window.onload] Obtained bundle.json; reading as JSON and assembling maps...`);
		var bundle_json = JSON.parse(content);
		bundle_json.forEach(function(map) {
			// Load in already cached URLs
			var svg_content = Postman.sync_cached_httpGET(map.svg_url);
			var layer_data = JSON.parse(Postman.sync_cached_httpGET(map.layer_url));
			var feature_data = CSVReader.readCSV_headerontop(Postman.sync_cached_httpGET(map.feature_url));
						
			// Because maps are keyed by their SVG element ID, we will automatically detect the SVG ID instead of rely on the people who made the map
			// to provide that information
			var onboard_svg_id = PVMap.loadSVGToDOMIfNotAlreadyLoaded(svg_content, PVMap.gebi("zoomableDiv"));
			console.log(`[window.onload] Established a new map: ${onboard_svg_id}:`);
			console.log(`M  ` + JSON.stringify(map));
			console.log(`L  ` + JSON.stringify(layer_data));
			console.log(`F  ` + JSON.stringify(feature_data));

			// This is stuff that isn't on the map main config file because it depends on the receiving application and not the map
			map.single_click_callback = function(evt){};
			map.double_click_callback = function(evt){populateLookupMenu(evt.target.id)};
			map.svg_element_id = onboard_svg_id;
			map.autogenerate_layer_checkboxes_under_element = "feature_checkboxes";
			
			var m1 = new PVMap(map, layer_data, feature_data);
			window.mapSet.addPVMap(m1);
		});
		startUpDesktopListeners();
		resetViewport();
	}, "text");
	
}