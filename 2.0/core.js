"use strict";


function gebi(id) {
    return document.getElementById(id);
}

function deviceType() {
    return gebi("devicetype").innerText;
}

// thank you to https://www.w3schools.com/js/js_cookies.asp
// for the cookie get/set code
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
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

function startUpListeners() {
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
            var dX = window.mousemove_sens * (beganClickingX - evt.clientX) * (1 / 1);
            var dY = window.mousemove_sens * (beganClickingY - evt.clientY) * (1 / 1);
            //console.log(`dX, dY = ${dX}, ${dY}`);
            zoomableDiv.style.left = (Number(zoomableDiv.style.left.slice(0, -2)) + dX) + "px";
            zoomableDiv.style.top = (Number(zoomableDiv.style.top.slice(0, -2)) + dY) + "px";
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
    }, {
        passive: false
    });



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
    if (deviceType() == "desktop") {
        gebi("zoomableDiv").style.left = `${obj.desktop_default_x}px`;
        gebi("zoomableDiv").style.top = `${obj.desktop_default_y}px`;
        gebi("zoomableDiv").style.transform = `scale(${obj.desktop_default_zoom})`;
    } else {
        gebi("zoomableDiv").style.left = `${obj.mobile_default_x}px`;
        gebi("zoomableDiv").style.top = `${obj.mobile_default_y}px`;
        gebi("zoomableDiv").style.transform = `scale(${obj.mobile_default_zoom})`;
    }
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

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function illuminateNeighbors(id) {
    window.rcolor = getRandomColor();

    var objectInReference = window.mapSet.activeMap.map_dataset_object.lookupFeatureObject(id);
    window.mapSet.activeMap.map_dataset_object.changeBorder(id, window.rcolor, "8px", false);
    var neighbors = objectInReference.attached_to.split(";");
    neighbors.forEach(function(elem) {
        if (!elem.includes("::")) window.mapSet.activeMap.map_dataset_object.changeBorder(elem, window.rcolor, "8px", false);
    })
}

function populateLookupMenu(id) {
    var keys = Object.keys(window.advances);
    for (let i = 0; i < keys.length; i++) {
        console.log(key, id);
        var key = keys[i]
        if (key.split("::")[1] == id && key.split("::")[0] == window.mapSet.activeMap.map_dataset_object.svg_id) {
            window.mapSet.stowAway(window.mapSet.activeMap.map_dataset_object.svg_id, Number(gebi('zoomableDiv').style.left.replaceAll('px', '')), Number(gebi('zoomableDiv').style.top.replaceAll('px', '')), Number(gebi('zoomableDiv').style.transform.replaceAll('scale(', '').replaceAll(')', '')));
            window.mapSet.makeActive(window.advances[key].split("::")[0]);
            document.getElementById("map_select").value = window.mapSet.activeMap.map_dataset_object.svg_id;
            return null;
        }
    }

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
    document.getElementById("dbg_copy").setAttribute("landmarkid", `${id}`);
    document.getElementById("dbg_illuminate").setAttribute("landmarkid", `${id}`);

    var table_element = document.getElementById("lookup_table");
    var keys = Object.keys(objectInReference);
    for (let i = 0; i < keys.length; i++) {
        if (objectInReference[keys[i]] && objectInReference[keys[i]] != "" && ["landmark_id", "search_terms", "physical_location", "attached_to"].includes(keys[i]) == false) {
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
            } else if (objectInReference.official_room_number) tc = `Rm ${objectInReference.official_room_number} (${map_area})`;
            else tc = `${objectInReference.type}: ${objectInReference.landmark_id}`;

            document.getElementById("lookup_informal_name").textContent = `${tc}`;
        }
    }
}

function handleKeyDownQuery(ev) {
    if (ev.key == "Enter") searchAndResolve(ev.target.value);
}

