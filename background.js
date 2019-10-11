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
    chrome.storage.local.set(state, resolve);
  });
};

function getAppState(keys=null){
  return new Promise(resolve => {
    chrome.storage.local.get(keys, resolve);
  });
};


function createTab(url){
  return new Promise((resolve, reject) => {
    chrome.tabs.create({url, active: false}, resolve);
  });
};

function getFacebookTab(){
  return new Promise((resolve, reject) => {
    chrome.tabs.query({url: 'https://m.facebook.com/*'}, function(tabs) {
      if (tabs[0]) return resolve(tabs[0]);
      createTab.then(resolve, reject)
    });
  });
}

function executeScript(tab, options){
  return new Promise((resolve, reject) => {
    chrome.tabs.executeScript(tab.id, options, (results) => {
      if (!results && chrome.runtime.lastError) {
        const error = chrome.runtime.lastError;
        chrome.runtime.lastError = undefined;
        return reject(error)
      }
      resolve(results[0])
    });
  });
}

function sendMessageToTab(tab, message){
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tab.id,
      message,
      {},
      function(response){
        log('sendMessageToTab response', response)
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError;
          chrome.runtime.lastError = undefined;
          return reject(error)
        }
        if (response && response.error) { return reject(response.error) }
        resolve(response);
      }
    );
  });
}

async function fetchHTML(...args){
  const response = await fetch(...args)
  const doc = document.createElement('html');
  doc.response = response;
  doc.innerHTML = await response.text();
  return doc;
}

const actions = {

  async getCurrentFacebookUser(){
    await setAppState({ gettingCurrentFacebookUser: true, currentFacebookUser: null });
    const facebookTab = await createTab('https://mbasic.facebook.com');
    await executeScript(facebookTab, {file: 'scripts/get_current_facebook_user.js'});
    const currentFacebookUser = await sendMessageToTab(facebookTab);
    await setAppState({ gettingCurrentFacebookUser: false, currentFacebookUser });
    chrome.tabs.remove([facebookTab.id]);
  },

  async getFacebookFriends(){
    try{
      await setAppState({ gettingFacebookFriends: true, facebookFriendUids: [] });
      const batchSize = 5;
      let page = 0;
      const loadNextPage = async () => {
        const numberOfFriendsFound = await this.getPageOfFacebookFriends(page++);
        if (numberOfFriendsFound === 0) return;
        return loadNextPage();
      }
      await Promise.all(Array(batchSize).fill().map(loadNextPage))
      await setAppState({ gettingFacebookFriends: false });
    }catch(errorGettingFacebookFriends){
      await setAppState({
        gettingFacebookFriends: false,
        errorGettingFacebookFriends,
      });
    }
  },

  async getPageOfFacebookFriends(page){
    const url = `https://mbasic.facebook.com/friends/center/friends/?ppk=${page}`
    const document = await fetchHTML(url)
    const friendNodes = document.querySelectorAll('#friends_center_main > div:nth-child(3) > div')
    const pageOfFriends = Array.from(friendNodes).map(friendNode => {
      const image = friendNode.querySelector('img[alt]');
      const link = friendNode.querySelector('a[href]');
      const profileUrl = link.href
      const uid = profileUrl.match(/uid=(\d+)/)[1];
      // uid=103597&
      const mutualFriends = link.nextElementSibling;
      return {
        uid,
        avatarImageUrl: image.src,
        name: image.getAttribute('alt'),
        profileUrl,
        mutualFriendsCount: mutualFriends.innerText.split(/\s+/)[0],
      };
    })

    let { facebookFriendUids } = await getAppState(['facebookFriendUids']);
    facebookFriendUids = new Set(facebookFriendUids);
    const newState = {};
    pageOfFriends.forEach(friend => {
      facebookFriendUids.add(friend.uid);
      newState[`facebookFriend:${friend.uid}`] = friend;
    })
    newState.facebookFriendUids = Array.from(facebookFriendUids);
    await setAppState(newState);
    return pageOfFriends.length;
  },

  async getFacebookFriendProfile(){
    // goto https://mbasic.facebook.com/friends/hovercard/mbasic/?uid=${friend.uid}&redirectURI=x
    // click on View Profile

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
  if (message.command){
    if (message.command in actions){
      actions[message.command]().then(
        result => { log(`COMMAND ${message.command} SUCCESS`, result) },
        error => { log(`COMMAND ${message.command} ERROR`, error) },
      )
    }else{
      log(`unknown action "${message.command}"`)
    }
  }else{
    log(`unknown message`, message)
  }

  // if (message.command in actions){
  //   actions[message.command]().then(
  //     result => { sendResponse({ success: true, result }) },
  //     error => { sendResponse({ success: false, error }) },
  //   )
  // }else{
  //   sendResponse({success: false, error: `unknown action "${message.command}"`})
  // }
  // return true;
});

