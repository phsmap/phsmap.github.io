function exportObjects() {
  return "The ability to translate window.objects into a list of commands is not yet implemented.";
}

// takes basically shorthand and converts them into the JSON objects that pvme.js takes
function cmdLine(input) {
  if (input.split(" ")[0] == '+pt') {
    dot = new Object();
    dot.type = 0;
    dot.data = [];
    dot.id = input.split(" ")[1];
    dot.xcoord = input.split(" ")[2];
    dot.ycoord = input.split(" ")[3];

    if (input.split(" ").length > 4) {
      if (input.split(" ").length == 8) {
        dot.connectedTo = input.split(" ")[7].split(",");
      } else {
        dot.connectedTo = [];
      }
      dot.visible = input.split(" ")[4] == "T";
      dot.color = input.split(" ")[6];
      dot.thickness = input.split(" ")[5];
    } else {
      dot.connectedTo = [];
      dot.color = "red";
      dot.thickness = 10;
      dot.visible = true;
    }
    window.objects.push(dot);
    return "(+pt) OK: Added simple point."
  }
  else if (input.split(" ")[0] == '+ns') {
    dot = new Object();
    dot.type = 1;
    dot.id = input.split(" ")[1];
    dot.points = [];
    dot.data = [];
    for (let j = 0; j < input.split(" ")[2].split(";").length; j += 1) {
      entry = input.split(" ")[2].split(";")[j];
      if (entry.split(":")[0] == '&') dot.points.push([1, entry.split(":")[1]]);
      else if (entry.split(":")[0] == '#') dot.points.push([0, entry.split(":")[1].split(",")[0], entry.split(":")[1].split(",")[1]])
      else return "(+ns) Error: invalid literal(#)/reference(&) flags in one or more nodes in set. Each node must be in the format: #:0.001,0.001; OR &:NID;";
    }
    dot.polygon = input.split(" ")[3] == "T";

    if (input.split(" ").length > 4) {
      dot.visible = input.split(" ")[4] == "T";
      dot.thickness = input.split(" ")[5];
      dot.color = input.split(" ")[6];
    } else {
      dot.visible = true;
      dot.thickness = 2;
      dot.color = "red";
    }

    window.objects.push(dot);
    return "(+ns) OK: Added node set.";
  }
  else if (input.split(" ")[0] == '+tx') {
    dot = new Object();
    dot.type = 2;
    dot.data = [];
    dot.id = input.split(" ")[1];
    dot.xcoord = input.split(" ")[2];
    dot.ycoord = input.split(" ")[3];
    dot.text = input.split(`"`)[1];
    after = input.split(`"`)[2];
    if (after.length > 5) {
      dot.visible = after.split(" ")[1] == "T";
      dot.color = after.split(" ")[2];
      dot.font = after.split(" ")[3].replaceAll("_", " ");
      dot.align = after.split(" ")[4];
    } else {
      dot.visible = true;
      dot.color = "blue";
      dot.font = "14px Arial";
      dot.align = "center";
    }
    window.objects.push(dot);
    return "(+tx) OK: added text box."
  }
  else if (input.split(" ")[0] == '+dp') {
    toModify = objectLookup(input.split(" ")[1], true, true, window.objects);
    if (toModify == null) return "(+dp) Error caught by the command interpreter: no object with this ID exists";
    window.objects[toModify].data.push([input.split(" ")[2], input.split(`"`)[1]]);
  }
  else if (input.split(" ")[0] == 'adp') {
    toModify = objectLookup(input.split(" ")[1], true, true, window.objects);
    if (toModify == null) return "(rdp) Error caught by the command interpreter: no object with this ID exists";
    window.objects[toModify].data[split(" ")[2]] += input.split(`"`)[1];
  }
  else if (input.split(" ")[0] == 'rdp') {
    toModify = objectLookup(input.split(" ")[1], true, true, window.objects);
    if (toModify == null) return "(rdp) Error caught by the command interpreter: no object with this ID exists";
    window.objects[toModify].data[split(" ")[2]] = input.split(`"`)[1];
  }
  else if (input.split(" ")[0] == 'rel') {
    loadCanvas("map", input.split(" ")[1], input.split(" ")[2] == "width");
    return "(rel) OK: Loaded a new image to the canvas and scaled it to fit.";
  }
  else if (input.split(" ")[0] == 'ren') {
    renderAllFeatures();
    return "(ren) OK: Issued command to re-render all annotations."
  }
  else if (input.split(" ")[0] == 'tdm') {
    if (input.split(" ")[1] == 'reset') {
      window.canvas.onmousedown = function(e) { }
      return "(tdm) OK: Reverted all changes that were made by enabling one or more test modes."
    }
    else if (input.split(" ")[1] == '1') {
      window.canvas.onmousedown = function(e) {
        x = e.offsetX;
        y = e.offsetY;
        cmdLine(`+pt TDM1squarenode ${x / canvas.width} ${y / canvas.height} T 15 #FF000044`);



        testdot = new Object();
        testdot.type = 2;
        testdot.id = Math.random() * 1000000000000000000
        testdot.visible = true;
        testdot.xcoord = x / window.canvas.width;
        testdot.ycoord = y / window.canvas.height;

        testdot.text = `${testdot.id}`;
        testdot.color = "blue";
        testdot.font = "19px Arial";
        testdot.align = "center";

        window.objects.push(testdot);
        renderAllFeatures();
      }
      return "(tdm) OK: Enabled test 1 (canvas onclick, point and text creation test)"
    } else if (input.split(" ")[1] == '2') {
      console.log(JSON.stringify(window.objects));
      gebi("loader_payload_slot").value = JSON.stringify(window.objects);
      renderAllFeatures();
      return ("(tdm) OK: Enabled test 2 (sucessfully dumped JSON version of window.objects to a text input element named loader_payload_slot.");
    } else {
      return "(tdm) Error caught by the command interpreter: Not a valid testing mode."
    }
  }
  else {
    return "(cmd line) Error caught by the command interpreter: Not a recognized command."
  }
}
