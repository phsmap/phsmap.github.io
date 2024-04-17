function gebi(id) {
  return document.getElementById(id);
}

function clientType() {
	return gebi("client_type").innerHTML;
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

// just a helper for the below fn
function multiBlockFileToObject(inputString) {
    const object = {};
    inputStringDivided = inputString.split("====");
	for (let i = 1; i < inputStringDivided.length; i += 2) {
		object[ inputStringDivided[i] ] = inputStringDivided[i + 1];
	}
	
	return object
}




// in this case, ever since we implemented the authentication system and our backend, we are 
// going to have to change the httpGET function
// it has to send the authentication header, report any auth errors to the user 
// and redirect if it believes that a token reissue could fix the problem
// (also, this function can also serve as a "cache" because of its role in abstraction: 
// it can make one request, get one file that has all the data in it, and then when someone asks for it,
// serve up a piece of that file instead of making a whole ass other request 

// (type is the XMLHTTP type to interpret the results of the response as. 
// this way, we can load image data via authHTTPGET() )
// **** type must be one of the strings listed out in this specification: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseType
function authorized_httpGET(resource, callback, type = 'text') {
	if (window.localStorage.getItem("acstoken") == undefined) {
		//alert("A sign in is required to access map and other facility data. Press OK to go sign in.");
		document.location = "/auth2.0/?redirectonsuccess=/front/viewer_desktop.html";
	}
	
	if (window.authorized_httpGET_datacache[resource]) {
		// if, in the list of previously loaded resources, this resource was found
		console.log(`[authorized_httpGET] resource ${resource} was cached in a previous request, using that data`);
		callback(window.authorized_httpGET_datacache[resource]);
	} else {
		// if we actually need to load in this resource
		var xhr = new XMLHttpRequest();
		if (resource.split("/").length == 2) {
			resourceTC = resource.split("/")[0];
			// if you load all_data.txt/floor1.json, you're asking to load the floor1.json subsection out of all_data.txt; but you still need that whole 
			// all_data.txt block - so that's why we retrieve that from the server AND NOT floor1.json
			// we have this "one file holds many" function because we want to save on the amount of AJAX calls we have to make 
		} else {
			// do nothing, leave the desired filename that we send to the server uncharnged
			resourceTC = resource
		}
		// if you want a different instance of the backend / resource server, change the URL here
		xhr.open("GET", "https://pvmappertest.pythonanywhere.com/resource?file=" + resourceTC, true);
		console.log(`[authorized_httpGET] resource ${resource} was not cached, going out to get it`);
		xhr.setRequestHeader("Authorization", `Bearer ${window.localStorage.getItem("acstoken")}`);
		xhr.responseType = type;
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status == 200) {
					console.log(`[authorized_httpGET] http request OK, parsing as ${type}...`);
					// if we get a successful response, that's our time to parse the data and put it into the authorized_httpGET cache
					if (type == "text" || type == "") {
						// if this is a multi-file block (a text file delineated by ====), load multiple files into the cache
						if (resource.split("/").length == 2) {
							console.log(`[authorized_httpGET] unloading multiple files from this multi-block text response...`)
							objs = multiBlockFileToObject(xhr.responseText);
							for (key of Object.keys(objs)) {
								console.log(`    + loaded ${key}`)
								window.authorized_httpGET_datacache[resource.split("/")[0] + "/" + key] = objs[key];
							}
							console.log(objs);
							callback(window.authorized_httpGET_datacache[resource]);
						}
						// else, just load the whole file into the cache with the resource name
						else {
							console.log(`[authorized httpGET] one text response received`)
							window.authorized_httpGET_datacache[resource] = xhr.responseText;
							callback(window.authorized_httpGET_datacache[resource]);
						}
					} else {
						console.log(xhr.response);
						callback(xhr.response); //send it along without doing any processing like we had to do for text data - the callback should know what to do
					}
				} else if (xhr.status == 401) {
					//alert("Your sign in was expired, invalid or missing. Press OK to go sign in.");
					document.location = "/auth2.0/?redirectonsuccess=/front/viewer_desktop.html";
				} else {
					console.log(xhr.responseText);
					alert("There was an error in retrieving data from the secure resource server. Please see the development console for more information.");
				}
			}
		}
		xhr.send();
	}
}

// this is the normal HTTP GET function that we're keeping around just in case we need it 
function httpGET(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    };
    xhr.send();
}

