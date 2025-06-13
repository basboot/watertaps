// show-alert.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SHOW_ALERT" && message.text) {
    alert(message.text);
  }
});