function searchAndResolve(search_term, containing_body = "resolution_options", special_class_name = 'srt_clearable', callback = null) {
    if (!search_term) {
        alert("Search term cannot be empty!");
        return null;
    }
    var results = window.mapSet.searchAllMaps(search_term);
    console.log(results);
    var pBody = document.getElementById(containing_body);
    var keys = Object.keys(results);

    //document.querySelectorAll('.resolution_tr').forEach(e => e.remove());

    var hits = 0

    for (let i = 0; i < keys.length; i++) {
        for (let j = 0; j < results[keys[i]].length; j++) {
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
            } else if (room_number) tc = `Rm ${room_number} (${map_area})`;
            else tc = `(obj: ${landmark_type} ${landmark_id}) (${map_area})`;
            if (deviceType() == "mobile") {
                tc = `> ${tc}`;
            }

            var newA = document.createElement('a');
            newA.textContent = tc;
            newA.classList.add("noselect");
            newA.classList.add("search");
            newA.classList.add(special_class_name);
            newA.setAttribute("under_map", map_area)
            newA.setAttribute("on_id", landmark_id)
            newA.style.color = "gold";
            if (typeof callback === "function") {
                newA.onclick = callback;
            } else {
                newA.onclick = function(evt) {
                    window.mapSet.stowAway(window.mapSet.activeMap.map_dataset_object.svg_id, Number(gebi('zoomableDiv').style.left.replaceAll('px', '')), Number(gebi('zoomableDiv').style.top.replaceAll('px', '')), Number(gebi('zoomableDiv').style.transform.replaceAll('scale(', '').replaceAll(')', '')));
                    window.mapSet.makeActive(evt.target.getAttribute("under_map"));
                    resetViewport();
                    window.mapSet.pvmaps[evt.target.getAttribute("under_map")].map_dataset_object.flashBorder(evt.target.getAttribute("on_id"), "#FFFF00FF;#999999FF", "15px", "0.8s", true);
                    document.getElementById("map_select").value = evt.target.getAttribute("under_map");
                    if (deviceType() == "mobile") {
                        document.getElementById("mainmenu").style.display = "none";
                    }
                }
            }
            var newbr = document.createElement("br");
            newbr.classList.add(special_class_name);
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
    window.advances = {};

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
        if (window.localStorage.getItem("acstoken").startsWith("visitor")) {
            gebi("tkn_issuer").textContent = "Visitor Token";
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

        console.error = function(content) {
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
            map.double_click_callback = function(evt) {
                populateLookupMenu(evt.target.id)
            };
            map.svg_element_id = onboard_svg_id;
            map.autogenerate_layer_checkboxes_under_element = "feature_checkboxes";

            var m1 = new PVMap(map, layer_data, feature_data);
            if (deviceType() == "desktop") window.mapSet.addPVMap(m1, m1.desktop_default_x, m1.desktop_default_y, m1.desktop_default_zoom);
            else window.mapSet.addPVMap(m1, m1.mobile_default_x, m1.mobile_default_y, m1.mobile_default_zoom);
            var newOption = document.createElement("option");
            newOption.value = map.svg_element_id;
            newOption.textContent = map.map_screen_name;
            document.getElementById("map_select").appendChild(newOption);
        });
        resetViewport();
        startUpListeners();
        // apparently re-rendering the map fixes text rendering issues that affect iOS spesifically
        if (window.mapSet && window.mapSet.activeMap) {
            var rt = window.mapSet.activeMap.map_dataset_object.svg_id;
            window.mapSet.stowAway(rt);
            setTimeout(function() {
                window.mapSet.makeActive(rt)
            }, 100)
        }
        console.log("[window.onload] Reloaded...")
    }, "text");
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
    console.log(`[core-navhelper][dispRoute] route: ${JSON.stringify(route)}`);
    window[route[0].split("::")[0]].changeBorder(route[0].split("::")[1], "lime", "8px", true);
    var rt = window.mapSet.activeMap.map_dataset_object.svg_id;
    window.mapSet.stowAway(rt);
    window.mapSet.makeActive(route[0].split("::")[0]);
    resetViewport();


    if (route.join().includes("::SW-")) {
        alert("This route requires changing floors. To switch the map to the other floor, double tap the flashing red staircase or use the map switcher at the bottom right.");
    }
    window.advances = {};

    for (let i = 1; i < route.length - 1; i++) {
        var jump = route[i];
        console.log("[core-navhelper][dispRoute]", route[i], route[i + 1], navhelper_calculateDisplacementDirection(route[i], route[i + 1]));

        var auto_trim = false;
        var truncate = "";
        if (i == route.length - 2) {
            auto_trim = route[i + 1];
            truncate = "arrowhead";
        } else if (i == 1) {
            auto_trim = route[i - 1];
            truncate = "base";
        }

        if (jump.split("::")[1].includes("WW-")) navhelper_addarrows((i == route.length - 2) ? navhelper_calculateDisplacementDirection(route[i - 1], route[i + 1]) : navhelper_calculateDisplacementDirection(route[i], route[i + 1]), jump, false, auto_trim, "cyan", truncate);
        else {
            if (jump.split("::")[1].includes("SW-")) {
                window[jump.split("::")[0]].changeBorder(jump.split("::")[1], "cyan", "8px", true);
                window[jump.split("::")[0]].flashBorder(jump.split("::")[1], "red;cyan", "8px", "0.9", true);

                window.advances[jump] = route[i + 1];

                // we don't have to set a custom callback here because the code for switching over to another map when you double tap a blinking red 
                // is in populateLookupMenu, the default callback fn
            } else {
                window[jump.split("::")[0]].changeBorder(jump.split("::")[1], "cyan", "8px", true);
            }
        }
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
    window.navorigin = startNode;
    window.destiny = endNode;
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
                // This used to do something but now it doesn't, so we're keeping i
            } else {
                // If this isn't a navigation pathway (door, elevator, stairway, big chamber, or hallway), simply do not add it to the graph
                if (
                    (
                        elem2.landmark_id.includes("WW") == false &&
                        elem2.landmark_id.includes("LV") == false &&
                        elem2.landmark_id.includes("EE") == false &&
                        elem2.landmark_id.includes("SW") == false &&
                        elem2.landmark_id.includes("LM") == false &&
                        window.navorigin.includes(elem2.landmark_id) == false &&
                        window.destiny.includes(elem2.landmark_id) == false
                    )
                ) {
                    // SKip
                    //console.log("skip")
                } else {
                    // Go ahead, this is one we want to add to the graph
                    //console.log(elem2.landmark_id);
                    var attached_to = elem2.attached_to.split(";");
                    for (let i = 0; i < attached_to.length; i++) {
                        if (attached_to[i] == "") continue;
                        if (attached_to[i].includes("::") == false) attached_to[i] = `${window.mapNamespace}::${attached_to[i]}`;
                    }
                    for (let i = 0; i < attached_to.length; i++) {
                        // Because each WW element doesn't store a list of every room you can access from that hallway, we have to reverse this 
                        // information from the actual room's information
                        if (attached_to[i].length > 1) {
                            // in actuality, we don't want to reverse-connect every room to its hallway, we realisitically only need to 
                            // attach stairways, exits and the destination/origin
                            if (
                                (elem2.landmark_id.startsWith("EE") || elem2.landmark_id.startsWith("SW") || elem2.landmark_id.startsWith("LV") ||
                                    window.destiny.split("::")[1].includes(elem2.landmark_id)) &&
                                attached_to[i].split("::")[1].startsWith("WW")
                            ) {
                                if (!window.nodes[attached_to[i]]) {
                                    console.log(`${attached_to[i]} isn't a real hallway, will not connect this hallway to this room`);
                                }

                                window.nodes[attached_to[i]].push(`${window.mapNamespace}::${elem2.landmark_id}`);
                                console.log("implicit connection WW: " + attached_to[i] + " and " + `${window.mapNamespace}::${elem2.landmark_id}; appending to ${JSON.stringify(window.nodes[attached_to[i]])}`);

                            }
                        }
                    }
                    var cur_node = window.nodes[`${window.mapNamespace}::${elem2.landmark_id}`];
                    if (cur_node) cur_node.concat(structuredClone(attached_to));
                    else window.nodes[`${window.mapNamespace}::${elem2.landmark_id}`] = structuredClone(attached_to);
                }
            }
        });
    });

    Object.keys(window.nodes).forEach(function(elem) {
        window.nodes[elem] = [...new Set(window.nodes[elem])];
    });

    return graph_findAllRoutes(window.nodes, startNode, endNode);
}

