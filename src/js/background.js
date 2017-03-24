/* 
 * http://stackoverflow.com/a/21957558
 * http://stackoverflow.com/a/16136524
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (/https:\/\/github\.com\/[^\/]+\/[^\/]+\/commits/g.exec(tab.url) != null) {
    chrome.browserAction.setIcon({path: "src/icons/active128.png", tabId:tab.id});
  }
  else {
    chrome.browserAction.setIcon({path: "src/icons/inactive128.png", tabId:tab.id});
  }
});