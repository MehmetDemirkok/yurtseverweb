// Simple script to clear cookies for testing
// This can be run in the browser console to clear all cookies

console.log('Clearing all cookies...');

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('All cookies cleared. Please refresh the page and log in again.');

// Alternative method for more specific cookie clearing
function clearCookie(name) {
  document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

// Clear specific cookies
clearCookie('token');
console.log('Token cookie cleared.'); 