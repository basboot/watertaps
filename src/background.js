import { addWaterTaps } from "./addtaps";

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
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  console.log("message");
  if (message.jwtToken !== undefined) {
    const jwtToken = message.jwtToken;
    const cookie = message.cookie;

    // https://dashboard.hammerhead.io/routes/40857.route.e1b7dc3c-a209-45e7-8925-eda8dcd77944

    const routeMatch = sender.tab.url.match(/\/routes\/(\d+)/);
    if (routeMatch) {
      const userId = routeMatch[1];

      const routeId = sender.tab.url.split("/routes/")[1];

      const referrer = sender.tab.url;

      // TODO: use route number and jwt to update route, to make it also work on new routes

      await addWaterTaps(jwtToken, cookie, userId, routeId, referrer);

      chrome.tabs.update(sender.tab.id, { url: hammerhead });
    } else {
      console.log("Not on page with a route.");
      chrome.scripting
        .executeScript({
          target: { tabId: sender.tab.id },
          files: ["assets/show-alert.js"],
        })
        .then(() => {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "SHOW_ALERT",
            text: "Cannot add watertaps to new routes, please close route and re-open first.",
          });
        });
    }
  }
});
