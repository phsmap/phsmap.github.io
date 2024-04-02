// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC7jiBSc24-NUquwdZmO5dNmEspiz0fdXs",
  authDomain: "pvmappertest.firebaseapp.com",
  projectId: "pvmappertest",
  storageBucket: "pvmappertest.appspot.com",
  messagingSenderId: "133384551912",
  appId: "1:133384551912:web:2270256514334aa30bb85d",
  measurementId: "G-BQ24SQK212"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

/* we don't use sign in with google for MCPS because google doesn't allow people to authentiate via oauth2 for any application not on the whitelist,
// whereas microsoft only blocks if you ask for any scopes 
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
const auth = getAuth(app);
// In this case we do not have to ask for any OAuth2 scopes
auth.useDeviceLanguage();
const provider = new GoogleAuthProvider();
signInWithPopup(auth, provider)
  .then((result) => {
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    // The signed-in user info.
    const user = result.user;
    // IdP data available using getAdditionalUserInfo(result)
    console.log(credential);
	console.log(token);
	console.log(user);
  }).catch((error) => {
    // Handle Errors here.
    const errorCode = error.code;
    const errorMessage = error.message;
    // The email of the user's account used.
    const email = error.customData.email;
    // The AuthCredential type that was used.
    const credential = GoogleAuthProvider.credentialFromError(error);
    alert("Error on authenticating via Google");
  });
 */
 
import { getAuth, signInWithPopup, OAuthProvider } from "firebase/auth";
const provider = new OAuthProvider('microsoft.com');
const auth = getAuth();
// apparently for MCPS you can sign in with Microsoft just fine but when you ask for scopes 
// it doesn't work 
function startSignInFlowPopup() {
	// 1. Get an OAuth2 access token 
	document.getElementById("authorization_head_modal").hidden = false;
	signInWithPopup(auth, provider)
	  .then((result) => {
		// User is signed in.
		// IdP data available in result.additionalUserInfo.profile.

		// Get the OAuth access token and ID Token
		const credential = OAuthProvider.credentialFromResult(result);
		const accessToken = credential.accessToken;
		const idToken = credential.idToken;
		document.getElementById("authorization_gave_creds").innerHTML = "YES";
		document.getElementById("authorization_ismember").innerHTML = "(checking...)";
		
		// 2. Check to see who this OAuth2 token is for
		userinformationHttp(accessToken, function(text, status) {
			if (status == 200) {
				var text_response = JSON.parse(text);
				console.log(text_response);
				if (text_response.userPrincipalName.endsWith("mcpsmd.org")) {
					// In this case, we were successful in completing the entire flow. So, we are going to hide the modal and store the Token
					// in the browser so that other pages can use it to request resources from our backend
					document.getElementById("authorization_head_modal").hidden = true;
					
					// seeing as this token (A) will expire at a certain time, (B) has no scopes attached to it besides User.Read,
					// and (C) doesn't have any sensitive information onboard on its own,
					// I think its fine if we put it in localStorage
					localStorage.setItem("acstoken", accessToken);
					
					// the last thing we have to do is redirect our user to the place that they were originally going to go to
					var params = new URLSearchParams(document.location.href.split("?")[1]);
					var destination = params.get("redirectonsuccess");
					if (destination) {
						if (destination.includes(":/")) {
							if (confirm(`This application wants to redirect you to ${destination}. Is that OK?`)) {
								document.location = destination;
							}
						} else {
							document.location = destination; // if the redirect on success location is in the same domain its fine
						}
					}

					
				} else {
					document.getElementById("authorization_ismember").innerHTML = "NO";
					document.getElementById("authorization_error_box").innerHTML += `This account (${text_response.userPrincipalName}) is not an MCPSMD account. You are not authorized to access this application.`;
				}			
			} else {
				document.getElementById("authorization_ismember").innerHTML = "NO";
				document.getElementById("authorization_error_box").innerHTML += `An error occurred that prevented us from checking whether or not this account is an MCPSMD account. Debug information:<br><br>`;
				document.getElementById("authorization_error_box").innerHTML += `HTTP ${status}<br>`;
				document.getElementById("authorization_error_box").innerHTML += `${text}<br>`;
			}
		});
	  })
	  .catch((error) => {
		// Handle error.
		console.log(error);
		document.getElementById("authorization_gave_creds").innerHTML = "NO";
		document.getElementById("authorization_ismember").innerHTML = "NO (previous step errored out)";
		document.getElementById("authorization_error_box").innerHTML += `An error occurred. Therefore, we are unable to verify whether or not you are a member of the MCPSMD organization. Debug information:<br><br>`;
		document.getElementById("authorization_error_box").innerHTML += error;
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


// lastly, we have to actually run the thing
// (this makes the function accessible globally instead of having to call it from this module) 
window.startssopopup = startSignInFlowPopup;
window.userinformation = userinformationHttp;