const log = (...args) =>
  console.log('facebook_scraper.js:', ...args)
;

log('loading…');


// chrome.extension.onRequest.addListener(function(payload) {
//   log('onRequest', payload);
// });

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  log('onMessage', {message, sender, sendResponse});
  if (message.command === 'get_friends'){
    sendResponse({
      bodyHTML: document.body.innerHTML,
    })
  }
})

// // chrome.extension.sendRequest({
// chrome.runtime.sendMessage({
//   bodyHTML: document.body.innerHTML,
// });
