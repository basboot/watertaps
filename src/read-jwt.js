const token = localStorage.getItem("jwt:token");

const cookie = document.cookie;

chrome.runtime.sendMessage({ jwtToken: token, cookie: cookie });
