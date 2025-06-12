chrome.runtime.onInstalled.addListener(() => {
  console.log("add text");
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

const hammerhead = "https://dashboard.hammerhead.io/routes";

chrome.action.onClicked.addListener(async (tab) => {
  console.log("click event");
  if (tab.url.startsWith(hammerhead)) {
    // Inject the content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["assets/read-jwt.js"],
    });
  }
});

// Listen for the message from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.jwtToken !== undefined) {
    console.log("JWT Token:", message.jwtToken);
    console.log("Cookie:", message.cookie);

    const routeMatch = sender.tab.url.match(/\/routes\/(\d+)/);
    if (routeMatch) {
      const routeNumber = routeMatch[1];
      console.log("Route Number:", routeNumber);

      const fullPath = sender.tab.url.split("/routes/")[1];
      console.log("Full Path:", fullPath);

      console.log("Referrer", sender.tab.url);

      chrome.tabs.update(sender.tab.id, { url: hammerhead });

      // TODO: use route number and jwt to update route
    }
  }
});
