// this function inserts the selected background profile/image onto the canvas and resizes it appropriately
function loadCanvas(element_id, src, stretch_to_width = true, oncomplete = null) {
  console.log("===== Loading new background image into canvas: =====")
  
  // get the canvas element and make it the size of the viewport
  console.log(document.getElementById(element_id));
  canvas = document.getElementById(element_id);
  ctx = canvas.getContext("2d");
  ctx.canvas.height = 1.00 * window.innerHeight;
  ctx.canvas.width = 1.00 * window.innerWidth;
  canvas.style.height = 1.00 * window.innerHeight;
  canvas.style.width = 1.00 * window.innerWidth;


  // draw the background map on the canvas
  img = document.createElement('img');
  img.src = src;
  img.hidden = true;
  img.id = 'bgd_image';
  img.width = window.innerWidth;
  
  if (document.getElementById("bgd_image")) {
    document.getElementById("bgd_image").outerHTML = "";
  }

  document.body.appendChild(img);


  // because we have to wait for the image to load before drawing, we set it to be on listen
  img.onload = function() {
    console.log("  All image data loaded! Applying to canvas...")
    // draw the image to take the whole screen; maintain aspect ratio
    if (stretch_to_width) {
      ratio = img.naturalWidth / img.naturalHeight;
      imgwidth = canvas.width;
      imgheight = imgwidth / ratio;
    } else if (stretch_to_width == false) {
      ratio = img.naturalHeight / img.naturalWidth;
      imgheight = canvas.height;
      imgwidth = imgheight / ratio;
    }

    // resize the canvas to be the size of the image
    // ** DO THIS BEFORE DRAWING SO WE DON'T ELONGATE THE BITMAP IMAGE BY EXPANDING AFTERWARDS ** 
    ctx.canvas.height = imgheight;
    canvas.style.height = imgheight;
    ctx.canvas.width = imgwidth;
    canvas.style.width = imgwidth;
    console.log(`  Canvas dims: (${imgwidth}, ${imgheight})`)

    // execute
    ctx.drawImage(img, 0, 0, imgwidth, imgheight);

    // set some globally accessible names as references to important objects
    window.canvas = canvas;
    window.ctx = ctx;
    window.img = img;
    window.originally_stretched_to_width = stretch_to_width; 

    // render all features
    renderAllFeatures();
	
	// complete a callback when this function is done (because remember, you can call loadCanvas() but it won't wait for the image to load in - so any code after it that requires the image to be loaded correctly fails)
	if (oncomplete != null) {
		console.log(`[loadCanvas] has been given a callback: ${oncomplete}`);
		oncomplete();
	}
  }
}

// this function returns a list of IDs of objects that meet the query conditions 
function queryObjects(queries, arrayToCheck = window.objects) {
  /*
  queries are in the following format:
  [ ["id", 1, "doors.main"], [...] ]
  0 ==
  1 !=
  2 <
  3 <=
  4 >
  5 >=
  6 <> (regex compatible)
  7 !<> (regex compatible)

  in order for an obj to be considered for the action it must meet all conditions 
  */

  // 1. make a copy of window objects list 
  copy = structuredClone(arrayToCheck);

  // 2. set up for 3.
  for (let i = 0; i < copy.length; i += 1) {
    copy[i]["matchedConditions"] = 0;
  }


  // 3. assign a value to each object that tells us about how many conditions it met
  // go through each query
  for (let query = 0; query < queries.length; query += 1) {
    // go through each object; if it meets the condition give it an additional check
    // I do understand that i could might have been able to use filter() but i forgot that that existed before 20 minutes ago 
    // and I don't feel like rewriting this portion of the code
    for (let object = 0; object < copy.length; object += 1) {
      givePoint = false;
      if (queries[query][1] == "eq") givePoint = (copy[object][queries[query][0]] == queries[query][2]); 
      else if (queries[query][1] == "neq") givePoint = (copy[object][queries[query][0]] != queries[query][2]); 
      else if (queries[query][1] == "lt") givePoint = (copy[object][queries[query][0]] < queries[query][2]);
      else if (queries[query][1] == "lteq") givePoint = (copy[object][queries[query][0]] <= queries[query][2]);
      else if (queries[query][1] == "gt") givePoint = (copy[object][queries[query][0]] > queries[query][2]);
      else if (queries[query][1] == "gteq") givePoint = (copy[object][queries[query][0]] >= queries[query][2]);
      else if (queries[query][1] == "has") givePoint = (copy[object][queries[query][0]].toLowerCase().includes(queries[query][2].toLowerCase()));
      else if (queries[query][1] == "nhas") givePoint = (copy[object][queries[query][0]].toLowerCase().includes(queries[query][2].toLowerCase()) == false);
      if (givePoint) copy[object]["matchedConditions"] += 1;
    }
  }

  // 4. check which ones met the correct number of conditions and return the list of INDICES
  toActOn = [];
  for (let i = 0; i < copy.length; i += 1) {
    if (copy[i]["matchedConditions"] >= queries.length) toActOn.push(copy[i].id);
  }

  return(toActOn);
}

