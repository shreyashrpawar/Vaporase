chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "send-via-ilusion",
    title: "Send via Ilusion (Encrypted)",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "send-via-ilusion") {
    // When clicked, we open the popup. We can't automatically fill the popup yet without complex messaging,
    // but opening the popup is a good start.
    chrome.action.openPopup();
  }
});