function changeVis(list_of_ids, vis, array = window.objects, raf = true) {
  for (let i = 0; i < list_of_ids.length; i += 1) {
    console.log(list_of_ids[i]);
    //console.log(objectLookup(list_of_ids[i], true, true, array));
    if (vis) array[objectLookup(list_of_ids[i], true, true, array)].visible = true;
    else array[objectLookup(list_of_ids[i], true, true, array)].visible = false;
  }
  if (raf) renderAllFeatures();
}

function changeVisOnAllObjects(vis, array = window.objects, raf = true) {
  for (let i = 0; i < array.length; i += 1) {
    array[i].visible = vis;
  }
  if (raf) renderAllFeatures();
}

function focusOnPoint(ptx, pty) {
		ptx -= 0.1;
		pty -= 0.1;
		if (clientType() == 'desktop') {
			mx = Math.max( document.body.scrollWidth, document.body.offsetWidth, 
					   document.documentElement.clientWidth, document.documentElement.scrollWidth, document.documentElement.offsetWidth );
			my = Math.max( document.body.scrollHeight, document.body.offsetHeight, 
					   document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );
			x = Math.round(ptx * mx);
			y = Math.round(pty * my);
			console.log(`[focusonpt] Focusing on ${ptx}, ${pty}: actual pages coords ${x}, ${y}`);
			document.documentElement.scrollLeft = x;
			document.body.scrollLeft = x;
			document.documentElement.scrollTop = y;
			document.body.scrollTop = y;
		} else {
			resetViewport();
			gebi("find").hidden = true; // so that way the user can see if the point ends up being behind the massive search modal 
		}
		ptx += 0.1;
		pty += 0.1;
		window.ctx.strokeStyle = 'red';
		window.ctx.beginPath();
		console.log(ptx * window.canvas.width, pty * window.canvas.height);
		console.log(ptx, pty);
		window.ctx.arc(ptx * window.canvas.width, pty * window.canvas.height, 35, 0, 2 * Math.PI);
		window.ctx.stroke();
}

function viewData(obj, distance) {
  /* data should look something like this: [
    ["key1", "value1"],
    ["key2", "value2"],
  ] */
  // in this case, the points can hold data, but in order for it to be shown 
  // it needs to have the public (*) modifier (so the key would be *gender_netrual, for instance)
  attributes = [];
  for (let i = 0; i < obj.data.length; i += 1) {
    if (obj.data[i][0].startsWith("*")) {
      // very basic XSS prevention by disabling all HTML tags 
      attributes.push( [obj.data[i][0].slice(1).replaceAll('<', ''), obj.data[i][1].replaceAll('<', '')]);
    }
  }
  gebi("data_overlay").hidden = false;
  if (clientType() == "desktop") {
	  content = "<table class='data_overlay_table'>";
	  for (let i = 0; i < attributes.length; i += 1) {
		content += `
		<tr>
		  <td>${attributes[i][0].replace("<", "")}</td><td>&ensp;&ensp;${attributes[i][1].replace("<", "")}</td>
		</tr>
		`;
	  }
	  content += '</table>';
	  gebi("data_overlay_table").innerHTML = content;
	  gebi("data_overlay_title").innerText = obj.id.replaceAll("<", "");
  } else {
	  content = "<br><br>";
	  for (let i = 0; i < attributes.length; i += 1) {
		content += `<u><b style='font-size: 1.5cm; border: 5px solid white; padding: 3px;'>${attributes[i][0].replace("<", "")}:</b></u>&ensp;&ensp;<p style='font-size: 1.25cm'>${attributes[i][1].replace("<", "")}</p><br>`;
	  }
	  gebi("data_overlay_table").innerHTML = content;
	  gebi("data_overlay_title").innerText = obj.id.replaceAll("<", "");
  }
}

function handleClickOnCanvas(obj, distance) {
  // By default, the action to take when users select a point is to open
  // up the data viewer

  // But for instance if the user is routing between two points, the routing menu
  // can temporarily change the contents of this function so it can extract selection data instead
  viewData(obj, distance);
}

