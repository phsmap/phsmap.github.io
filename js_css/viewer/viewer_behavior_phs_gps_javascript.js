// some of the fields require the use of fuzzy string matching because people call the landmarks and clases different things 
// thank you to https://stackoverflow.com/questions/23305000/javascript-fuzzy-search-that-makes-sense for the very compact fuzzy string matching function
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function fuzzyMatch(pattern, str) {
  pattern = '.*' + pattern.split('').map(l => `${escapeRegExp(l)}.*`).join('');
  const re = new RegExp(pattern);
  return re.test(str);
}

//SEARCH through this map for the room with this number (i.e. 1627), etc.
function searchFor(keyTerm) { 
    mapsWithMatches = [];
	ids = [];
    for (let i = 0; i < window.all.mapNames.length; i += 1) {
      name = window.all.mapNames[i];
      changeVisOnAllObjects(false, window.all[name].objects);
      if (true) {
        toChange = queryObjects([ ["id", "has", `roomno.${keyTerm}`] ], window.all[name].objects);
        toChange = toChange.concat(queryObjects([ ["id", "has", `roomno.${keyTerm}_tx`] ], window.all[name].objects));
		ids = ids.concat(toChange);
        changeVis(toChange, true, window.all[name].objects);
        if (toChange.length > 0) mapsWithMatches.push(name); // if this map in the pool contained a matching point, record it
      }
    }
    // if we're searching up a room, there's only one room 2001, for instance, so if the 
    // match came up on another map we can just load that map instead of giving the user the option to choose which map to load
    // (in this case we're also overwriting the on screen map array with the one from the pool, since the one in the pool was the one that we were filtering through)
    console.log(window.all);
    if (mapsWithMatches.length > 1) {
		alert(`Error! Multiple subsections have a room ${keyTerm}, which should not be possible.`);
		return null;
	}
    else if (mapsWithMatches.length == 1) {
	  window.tobeFocused = objectLookup(ids[0], true, false, window.all[mapsWithMatches[0]].objects); 
      loadMap(mapsWithMatches[0], false, true); 
     // alert(`Room ${keyTerm} was found in the map for ${mapsWithMatches[0]}! Its location on the map should be shown below.`);
	  setTimeout(function(){focusOnPoint(window.tobeFocused.xcoord, window.tobeFocused.ycoord);}, 500); // because loadMap will just undo our focusOnPoint because image data will come in + it'll realign much later
	  return true;
	} else {
		// do nothing, and move onto the landmark search sectino 
	}
	
	// ONLY IF the room number search didn't work, we can try landmark
	
    listofresults = gebi("find_route_resolve");
    keyTerm = keyTerm.toLowerCase();
    listofresults.innerHTML = '';
	allIds = [];
    for (let i = 0; i < window.all.mapNames.length; i += 1) {
      resultant_ids = [];
      name = window.all.mapNames[i];
        for (let j = 0; j < window.all[name].objects.length; j += 1) {
          object = window.all[name].objects[j];
          if ((object.id.includes("landmark") || object.id.includes("office")) && object.data.length >= 2) {
            // now, we load the attributes from the array form they're stored in to the assosicative array that we want
            attributes = {};
            for (let h = 0; h < window.all[name].objects[j].data.length; h += 1) {
              attributes[window.all[name].objects[j].data[h][0]] = window.all[name].objects[j].data[h][1];
             }
            if (attributes.altnames && (attributes["roomno"] || attributes["*roomno"])) {
              // we have ANOTHER for loop to check the points for the different FSM patterns we could have
              fsmpatterns = attributes.altnames.split(",");
              for (let a = 0; a < fsmpatterns.length; a += 1) {
                if (fuzzyMatch(fsmpatterns[a], keyTerm)) {
                  resultant_ids.push(name + "::" + object.id);
                }
              }
            }
          } else {
            // do nothing, because we don't want to FSM or load attributes on every array element
          }
        }
      resultant_ids = resultant_ids.filter((item,index) => resultant_ids.indexOf(item) === index); // removes duplicates - some of the landmarks have multiple fsm expressoins that can match at the same time, so if a landmark comes up twice, we need to remove the second instance so that the user only sees one button for that choice
      for (let i = 0; i < resultant_ids.length; i += 1) {
		allIds.push(resultant_ids[i].split("::")[1]);
		if (resultant_ids[i].includes("office.") || resultant_ids[i].includes("offices.")) modifier = ` Office (${resultant_ids[i].split("::")[0]})`;
		else modifier = ` (${resultant_ids[i].split("::")[0]})`;
        listofresults.innerHTML += `<button 
		style='border-color: #00FF00; color: #00FF00;' 
		onclick='gebi("find_route_resolve_overlay").hidden = true; changeVisOnAllObjects(false, window.all[this.id.split("///")[1].split("::")[0]].objects); changeVis( [this.id.split("///")[1].split("::")[1], this.id.split("///")[1].split("::")[1] + "_tx"], true, window.all[this.id.split("///")[1].split("::")[0]].objects ); loadMap(this.id.split("///")[1].split("::")[0], false); setTimeout(function(){focusOnPoint(${objectLookup(resultant_ids[i].split("::")[1] + "_tx", true, false, window.all[name].objects).xcoord}, ${objectLookup(resultant_ids[i].split("::")[1] + "_tx", true, false, window.all[name].objects).ycoord})}, 500); ' 
		class='topnav_button' 
		id='search_result///${resultant_ids[i].replace("<", "")}'>
		${objectLookup(resultant_ids[i].split("::")[1] + "_tx", true, false, window.all[name].objects).text + modifier}
		</button><br><br>`;
      }
    }    
	
	console.log(allIds);
    // now, we append a list of URLs to the HTML page with the search results
	if (allIds.length > 0) gebi("find_route_resolve_overlay").hidden = false;
	else alert("This room/landmark was not found on campus!");
    
  
 }