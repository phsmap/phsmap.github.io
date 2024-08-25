// INITIALIZE SUPABASE CLIENT
// (this is not an API key that has to be kept secret)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://djlsjowqsnirkktohijj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbHNqb3dxc25pcmtrdG9oaWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTIxNzY0NDcsImV4cCI6MjAyNzc1MjQ0N30.KD332CifelxV_N41g48FmNxEYP1XLqfBct_bas-QFbk');
console.log("build 01 27");

// SET UP VERIFICATION STEPS BEFORE THE PAGE LOADS SO THAT THE ENTIRE PIPELINE IS READY WHEN WE CALL startSignIn
supabase.auth.onAuthStateChange((event, session) => {
  if (session && session.provider_token) {
    console.log("MS AD token obtained! Redirecting user to get it validated...");
  }
});

// FUNCTION THAT STARTS THE SIGN IN PROCEDURE AND WILL EVENTUALLY CALL THE ABOVE
function getTokenAndGo() {
    console.log("Going out to get the access token...");
    
    var signinOptions = {};
    signinOptions.scopes = 'User.Read email openid profile',
    signinOptions.redirectTo = `http://localhost:8080/auth2.0/validate.html?${document.location.href.split("?")[1]}`;
    
    supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: signinOptions
    });
}


// (this makes the function accessible globally instead of having to call it from this module) 
window.startSignIn = getTokenAndGo;