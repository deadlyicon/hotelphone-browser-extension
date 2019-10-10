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

chrome.browserAction.onClicked.addListener(function(){
  chrome.tabs.query({url: 'chrome-extension://*/status_page/index.html'}, function(tabs) {
    if (!tabs || tabs.length === 0){
      chrome.tabs.create({
        active: true,
        url:  'status_page/index.html'
      }, null);
    }else{
      // chrome.windows.update(tabs[0].windowId, { active: true })
      chrome.tabs.update(tabs[0].id, { active: true, highlighted: true })
      chrome.tabs.highlight({
        windowId: tabs[0].windowId,
        tabs: tabs.map(t => t.index)
      })
    }
  });
})


chrome.runtime.onInstalled.addListener(function() {
  // chrome.contextMenus.create({
  //   "id": "sampleContextMenu",
  //   "title": "Sample Context Menu",
  //   "contexts": ["selection"]
  // });

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



function setAppState(state){
  return new Promise(resolve => {
    chrome.storage.sync.set(state, resolve);
  });
};

function getAppState(keys){
  return new Promise(resolve => {
    chrome.storage.sync.get(keys, resolve);
  });
};


function createFacebookTab(){
  return new Promise((resolve, reject) => {
    chrome.tabs.create({url: 'https://m.facebook.com/', active: false}, function(tab){
      resolve(tab);
    });
  });
};

function getFacebookTab(){
  return new Promise((resolve, reject) => {
    chrome.tabs.query({url: 'https://m.facebook.com/*'}, function(tabs) {
      if (tabs[0]) return resolve(tabs[0]);
      createFacebookTab.then(resolve, reject)
    });
  });
}

function executeScript(tab, options){
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tab.id, options, (results) => {
      // TODO handle errors here
      resolve(results[0])
    });
  });
}

const actions = {

  async getFacebookUser(){
    const facebookTab = await createFacebookTab();
    const facebookUser = await executeScript(
      facebookTab,
      {
        code: `document.querySelector('.profpic').closest('a[href]').pathname.slice(1)`,
      },
    );
    chrome.tabs.remove([facebookTab.id]);
    return facebookUser;
  },

  async incrementCount(){
    const { count = 0 } = await getAppState(['count']);
    await setAppState({ count: count + 1 })
  },

  async decrementCount(){
    const { count = 0 } = await getAppState(['count']);
    await setAppState({ count: count - 1 })
  },

  async start(){
    let facebookTab
    // TRY  https://mbasic.facebook.com/
    chrome.tabs.create({url: 'https://m.facebook.com/', active: false}, function(tab){
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

}

// messages come in from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  log('MESSAGE RECEIVED', message);
  if (message.command in actions){
    actions[message.command]().then(
      result => { sendResponse({ success: true, result }) },
      error => { sendResponse({ success: false, error }) },
    )
  }else{
    sendResponse({success: false, error: `unknown action "${message.command}"`})
  }
  return true;
});