function applyCheckboxPreferences() {
  // this function will take all hide/show checkboxes (even the ones that don't correspond to the currently active map)
  // and hide/show nodes as commanded by the user
  // also - even though floor1 and floor2 have basically the same sets of checkboxes, we still apply their respectiev check box sets separately
  // (so if a person has all offices hidden away on the second floor but shown on the first floor, we want that distiction to be maintained)
  for (let map = 0; map < window.all.mapNames.length; map += 1) {
    changeVisOnAllObjects(false, window.all[window.all.mapNames[map]].objects, false);
    console.log("[applyCBpreferences] checking checkbox preferences for: " + window.all.mapNames[map]);
    for (let checkboxitem = 0; checkboxitem < window.all[window.all.mapNames[map]].checkboxes.length; checkboxitem += 1) {
      checkBoxStruct = window.all[window.all.mapNames[map]].checkboxes[checkboxitem];
      if (checkBoxStruct.length > 2) {
        changeVis(queryObjects([ [checkBoxStruct[1], checkBoxStruct[2], checkBoxStruct[3]] ], window.all[window.all.mapNames[map]].objects), gebi(`view.showhide.${window.all.mapNames[map]}.${checkBoxStruct[3]}`).checked, window.all[window.all.mapNames[map]].objects, false);
      }
    }
  }

  // now that we have correctly set the visibility flag of all objects, we can reload the current map
  renderAllFeatures();
  loadMap(window.all.currentMap, false);

}

function loadMap(mapName, copy_current_state_to_pool = true, restore_users_scroll_pos = true) {
  console.log("[loadMap] Sending " + mapName + " from the pool to the active sector:");
  // this will preserve the hidden/shown statuses of each of the points and hide the current checkbox set
  // (we make it an option to turn it off so that way it is still possible to overwrite the on screen mapdata with the pooled data, such as if you modify the pooled data and you want to push those changes up instead of overwriting them when it tries to save the current state)
  if (window.objects.length > 2 && copy_current_state_to_pool && window.all.currentMap) {
    window.all[window.all.currentMap].objects = structuredClone(window.objects);
  }
  
  // in case there's some weird error, we want to hide all the checkboxes first
  for (let i = 0; i < window.all.mapNames.length; i += 1) {
	gebi(`view_checkboxes_${window.all.mapNames[i]}`).hidden = true; 
  }
  
  // before we load the next map, we need to save the current map's scroll
  if (clientType() == "desktop" && window.all.currentMap) {
	window.all[window.all.currentMap].scrolls = [document.documentElement.scrollLeft|| document.body.scrollLeft, document.documentElement.scrollTop || document.body.scrollTop];
  }

  // now, we put in the new map and render all features
  window.all.currentMap = mapName;
  window.objects = structuredClone(window.all[mapName].objects);
  gebi(`view_checkboxes_${mapName}`).hidden = false;
  if (restore_users_scroll_pos) {
	  loadCanvas("map", window.all[mapName].img, true, function() {
		// if the map was previously scrolled somewhere, restore that scroll
		if (clientType() == "desktop" && window.all[mapName].scrolls) {
			document.documentElement.scrollLeft = window.all[mapName].scrolls[0];
			document.body.scrollLeft = window.all[mapName].scrolls[0];
			document.documentElement.scrollTop = window.all[mapName].scrolls[1];
			document.body.scrollTop = window.all[mapName].scrolls[1];
	  }
	  });
  } else {
	console.log("[loadMap] suppressing user position restore...")
	loadCanvas("map", window.all[mapName].img, true);
  }

}


