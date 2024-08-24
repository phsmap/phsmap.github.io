"use strict";

function gebi(id) {
	return document.getElementById(id);
} 

// thank you to https://www.w3schools.com/js/js_cookies.asp
// for the cookie get/set code
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
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
			var dX = window.mousemove_sens * (beganClickingX - evt.clientX) * (1/1);
			var dY = window.mousemove_sens * (beganClickingY - evt.clientY) * (1/1);
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
		scale += (evt.deltaY * window.wheel_sens);
		zoomableDiv.style.transform = `scale(${scale})`;
		gebi("zoom").innerHTML = `zoom: ${scale.toFixed(2)}`;
	}, {passive: false});
	
	
	
	// TOUCH LISTENERS
    let scale = 1;
    let lastTouchX;
    let lastTouchY;
	let initialTouchDistance;

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

function setViewport(x, y, zm) {
	gebi("zoomableDiv").style.left = `${x}px`;
	gebi("zoomableDiv").style.top = `${y}px`;
	gebi("zoomableDiv").style.transform = `scale(${zm})`;
	gebi("zoom").innerHTML = `zoom: ${zm}`;
	let scale = zm;
}

function populateLookupMenu(id) {
	document.getElementById("show_landmark_data").style.display = "block";
	document.querySelectorAll('.landmark_datacell').forEach(e => e.remove());
	var objectInReference = window.mapSet.activeMap.map_dataset_object.lookupFeatureObject(id);
	if (!objectInReference) {
		alert(`On populateLookupMenu( ${id} ), could not find the corresponding object on the active map.`);
		return null;
	}
	
	
	document.getElementById("set_nav_origin").setAttribute("fullnode", `${window.mapSet.activeMap.map_dataset_object.svg_id}::${id}`);
	document.getElementById("set_nav_destination").setAttribute("fullnode", `${window.mapSet.activeMap.map_dataset_object.svg_id}::${id}`);
	
	document.getElementById("set_nav_origin").setAttribute("mapname", `${window.mapSet.activeMap.map_dataset_object.svg_id}`);
	document.getElementById("set_nav_destination").setAttribute("mapname", `${window.mapSet.activeMap.map_dataset_object.svg_id}`);
	
	document.getElementById("set_nav_origin").setAttribute("landmarkid", `${id}`);
	document.getElementById("set_nav_destination").setAttribute("landmarkid", `${id}`);
	
	var table_element = document.getElementById("lookup_table");
	var keys = Object.keys(objectInReference);
	for (let i = 0; i < keys.length; i++) {
		if (objectInReference[keys[i]] && objectInReference[keys[i]] != ""  && ["landmark_id", "search_terms", "physical_location", "attached_to"].includes(keys[i]) == false) {
			var newTR = document.createElement("tr");
			var newTD1 = document.createElement("td");
			var newTD2 = document.createElement("td");
			newTD1.textContent = keys[i];
			newTD2.textContent = objectInReference[keys[i]].replaceAll(";", "\n\n").replaceAll("[comma]", ",").replaceAll("[newline]", "\n");;
			newTD2.style.whiteSpace = "pre-wrap";
			newTR.appendChild(newTD1);
			newTR.appendChild(newTD2);
			newTR.classList.add("landmark_datacell");
			table_element.appendChild(newTR);
			var tc = "(warn!)";
			var map_area = window.mapSet.activeMap.map_dataset_object.svg_id;
			if (objectInReference.long_name) {
				if (objectInReference.official_room_number) tc = `${objectInReference.long_name} (${map_area})`;
				else tc = `${objectInReference.long_name} (${map_area})`;
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
	var results = window.mapSet.searchAllMaps(search_term);
	console.log(results);
	var pBody = document.getElementById("resolution_options");
	var keys = Object.keys(results);
	
	document.querySelectorAll('.resolution_tr').forEach(e => e.remove());
	
	var hits = 0
	
	for (let i = 0; i < keys.length; i++) {
		for (let j = 0; j < results[keys[i]].length; j ++) {
			hits++;
			//Add the row in (yes I chatgpt'd this code because lazy)
			var map_area = keys[i];
			var landmark_id = results[keys[i]][j];
			
			var landmark = window.mapSet.pvmaps[map_area].map_dataset_object.lookupFeatureObject(landmark_id);
			
			var landmark_type = landmark.type 
			var room_number = landmark.official_room_number
			var landmark_name = landmark.long_name 
			
			var tc = "(warn!)";
			if (landmark_name) {
				if (room_number) tc = `${landmark_name}/Rm ${room_number} (${map_area})`;
				else tc = `${landmark_name} (${map_area})`;
			} 
			else if (room_number) tc = `Rm ${room_number} (${map_area})`;
			else tc = `(obj: ${landmark_type} ${landmark_id}) (${map_area})`;
			
            var newA = document.createElement('a');
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
				window.mapSet.pvmaps[evt.target.getAttribute("under_map")].map_dataset_object.flashBorder(evt.target.getAttribute("on_id"), "#FFFF00FF;#999999FF", "15px", "0.8s", true);
				document.getElementById("map_select").value = evt.target.getAttribute("under_map");
			}
			var newbr = document.createElement("br");
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
	
	console.log("[window.onload] Starting up!");
	
	window.navhelper = {};
	navhelper.origin = null;
	navhelper.destination = null;
	
	if (!getCookie("vers2_nof12_reporting")) {
		setCookie("vers2_nof12_reporting", "disabled", 40);
		console.log("[window.onload] NoF12 Reporting automatically disabled by default.");
	}
	if (!getCookie("vers2_wheel_sens")) {
		setCookie("vers2_wheel_sens", "-0.0005", 40);
		console.log("[window.onload] Wheel sensitivity automatically set to -0.0005 by default.");
	}
	if (!getCookie("vers2_mousemove_sens")) {
		console.log("[window.onload] Pan sensitivity automatically set to -0.95 by default.");
		setCookie("vers2_mousemove_sens", "-0.95", 40);
	}
	
	window.wheel_sens = Number(getCookie("vers2_wheel_sens"));
	window.mousemove_sens = Number(getCookie("vers2_mousemove_sens"));
	
	gebi("wheel_sens").value = window.wheel_sens;
	gebi("mousemove_sens").value = window.mousemove_sens;
	gebi("curr_type_device").textContent = getCookie("devicePreference");
	gebi("curr_type_legacy").textContent = getCookie("version_preference");
	
	if (window.localStorage.getItem("acstoken")) {
		if (window.localStorage.getItem("acstoken").startsWith("testing")) {
			gebi("tkn_issuer").textContent = "Fixed Testing Token";
		} else {
			var decoded_jwt = JSON.parse(atob(window.localStorage.getItem("acstoken").split(".")[1]));
			gebi("tkn_issuer").textContent = "Azure AD";
			gebi("tkn_name").textContent = decoded_jwt.name;
			gebi("tkn_upn").textContent = decoded_jwt.upn;
			var d_iat = new Date(Number(decoded_jwt.iat) * 1000);
			gebi("tkn_iat").textContent = d_iat.toLocaleString();
			var d_exp = new Date(Number(decoded_jwt.exp) * 1000);
			gebi("tkn_exp").textContent = d_exp.toLocaleString();
		}
	}
	
	
	document.addEventListener('keydown', function(event) {
	var consoleElement = document.getElementById("console");
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

		console.warn = function(content) {
			document.getElementById("console").innerHTML += `<b style="color:red">${content}</b>`;
			document.getElementById("console").innerHTML += "<br><br>";
		}
	}

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
			map.double_click_callback = function(evt){populateLookupMenu(evt.target.id)};
			map.svg_element_id = onboard_svg_id;
			map.autogenerate_layer_checkboxes_under_element = "feature_checkboxes";
			
			var m1 = new PVMap(map, layer_data, feature_data);
			window.mapSet.addPVMap(m1);
			var newOption = document.createElement("option");
			newOption.value = map.svg_element_id;
			newOption.textContent = map.map_screen_name;
			document.getElementById("map_select").appendChild(newOption);
		});
		resetViewport();
		startUpDesktopListeners();
	}, "text");
	
	// apparently re-rendering the map fixes text rendering issues that affect iOS spesifically
	if (window.mapSet && window.activeMap) {
			var rt = window.mapSet.activeMap.map_dataset_object.svg_id; 
			window.mapSet.stowAway(rt); 
			setTimeout(function(){window.mapSet.makeActive(rt)}, 100)
	}
	
}

function eraseRoute() {
	for (let i = 0; i < Object.keys(window.mapSet.pvmaps).length; i++) {
		window[Object.keys(window.mapSet.pvmaps)[i]].applyLayerCheckboxesForThisMap(true);
		var arrows = Array.prototype.slice.call(window[Object.keys(window.mapSet.pvmaps)[i]].group_container.getElementsByClassName("navhelper_arrows"));
		for (let j = 0; j < arrows.length; j++) {
			arrows[j].remove();
		}
	}
}

function displayRoute(route) {
	console.log(`route: ${JSON.stringify(route)}`);
	window[route[0].split("::")[0]].changeBorder(route[0].split("::")[1], "lime", "8px", true);
	for (let i = 1; i < route.length - 1; i++) {
		var jump = route[i];
		console.log(route[i], route[i + 1], navhelper_calculateDisplacementDirection(route[i], route[i + 1]));
		
		var auto_trim = false;
		var truncate = "";
		if (i == route.length - 2) {
			auto_trim = route[i + 1];
			truncate = "arrowhead";
		} else if (i == 1) {
			auto_trim = route[i - 1];
			truncate = "base";
		}
		
		if (jump.split("::")[1].includes("WW")) navhelper_addarrows((i == route.length - 2) ? navhelper_calculateDisplacementDirection(route[i - 1], route[i + 1]) : navhelper_calculateDisplacementDirection(route[i], route[i + 1]), jump, false, auto_trim, "cyan", truncate);
		else window[jump.split("::")[0]].changeBorder(jump.split("::")[1], "cyan", "8px", true);
	}
	window[route[route.length - 1].split("::")[0]].changeBorder(route[route.length - 1].split("::")[1], "lime", "8px", true);
}

function bestRoutes(routes) {
	var lengths = [];
	for (let i = 0; i < routes.length; i++) {
		lengths.push(routes[i].length);
	}
	var cutOff = Math.min(...lengths);
	console.log(cutOff);
	var results = [];
	for (let i = 0; i < routes.length; i++) {
		if (routes[i].length <= cutOff) results.push(routes[i]);
	}
	return results;
}

function allRoutes(startNode, endNode) {
	window.nodes = {};
	window.mapNamespace = "";
	// preprocessing with hallways (because these need to be loaded first) in order to "reverse-logic" hallway connection
	Object.keys(window.mapSet.pvmaps).forEach(function(elem) {
		elem = window.mapSet.pvmaps[elem];
		window.mapNamespace = elem.map_dataset_object.svg_id;
		elem.map_dataset_object.featuredata.forEach(function(elem2) {
			if (elem2.landmark_id.includes("WW") == false) {
				// do nothing, because this is another element that does not to be loaded yet
			} else {
				var attached_to = elem2.attached_to.split(";");
				for (let i = 0; i < attached_to.length; i++) {
					if (attached_to[i] == "") continue;
					if (attached_to[i].includes("::") == false) attached_to[i] = `${window.mapNamespace}::${attached_to[i]}`;
				}
				window.nodes[`${window.mapNamespace}::${elem2.landmark_id}`] = structuredClone(attached_to);
			}
		});
	});
	
	// now we can go ahead with the rest of the elements
	Object.keys(window.mapSet.pvmaps).forEach(function(elem) {
		elem = window.mapSet.pvmaps[elem];
		window.mapNamespace = elem.map_dataset_object.svg_id;
		elem.map_dataset_object.featuredata.forEach(function(elem2) {
			if (false) {
				
			} else {
				var attached_to = elem2.attached_to.split(";");
				for (let i = 0; i < attached_to.length; i++) {
					if (attached_to[i] == "") continue;
					if (attached_to[i].includes("::") == false) attached_to[i] = `${window.mapNamespace}::${attached_to[i]}`;
				}
				for (let i = 0; i < attached_to.length; i++) {
					// Because each WW element doesn't store a list of every room you can access from that hallway, we have to reverse this 
					// information from the actual room's information
					if (attached_to[i].length > 1) {
						if (attached_to[i].split("::")[1].startsWith("WW")) {
							//console.log("implicit connection WW: " + attached_to[i] + " and " + `${window.mapNamespace}::${elem2.landmark_id}; appending to ${JSON.stringify(window.nodes[attached_to[i]])}`);
							if (!window.nodes[attached_to[i]]) {
								console.log(`${attached_to[i]} isn't a real hallway, will not connect this hallway to this room`);
							}
							window.nodes[attached_to[i]].push(`${window.mapNamespace}::${elem2.landmark_id}`);
						}
					}
				}
				var cur_node = window.nodes[`${window.mapNamespace}::${elem2.landmark_id}`];
				if (cur_node) cur_node.concat(structuredClone(attached_to));
				else window.nodes[`${window.mapNamespace}::${elem2.landmark_id}`] = structuredClone(attached_to);
			}
		});
	});
	
	Object.keys(window.nodes).forEach(function(elem) {
		window.nodes[elem] = [...new Set(window.nodes[elem])];
	});
	
	return graph_findAllRoutes(window.nodes, startNode, endNode);
}

function graph_findAllRoutes(nodes, startId, endId) {
    let routes = []; // To store all possible routes
    let visited = {}; // To keep track of visited nodes during traversal

    // Helper function for DFS traversal
    function dfs(currentId, path) {
        // Mark the current node as visited
        visited[currentId] = true;
        path.push(currentId);

        // If the current node is the destination, add the path to routes
        if (currentId === endId) {
            routes.push([...path]);
        } else {
            // Otherwise, continue DFS on unvisited neighbors
            let neighbors = nodes[currentId];
			if (!nodes[currentId]) {
				console.log(`${currentId} is not a valid place and thus does not have neighbors. Back tracking...`);
			} else {
				for (let neighborId of neighbors) {
					if (!visited[neighborId] && neighborId.length > 1 && window.nodes[neighborId]) {
						dfs(neighborId, path);
					} else if (neighborId.length < 1) {
						//console.log(`${currentId} has encountered an empty neighbor node ID ${neighborId}, ignoring that...`);
					} else if (!window.nodes[neighborId]) {
						//console.log(`${currentId} has encountered an invalid or nonexistent node ID ${neighborId}, ignoring that...`);
					}
				}
			}
        }

        // Backtrack: remove current node from path and mark it unvisited
        path.pop();
        visited[currentId] = false;
		//console.log(`dead end: ${visited}`);
    }

    // Initialize DFS with the start node
    dfs(startId, []);

    return routes;
}

function navhelper_addnode(namespace, nodeID, origin_destination) {
	if (origin_destination == "origin") {
		window.navhelper.origin = `${namespace}::${nodeID}`;
		gebi("navstopA").innerText = window.navhelper.origin
	} else if (origin_destination == "destination") {
		window.navhelper.destination = `${namespace}::${nodeID}`;
		gebi("navstopB").innerText = window.navhelper.destination;
	}

	if (window.navhelper.origin && window.navhelper.destination) {
		gebi("navstatus2").innerHTML = "<b style='color:lime;'>Ready.</b>"	
		gebi("navstart").style.color = 'lightgreen';
		gebi("navstart").style.backgroundColor = '';
	}
	if (window.navhelper.origin && !window.navhelper.destination) {
		gebi("navstatus2").innerHTML = "<b style='color:yellow;'>Waiting for user to select a destination...</b>"	
		gebi("navstart").style.color = 'gray';
		gebi("navstart").style.backgroundColor = '#333';
	}
	if (!window.navhelper.origin && window.navhelper.destination) {
		gebi("navstatus2").innerHTML = "<b style='color:yellow;'>Waiting for user to select an origin...</b>"	
		gebi("navstart").style.color = 'gray';
		gebi("navstart").style.backgroundColor = '#333';
	}
	if (!window.navhelper.origin && !window.navhelper.destination) {
		gebi("navstatus2").innerHTML = "<b style='color:yellow;'>No origin or destination</b>"	
		gebi("navstart").style.color = 'gray';
		gebi("navstart").style.backgroundColor = '#333';
	}
}

function navhelper_clearnodes() {
	gebi("navstatus2").innerHTML = "<b style='color:gray;'>No origin or destination</b>"	
	gebi("navstart").style.color = 'gray';
	gebi("navstart").style.backgroundColor = '#333';
	gebi("navstopA").innerText = "...";
	gebi("navstopB").innerText = "...";
	window.navhelper.origin = null;
	window.navhelper.destination = null;
}

function navhelper_addarrows(target_direction, lineID, direction_neutral = false, auto_trim = false, color = "cyan", measure_from = "arrowhead") {
	var lineDirection = navhelper_determineLineDirection(lineID);
	if (!lineDirection) return null;
	
	if (
	(lineDirection.includes("N") && target_direction.includes("N")) ||
	(lineDirection.includes("S") && target_direction.includes("S")) ||
	(lineDirection.includes("E") && target_direction.includes("E")) ||
	(lineDirection.includes("W") && target_direction.includes("W"))
	) {
		// do nothing, since the path already points the right way
	} else {
		// reverse the path so that it points the other way and aligns with the way we want it go to
		var path = window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).getAttributeNS(null, "d");
		var line_origin = path.split("l")[0].replaceAll("m", "").split(" ");
		var line_destination = [Number(line_origin[0]) + Number(path.split("l")[1].split(" ")[0]), Number(line_origin[1]) + Number(path.split("l")[1].split(" ")[1])];
		var line_vector = [Number(path.split("l")[1].split(" ")[0]), Number(path.split("l")[1].split(" ")[1])];
		var new_cmd = `m${line_destination[0]} ${line_destination[1]}l${line_vector[0] * -1} ${line_vector[1] * -1}`;
		window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).setAttributeNS(null, "d", new_cmd);
		console.log("reversed: "+lineID);
		lineDirection = navhelper_determineLineDirection(lineID);
	}
	
	var newTN = document.createElementNS("http://www.w3.org/2000/svg", "text");
	var newTXP = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
	newTXP.setAttributeNS(null, "href", "#" + window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).id);
	newTXP.setAttributeNS(null, "stroke", color);
	newTXP.setAttributeNS(null, "font-size", "24px");
	newTXP.setAttributeNS(null, "dominant-baseline", "middle");
	
	// account for automatic trim for a room
	var cut = 0;
	if (auto_trim) {
		console.log(`auto trimming to meet ${auto_trim}`)
		if (auto_trim.split("::").length != 2) {
			console.warn(`[core-navhelper][addArrows] Malformed room_trim_to ID ${auto_trim}`);
			return null;
		}
		var trim_to_room = window[auto_trim.split("::")[0]].helper_calculatePathCentroid(auto_trim.split("::")[1]);
		if (!trim_to_room) {
			// if we couldn't look up the center point of the "trim-to" marker, it could also be a line and thus we should get the origin of that line
			var trim_to_room = window[auto_trim.split("::")[0]].helper_calculateLineOrigin(auto_trim.split("::")[1]);
			if (!trim_to_room) {
				// if it wasn't a line OR a polygon, then warn out  
				console.warn(`[core-navhelper][addArrows] No ctrpoint found: ${trim_to_room}`);
				return null;
			}
		}
		console.log(`auto trimming to meet ${trim_to_room}`);
		
		var path = window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).getAttributeNS(null, "d");
		var line_origin = path.split("l")[0].replaceAll("m", "").split(" ");
		var line_destination = [Number(line_origin[0]) + Number(path.split("l")[1].split(" ")[0]), Number(line_origin[1]) + Number(path.split("l")[1].split(" ")[1])];
		if (measure_from == "arrowhead") {
			console.log("cutting off the arrowhead... mode detected: "+lineDirection);
			if (lineDirection == "S") {
				cut = (line_destination[1] - trim_to_room[1]);
			}
			if (lineDirection == "N") {
				cut = trim_to_room[1] - line_destination[1];
			}
			if (lineDirection == "E") {
				cut = line_destination[0] - trim_to_room[0];
			}
			if (lineDirection == "W") {
				cut = trim_to_room[0] - line_destination[0];
			}
			console.log("cut: " + cut);
		} else {
			console.log("cutting off the arrowhead... mode detected: "+lineDirection);
			if (lineDirection == "S") {
				cut = (line_origin[1] - trim_to_room[1]);
			}
			if (lineDirection == "N") {
				cut = trim_to_room[1] - line_origin[1];
			}
			if (lineDirection == "E") {
				cut = line_origin[0] - trim_to_room[0];
			}
			if (lineDirection == "W") {
				cut = trim_to_room[0] - line_origin[0];
			}
			console.log("cut: " + cut);
		}
	}
	
	var repeatNumber = (window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).getTotalLength() - cut) / 20;
	var repeatNumberNoCut = (window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).getTotalLength()) / 20;
	
	newTXP.textContent = "";
	
	if (cut > 0) {
		try {
			if (!direction_neutral) newTXP.textContent += " → ".repeat(repeatNumber - 1);
			else newTXP.textContent += " -- ".repeat(repeatNumber - 1);
		} catch(warn) {
			if (!direction_neutral) newTXP.textContent += " → ".repeat(repeatNumberNoCut - 1);
			else newTXP.textContent += " -- ".repeat(repeatNumberNoCut - 1);
		}
	}
	else if (cut <= 0) {
		if (!direction_neutral) newTXP.textContent += " → ".repeat(repeatNumberNoCut - 1);
		else newTXP.textContent += " -- ".repeat(repeatNumberNoCut - 1);
		newTXP.setAttributeNS(null, "startOffset", cut * -1);
	}
	newTXP.textContent += "";
	newTN.classList.add("navhelper_arrows");
	newTN.appendChild(newTXP);
	window[lineID.split("::")[0]].group_container.appendChild(newTN);
	return newTN;

}

