class Postman {

static multiBlockFileToObject(inputString) {
    var  object = {};
    var inputStringDivided = inputString.split("====");
	for (let i = 1; i < inputStringDivided.length; i += 2) {
		object[ inputStringDivided[i] ] = inputStringDivided[i + 1];
	}
	
	return object
}

static sync_cached_httpGET(resource) {
	if (!window.authorized_httpGET_datacache) {
		window.authorized_httpGET_datacache = {};
	}
	
	if (window.authorized_httpGET_datacache[resource]) {
		// if, in the list of previously loaded resources, this resource was found
		console.log(`[authorized_httpGET] resource ${resource} was cached in a previous request, using that data`);
		return window.authorized_httpGET_datacache[resource];
	} else {
		console.error(`[authorized_httpGET] ${resource} was not found in the cache. You will need to load it into the cache using the async authorized_httpGET() before you can pull it from cache syncronously.`);
		return null;
	}
}

static authorized_httpGET(resource, callback, type = 'text') {
	if (!window.authorized_httpGET_datacache) {
		window.authorized_httpGET_datacache = {};
	}
	
	if (window.localStorage.getItem("acstoken") == undefined) {
		alert("A sign in is required to access map and other facility data. Press OK to go sign in.");
		document.location = "/";
	}
	
	if (window.authorized_httpGET_datacache[resource]) {
		// if, in the list of previously loaded resources, this resource was found
		console.log(`[authorized_httpGET] resource ${resource} was cached in a previous request, using that data`);
		callback(window.authorized_httpGET_datacache[resource]);
	} else {
		// if we actually need to load in this resource
		var xhr = new XMLHttpRequest();
		if (resource.split("/").length == 2) {
			var resourceTC = resource.split("/")[0];
			// if you load all_data.txt/floor1.json, you're asking to load the floor1.json subsection out of all_data.txt; but you still need that whole 
			// all_data.txt block - so that's why we retrieve that from the server AND NOT floor1.json
			// we have this "one file holds many" function because we want to save on the amount of AJAX calls we have to make 
		} else {
			// do nothing, leave the desired filename that we send to the server uncharnged
			var resourceTC = resource
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
							var objs = Postman.multiBlockFileToObject(xhr.responseText);
							var key = 0;
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
					alert("Your sign in was expired, invalid or missing. Press OK to go sign in.");
					console.error(`[authorized_httpGET] HTTP 401: ${xhr.response}`);
					document.location = "/";
				} else {
					console.error(`[authorized_httpGET] HTTP !200: ${xhr.response}`);
					alert("There was an error in retrieving data from the secure resource server. Please see the development console for more information.");
				}
			}
		}
		xhr.send();
	}
}

// this is the normal HTTP GET function that we're keeping around just in case we need it 
static httpGET(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            callback(xhr.responseText);
        }
    };
    xhr.send();
}

}