function startUp(evt = null) {  
 // So that the listeners at the bottom don't instantly error out
  loadCanvas("map", "/img/missing.png", false);
  
  // open the first time user thing, if applicable
  if (getCookie("hasSeenFTUModal") == "" || !getCookie("hasSeenFTUModal")) {
	  gebi("first_time_user").hidden = false;
  }
  
  // Get list of all map/data sets that we need to load
  window.all = {};
  window.objects = [];
  window.authorized_httpGET_datacache = {};
  authorized_httpGET("all_map_data.txt/allmap.json", function(responseText) {
      allMaps = JSON.parse(responseText.replaceAll("<", ""));
	  console.log("[startUp] The following maps will be loaded: ");
      window.all.mapNames = allMaps.filter((_, index) => index % 2 !== 1); 
	  console.log(window.all.mapNames);
	  
	  // this counter is important: once we have loaded all the maps (as indicated by this counter being equal to allMaps.length),
	  // that's our cue to call applyCheckboxPreferences() (because those require all maps to be loaded to work)
	  var loaded = 0;
	  
      for (let i = 0; i < allMaps.length; i += 2) {
		// initialize its window.all subobject
        window.all[allMaps[i]] = {};
        window.all[allMaps[i]].checkboxes = [];
        window.all[allMaps[i]].objects = [];
		// set up its scrolling
		if (clientType() == "desktop") {
			window.all[allMaps[i]].scrolls = [0, 0];
		}
		// load in the rest of the data
        authorized_httpGET(`all_map_data.txt/${allMaps[i]}_checkbox_options.json`, function(rt) {
          window.all[allMaps[i]].checkboxes = JSON.parse(rt.replaceAll("<", ""));
          // add the checkbox set to the div view_checkboxes
          gebi("view_checkboxes").innerHTML += `<div id='view_checkboxes_${allMaps[i]}'></div>`
          for (let j = 0; j < window.all[allMaps[i]].checkboxes.length; j += 1) {
            element = window.all[allMaps[i]].checkboxes[j];
            if (element.length == 1) {
              if (clientType() == "desktop") gebi(`view_checkboxes_${allMaps[i]}`).innerHTML += `<hr><b style='color:gold;'>${element[0]}</b>&ensp;`;
			  else if (clientType() == "mobile") gebi(`view_checkboxes_${allMaps[i]}`).innerHTML += `<hr><b style='color:gold;'>${element[0]}</b><br>`;
            } else if (element.length == 5) {
              if (element[4]) checked = 'checked';
              else checked = '';
			  if (clientType() == "desktop") gebi(`view_checkboxes_${allMaps[i]}`).innerHTML += `(${element[0]} <input type='checkbox' id='view.showhide.${allMaps[i]}.${element[3]}' ${checked}>) &nbsp;`;
			  else if (clientType() == "mobile") gebi(`view_checkboxes_${allMaps[i]}`).innerHTML += `${element[0]} <input type='checkbox' id='view.showhide.${allMaps[i]}.${element[3]}' ${checked}> <br>`;
            }
          }
          // we have to make the requests in order because for some reason if they load the other way around you get the race condition
          authorized_httpGET(`all_map_data.txt/${allMaps[i]}.json`, function(rt) {
            window.all[allMaps[i]].objects = JSON.parse(rt.replaceAll("<", ""));
            gebi("maps_buttons").innerHTML += `<button class='topnav_button' id='maps.switch.${allMaps[i]}' onclick='loadMap("${allMaps[i]}")'>${allMaps[i]}</button>&ensp;&ensp;`;
			authorized_httpGET(`${allMaps[i + 1]}`, function(returnblob) {
				window.all[allMaps[i]].img = URL.createObjectURL(returnblob);
				// this is the end of the loading sequence for one map, so we can add one to the counter
				loaded += 1;
				console.log(`[startUp] ${loaded}/${allMaps.length / 2} maps loaded`);
				
				// if this was the last map to be loaded, we know that all the other maps have been loaded, so 
				// we can start working to present to the user
				if (loaded == allMaps.length / 2) {
					console.log(`[startUp] all maps loaded, modifying visibility data + presenting this information:`);
					console.log(window.all);
					loadMap("floor1", false);  // you have to set window.all.currentMap first, which means we have to call loadMap for the first time before we're allowed to applyCBpreferences
					applyCheckboxPreferences();
					
					// now, on top of applying checkbox preferences, we do also want to see if the user has a font and thickness preference saved
					if (getCookie("thickPreference") != "") {
						// do nothing, because the user alr has it set and we don't want to interfere with their preference
						console.log(`[startUp] User already has font preference set to ${getCookie("thickPreference")}`)
					} else {
						if (clientType() == "desktop") {
							console.log(`[startUp] Setting default thickness to 8 [px]`);
							setCookie("thickPreference", "8");
						} else {
							console.log(`[startUp] Setting default thickness to 7 [px]`);
							setCookie("thickPreference", "7");
						}
					}
					gebi("preferences_points_thicc").value = getCookie("thickPreference")
					window.all.mapNames.map(function(e,a,c){window.all[c[a]].objects.map(function(e,a,c){c[a].thickness&&0==c[a].type&&(c[a].thickness=getCookie("thickPreference"))})}),loadMap(window.all.currentMap,!1);
					if (getCookie("fontPreference") != "") {
						// do nothing, because the user alr has it set and we don't want to interfere with their preference
						console.log(`[startUp] User already has font preference set to ${getCookie("fontPreference")}`)
					} else {
						if (clientType() == "desktop") {
							console.log(`[startUp] Setting default font to 4mm Arial`)
							setCookie("fontPreference", "4mm Arial");
						} else {
							console.log(`[startUp] Setting default font to 3.75mm Arial`)
							setCookie("fontPreference", "3.75mm Arial");
						}
					}
					gebi("preferences_font_size").value = getCookie("fontPreference");
					window.all.mapNames.map(function(e,a,c){window.all[c[a]].objects.map(function(e,a,c){c[a].font&&2==c[a].type&&(c[a].font=getCookie("fontPreference"))})}),loadMap(window.all.currentMap,!1);
				}
			}, 'blob');
		  });
        });
      }
  });
  
  // Mobile listener for when users select points on the map
  window.lastTap = -1;
  window.positionOfCanvasAtLastTap = [-1, -1];
  window.doubleTapLimits = [100, 500];
  window.canvas.addEventListener("touchstart", function(event) {
    // first, we need to see if the current tap took place within the limits of the double tap
    currentTap = new Date().getTime();
    dX_canvas = Math.abs(window.positionOfCanvasAtLastTap[0] - parseFloat(gebi("map").style.left));
    dY_canvas = Math.abs(window.positionOfCanvasAtLastTap[1] - parseFloat(gebi("map").style.top));
    if (dX_canvas < 5 && dY_canvas < 5 && (currentTap - window.lastTap) < window.doubleTapLimits[1] && (currentTap - window.lastTap) > window.doubleTapLimits[0]) {
      window.lastTap = new Date().getTime();
      window.positionOfCanvasAtLastTap = [parseFloat(gebi("map").style.left), parseFloat(gebi("map").style.top)];
      // basiocally do nothing, because we want the double click handler to go through
    } else {
      window.lastTap = new Date().getTime();
      window.positionOfCanvasAtLastTap = [parseFloat(gebi("map").style.left), parseFloat(gebi("map").style.top)];
      return null;
      // block the action from continuing because the user didn't double click (either zoomed or dragged quickly)
    }

    // now that we have checked that the interaction was a dbl tap, send the objec that the user selected to the handler
    const {x, y, width, height} = event.target.getBoundingClientRect();
    const offsetX = (event.touches[0].clientX-x)/width*event.target.offsetWidth;
    const offsetY = (event.touches[0].clientY-y)/height*event.target.offsetHeight;
      minDistance = null;
      objectAtMinDistance = null;
	  filteredObjects = window.objects.filter(obj => obj.visible === true);
      for (let i = 0; i < filteredObjects.length; i += 1) {
        obj = window.filteredObjects[i];
        // in this case, we don't want all objects to be selectable; instead; we only wants to be selectable
        if (obj.type == 0) {
          distance = Math.sqrt(((offsetX - (obj.xcoord * window.canvas.width)) ** 2) + ((offsetY - (obj.ycoord * window.canvas.height)) ** 2));
          if (minDistance == null || distance < minDistance) {
            minDistance = distance;
            objectAtMinDistance = obj;
          }
        }
      }
      // with actually finding the selected object out of the way, we can go ahead and handle the event
      handleClickOnCanvas(objectAtMinDistance, minDistance);
  }
);

  // Desktop equivalent
  window.canvas.addEventListener("dblclick", function(event) {
    offsetX = event.offsetX;
    offsetY = event.offsetY;
    minDistance = null;
    objectAtMinDistance = null;
	filteredObjects = window.objects.filter(obj => obj.visible === true);
    for (let i = 0; i < filteredObjects.length; i += 1) {
      obj = filteredObjects[i];
      // in this case, we don't want all objects to be selectable; instead; we only wants to be selectable
      if (obj.type == 0) {
        distance = Math.sqrt(((offsetX - (obj.xcoord * window.canvas.width)) ** 2) + ((offsetY - (obj.ycoord * window.canvas.height)) ** 2));
        if (minDistance == null || distance < minDistance) {
          minDistance = distance;
          objectAtMinDistance = obj;
        }
      }
    }
    // with actually finding the selected object out of the way, we can go ahead and handle the event
    handleClickOnCanvas(objectAtMinDistance, minDistance);
  });
}

window.addEventListener("load", startUp);