function navhelper_determineLineDirection(id) {
	if (id.split("::").length != 2) {
		console.warn(`[core-navhelper][calculateLineDirection] Malformed ID ${id}`);
		return null;
	}
	var path_data = window[id.split("::")[0]].retrieve_property(id.split("::")[1], "d");
	if (!path_data) {
		console.warn(`[core-navhelper][calculateLineDirection] Unable to lookup path data for object with ID ${id}.`);
		return null;
	}
	var path_data_list = path_data.split("l");
	if (path_data_list.length != 2) {
		console.warn(`[core-navhelper][calculateLineDirection] This is not a line in m...l... format (move pointer and move to a point relative to the pointer location), calculate direction fails.`);
		return null;
	}
	var command = path_data_list[1].split(" ");
	var x_component = Number(command[0]);
	var y_component = Number(command[1]);
	console.log(x_component, y_component);
	
	if (x_component == 0 && y_component > 0) return "S";
	if (x_component == 0 && y_component < 0) return "N";
	if (x_component < 0 && y_component == 0) return "W";
	if (x_component > 0 && y_component == 0) return "E";
	
	if (x_component > 0 && y_component < 0) return "NE";
	if (x_component > 0 && y_component > 0) return "SE";
	if (x_component < 0 && y_component < 0) return "NW";
	if (x_component < 0 && y_component > 0) return "SW";
	
	if (x_component == 0 && y_component == 0) return null;
}

