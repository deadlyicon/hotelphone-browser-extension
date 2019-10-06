const log = (...args) =>
  console.log('background.js:', ...args)
;

log('loading…');

// // Called when the user clicks on the browser action.
// chrome.browserAction.onClicked.addListener(function(tab) {
//   log('CLICK', tab);
//   // Send a message to the active tab
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     const activeTab = tabs[0];
//     chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
//   });
// });


// chrome.extension.onRequest.addListener(function(payload) {
//   log('onRequest', payload);
// });

chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({color: '#3aa757'}, function() {
    console.log('The color is green.');
  });
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules(
      [
        {
          conditions: [
            new chrome.declarativeContent.PageStateMatcher({
              // pageUrl: {hostEquals: 'm.facebook.com'},
              pageUrl: {},
            })
          ],
          actions: [new chrome.declarativeContent.ShowPageAction()]
        }
      ]
    );
  });
});


// messages come in from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  log('MESSAGE RECEIVED', request, sender);
  if (request.msg === "start") start();
});

function start(){
  let facebookTab
  chrome.tabs.create({url: 'https://m.facebook.com/'}, function(tab){
    facebookTab = tab

    // chrome.tabs.onUpdated.addListener(function callback)
    chrome.tabs.executeScript(
      facebookTab.id,
      {file: 'facebook_scraper.js', allFrames: true},
      function(){
        log('sending getFriends message');
        chrome.tabs.sendMessage(
          facebookTab.id,
          {"command": "getFriends"},
          function(response){
            log('got response from getFriends message', response)
          }
        );
      }
    );
  })
}