function graph_findAllRoutes(nodes, startId, endId) {
    window.paths = [];
    window.path = [];
    window.originating = startId;
    window.terminating = endId;
    window.stairs_traversed = 0;

    function checkPaths(nodeID) {
        //window.paths.push(structuredClone(window.path));
        if (!window.nodes[nodeID]) {
            //console.warn(`[findAllRoutes] ${nodeID} isn't a real place, doesn't have any neighbors, will not investigate further`);
            return false;
        }

        window.path.push(nodeID);

        // If this one is the destination, record the current path in window.paths
        if (nodeID == window.terminating && window.path.join().includes("::-LV") == false) {
            window.paths.push(structuredClone(window.path));
            //console.log(window.paths);
            return true;
        }

        if (nodeID.includes("::SW-") || nodeID.includes("::LV-")) window.stairs_traversed += 1;

        for (let i = 0; i < window.nodes[nodeID].length; i++) {
            var neighbor = window.nodes[nodeID][i];
            if (neighbor == window.terminating && window.path.join().includes("::-LV") == false) {
                window.paths.push(structuredClone(window.path).concat([neighbor]));
                window.path.pop();
                return true;
            }
            // If the next one down is not the destination, and we haven't been here before, check to see what's attached to the neighbor
            if (window.path.includes(neighbor) == false && window.stairs_traversed <= 2) {
                checkPaths(neighbor);
            }
        }
        //console.log(`dead end: ${window.path}`);
        window.path.pop();
        if (nodeID.includes("::SW-") || nodeID.includes("::LV-")) window.stairs_traversed -= 1;
    }
    checkPaths(startId);
    return window.paths;
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
        /* if (confirm("An origin and destination have been set! Do you want to start Nav Helper?")) {
        	navhelper_navstart();
        } */
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
    window.advances = {};
}