function navhelper_calculateDisplacementDirection(id1, id2) {
	if (id1.split("::").length != 2) {
		console.warn(`[core-navhelper][calculateDisplacementDirection] Malformed ID 1 ${id}`);
		return null;
	}
	var midPoint1 = window[id1.split("::")[0]].helper_calculatePathCentroid(id1.split("::")[1]);
	if (!midPoint1) midPoint1 = window[id1.split("::")[0]].helper_calculateLineMidpoint(id1.split("::")[1]); // if calculatePathCentroid didn't work, the object could be a line instead, so let's get that midpoint before we declare that the path is invalid
	
	if (id1.split("::").length != 2) {
		console.warn(`[core-navhelper][calculateDisplacementDirection] Malformed ID 2 ${id}`);
		return null;
	}
	var midPoint2 = window[id2.split("::")[0]].helper_calculatePathCentroid(id2.split("::")[1]);
	if (!midPoint2) midPoint2 = window[id2.split("::")[0]].helper_calculateLineMidpoint(id2.split("::")[1]);
	
	if (!midPoint1 || !midPoint2) {
		console.warn(`[core-navhelper][calculateDisplacementDirection] Bad midpoint calculations, cannot proceed with calculating displacement on the plane: ${midPoint1} , ${midPoint2}`);
		return null;
	}
	
	var x_component = midPoint2[0] - midPoint1[0]; 
	var y_component = midPoint2[1] - midPoint1[1]; 
	
	if (Math.abs(x_component) < 25) x_component = 0; // if magnitude of displacement X or displacement Y between two objects is within 25px, we can just call them in line and not say that there's any displaceent on that axis
	if (Math.abs(y_component) < 25) y_component = 0;
	
	if (x_component == 0 && y_component > 0) return "S";
	if (x_component == 0 && y_component < 0) return "N";
	if (x_component < 0 && y_component == 0) return "W";
	if (x_component > 0 && y_component == 0) return "E";
	
	if (x_component > 0 && y_component < 0) return "NE";
	if (x_component > 0 && y_component > 0) return "SE";
	if (x_component < 0 && y_component < 0) return "NW";
	if (x_component < 0 && y_component > 0) return "SW";
	
	if (x_component == 0 && y_component == 0) return null;
	
}