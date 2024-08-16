function validateUserToken(accessToken) {
		document.getElementById("authorization_ismember").innerHTML = "(calling Graph API...)";
		userinformationHttp(accessToken, function(text, status) {
			console.log("on validate: HTTP " + status);
			console.log(text);
			if (status == 200) {
				var text_response = JSON.parse(text);
				console.log(text_response);
				if (text_response.userPrincipalName.endsWith("mcpsmd.org")) {
					// seeing as this token (A) will expire at a certain time, (B) has no scopes attached to it besides User.Read,
					// and (C) doesn't have any sensitive information onboard on its own,
					// I think its fine if we put it in localStorage
					localStorage.setItem("acstoken", accessToken);
					
					// the last thing we have to do is redirect our user to the place that they were originally going to go to
					var params = new URLSearchParams(document.location.href.split("?")[1].split("#")[0]);
					var destination = params.get("redirectonsuccess");
					if (destination) {
						if (destination.includes(":/")) {
							if (confirm(`This application wants to redirect you to ${destination}. Is that OK?`)) {
								document.location = destination;
							}
						} else {
							document.location = destination; // if the redirect on success location is in the same domain its fine
						}
					} else {
						document.getElementById("authorization_ismember").innerHTML = "ACCESS GRANTED; NO REDIRECT SET";
					}

					
				} else {
					document.getElementById("authorization_ismember").innerHTML = "ACCESS DENIED:";
					document.getElementById("authorization_error_box").innerHTML += `This account (${text_response.userPrincipalName}) is not an MCPSMD account. You are not authorized to access this application and we will not move you to the next page.`;
				}			
			} else {
				document.getElementById("authorization_ismember").innerHTML = "ACCESS DENIED BECAUSE OF ERROR";
				document.getElementById("authorization_error_box").innerHTML += `When calling the MS Graph API, the below error was returned. You will not be able to access secured resources from our backend; and therefore, we will not send you to the next page.<br><br>`;
				document.getElementById("authorization_error_box").innerHTML += `HTTP ${status}<br>`;
				document.getElementById("authorization_error_box").innerHTML += `${text}<br>`;
			}
		});
}

  
  
// let's just roll the Graph API helper functions into one file 
function worddocHttp(bearerToken, documentID, callback) {
	var xhr = new XMLHttpRequest();
	documentID = "u!" + btoa(documentID).replace("+", "-").replace("/", "_").replace("=", "");
	console.log(`The document ID was encoded as ${documentID}`);
	xhr.open("GET", `https://graph.microsoft.com/v1.0/shares/${documentID}/driveItem`);
	xhr.setRequestHeader('Authorization', `Bearer ${bearerToken}`);
	xhr.setRequestHeader('Prefer', 'redeemSharingLink');
	xhr.setRequestHeader('Content-Type', 'application/json');
	
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
		
	}
	
	xhr.send();
}

function userinformationHttp(bearerToken, callback) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", `https://graph.microsoft.com/v1.0/me`);
	xhr.setRequestHeader('Authorization', `Bearer ${bearerToken}`);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.onreadystatechange = function() {
		
		if (xhr.readyState == 4) {
			callback(xhr.responseText, xhr.status);
		}
		
	}
	xhr.send();
}

function debuggerCallback(rt, status) {
	console.log(status);
	console.log(rt);
}

window.onload = function() {
	var params = new URLSearchParams(document.location.href.split("#")[1]);
	var tkn = params.get("provider_token");
	validateUserToken(tkn);
}