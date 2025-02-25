// background.js
// This script is currently minimal. You can add messaging or other background tasks as needed.
chrome.runtime.onInstalled.addListener(() => {
    console.log('Referrably extension installed.');
  });
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "openPopup") {
      chrome.action.openPopup();
    }
  });
  