function navhelper_navstart() {
    var rts = bestRoutes(allRoutes(window.navhelper.origin, window.navhelper.destination, false));
    if (rts.length > 0) {
        displayRoute(rts[0])
    } else {
        eraseRoute();
        alert("No route found! Please note that only classrooms, offices, major landmarks and doors are navigable -- mechanical rooms and certain other features cannot be navigated to using Nav Helper.")
        setTimeout(navhelper_clearnodes, 1000);
    }
}

function navhelper_addarrows(target_direction, lineID, direction_neutral = false, auto_trim = false, color = "cyan", measure_from = "arrowhead") {
    var lineDirection = navhelper_determineLineDirection(lineID);
    console.log("[core-navhelper][addArrows] line prev dir: " + lineDirection)
    if (!lineDirection) return null;

    if (
        ((lineDirection.includes("N") && target_direction.includes("S")) ||
            (lineDirection.includes("S") && target_direction.includes("N")) ||
            (lineDirection.includes("E") && target_direction.includes("W")) ||
            (lineDirection.includes("W") && target_direction.includes("E"))) == false
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
        console.log("reversed: " + lineID);
        lineDirection = navhelper_determineLineDirection(lineID);
        console.log("new dir: " + lineDirection)
    }

    var newTN = document.createElementNS("http://www.w3.org/2000/svg", "text");
    var newTXP = document.createElementNS("http://www.w3.org/2000/svg", "textPath");

    var newHWNode = window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).cloneNode();
    var newID = PVMap.uniqueID();
    newHWNode.id = newID;
    console.log(`[core-navhelper][addArrows] generated alongside element #${newID}`);
    window[lineID.split("::")[0]].group_container.prepend(newHWNode);

    newTXP.setAttributeNS(null, "href", `#${newID}`);
    newTXP.setAttributeNS(null, "stroke", color);
    newTXP.setAttributeNS(null, "font-size", "24px");
    newTXP.setAttributeNS(null, "dominant-baseline", "middle");

    // account for automatic trim for a room
    var cut = 0;
    if (auto_trim) {
        console.log(`[core-navhelper][addArrows] auto trimming to meet ${auto_trim}`)
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
        console.log(`[core-navhelper][addArrows] auto trimming to meet ${trim_to_room}`);

        var path = window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).getAttributeNS(null, "d");
        var line_origin = path.split("l")[0].replaceAll("m", "").split(" ");
        var line_destination = [Number(line_origin[0]) + Number(path.split("l")[1].split(" ")[0]), Number(line_origin[1]) + Number(path.split("l")[1].split(" ")[1])];
        if (measure_from == "arrowhead") {
            console.log("[core-navhelper][addArrows] cutting off the arrowhead... mode detected: " + lineDirection);
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
            console.log("[core-navhelper][addArrows] cut: " + cut);
        } else {
            console.log("[core-navhelper][addArrows] sliding up the base... mode detected: " + lineDirection);
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
            console.log("[core-navhelper][addArrows] cut: " + cut);
        }
    }

    var repeatNumber = (window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).getTotalLength() - cut) / 20;
    var repeatNumberNoCut = (window[lineID.split("::")[0]].retrieve_element_in_this_group(lineID.split("::")[1]).getTotalLength()) / 20;

    newTXP.textContent = "";

    if (cut > 0) {
        try {
            if (!direction_neutral) newTXP.textContent += " → ".repeat(repeatNumber - 1);
            else newTXP.textContent += " -- ".repeat(repeatNumber - 1);
        } catch (warn) {
            if (!direction_neutral) newTXP.textContent += " → ".repeat(repeatNumberNoCut - 1);
            else newTXP.textContent += " -- ".repeat(repeatNumberNoCut - 1);
        }
    } else if (cut <= 0) {
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