// this function returns the object or indice in window.objects (the universally accessible list of annotation data) by ID
function objectLookup(objectID, returnSingle = false, returnPOS = false, arraytoCheck = window.objects) {
  answers = [];
  // look at all objects to find ones with matching ID
  for (let i = 0; i < arraytoCheck.length; i += 1) {
    if (arraytoCheck[i].id == objectID) {
      if (returnPOS == false) answers.push(arraytoCheck[i]);
      else answers.push(i);
    }
  }

  

  // if it was empty, return null
  if (answers.length <= 0) return null;

  // if there was something returned, see if we're allowed to give multiple answers
  if (returnSingle == false) {
    return answers;
  } else {
    return answers[0];
  }
}

// this function takes whatever annotation data points are in window.objects and draws them
function renderAllFeatures() {
  // clear the current board
  if (window.originally_stretched_to_width) {
    ratio = window.img.naturalWidth / window.img.naturalHeight;
    imgwidth = window.canvas.width;
    imgheight = window.imgwidth / ratio;
  } else if (window.originally_stretched_to_width == false) {
    ratio = window.img.naturalHeight / window.img.naturalWidth;
    imgheight = window.canvas.height;
    imgwidth = window.imgheight / ratio;
  }

  // resize the canvas to be the size of the image
  // ** DO THIS BEFORE DRAWING SO WE DON'T ELONGATE THE BITMAP IMAGE BY EXPANDING AFTERWARDS ** 
  window.ctx.canvas.height = imgheight;
  window.canvas.style.height = imgheight;
  window.ctx.canvas.width = imgwidth;
  window.canvas.style.width = imgwidth;
  console.log(`  Canvas dims: (${imgwidth}, ${imgheight})`)

  // execute
  window.ctx.drawImage(img, 0, 0, imgwidth, imgheight);
  
  // update the re-render counter
  if (window.renderCount == undefined) {
    window.renderCount = 0;
  } else {
    window.renderCount += 1;
  }
  console.log(`===== ATTEMPTING RENDER # ${window.renderCount} =====`)

  // start rendering all the objects in the list
  for(let i = 0; i < window.objects.length; i += 1) {
    obj = window.objects[i];
    ctx = window.ctx;
    canvas = window.canvas;
    if (obj.type == 0 && obj.visible == true) { // if the object is a simple point
      console.log("  Rendering a simple point...");
      console.log("  " + JSON.stringify(obj));
      ctx.fillStyle = obj.color;
      ctx.strokeStyle = obj.color;
      ctx.fillRect(
        obj.xcoord * canvas.width - (obj.thickness * 0.5), 
        obj.ycoord * canvas.height - (obj.thickness * 0.5), 
        1 * obj.thickness, 1 * obj.thickness
      );
    }
    if (obj.type == 1 && obj.visible == true) { // if the object is a line segment or polygon (they're both a series of points; just visually different)
      console.log("  Rendering a line segment");
      console.log("  " + JSON.stringify(obj));
      ctx.fillStyle = obj.color;
      ctx.strokeStyle = obj.color;
      ctx.lineWidth = obj.thickness;
      ctx.beginPath();
      for (let j = 0; j < obj.points.length; j += 1) {
        entry = obj.points[j];
        if (entry[0] == 0) { // if the selected entry is of type 0, or a literal point
          console.log("    + Added literal point to line segment");
          // we need moveTo first to establish a starting point; so we do that on the first point
          if (j == 0) ctx.moveTo(entry[1] * canvas.width, entry[2] * canvas.height);
          if (j > 0) ctx.lineTo(entry[1] * canvas.width, entry[2] * canvas.height);
        } else if (entry[0] == 1) { // if the selected entry is of type 1, or a reference to another point
          console.log("    + Added referenced point to line segment");
          referencedObject = objectLookup(entry[1], true, false);
          if (referencedObject == null) console.warn("    - ID given as reference does not exist: "+entry[1])
          // again -- we have to call moveTo first before we can use lineTo, so we do so on the first point
          else if (j == 0) ctx.moveTo(referencedObject.xcoord * canvas.width, referencedObject.ycoord * canvas.height);
          else if (j > 0) ctx.lineTo(referencedObject.xcoord * canvas.width, referencedObject.ycoord * canvas.height);
        }
      }

      if (obj.polygon) {
        console.log("    (++) Filling in the polygon.");
        ctx.fill();
      } else {
        console.log("    (++) Leaving the line segment unfilled.")
        ctx.stroke();
      }
      
    }
    if (obj.type == 2 && obj.visible == true) { // if the object is a text box
      console.log("  " + "  Rendering a line of text...");
      console.log(JSON.stringify(obj));
      ctx.fillStyle = obj.color;
      ctx.strokeStyle = obj.color;
      ctx.font = obj.font;
      ctx.textAlign = obj.align;
      ctx.fillText(obj.text, obj.xcoord * canvas.width, obj.ycoord * canvas.height); 
    }
  }
  console.log("===== Finished render! =====")
}










