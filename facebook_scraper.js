const log = (...args) =>
  console.log('facebook_scraper.js:', ...args)
;

log('loading…');

let DOMLastMutatedAt = Date.now()
const DOMObserver = new MutationObserver(function(mutationLiust, observer){
  DOMLastMutatedAt = Date.now();
  log('MUTATION', DOMLastMutatedAt)
});
DOMObserver.observe(document.body, {childList: true, subtree: true});


function wait(milliseconds){
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds)
  })
}

async function waitForPageMutationsToStartAndStop(){
  const DOMLastMutatedWhenStarted = DOMLastMutatedAt;
  while(true){
    if (DOMLastMutatedAt > DOMLastMutatedWhenStarted) break;
    await wait(20)
  }
  while(true){
    log('waiting for DOM mutations to stop', Date.now() - DOMLastMutatedAt)
    if (Date.now() - DOMLastMutatedAt > 200) return
    await wait(20)
  }
}

const $ = selector => document.querySelector(selector)

async function waitForSelector(selector){
  const startedAt = Date.now()
  while(true){
    if (Date.now() - startedAt > 1000)
      throw new Error(`failed to find element '${selector}'`);
    const node = $(selector)
    if (node) return node;
    await wait(10)
  }
}

// chrome.extension.onRequest.addListener(function(payload) {
//   log('onRequest', payload);
// });

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  log('onMessage', message);
  if (message.command in actions){
    actions[message.command]().then(result => {
      sendResponse(result)
    })
  }else{
    sendResponse({error:'unknown action'})
  }
  return true;
})

// // chrome.extension.sendRequest({
// chrome.runtime.sendMessage({
//   bodyHTML: document.body.innerHTML,
// });


const getPageHeight = () => $('#rootcontainer').clientHeight;

const actions = {
  async goToHomePage(){
    while(true){
      log('trying to go to homepage');
      const { pathname } = window.location;
      if (pathname === '/' || pathname === '/home.php') return;
      $('a[name="News Feed"], a[data-sigil="MBackNavBarClick"]').click();
      await waitForPageMutationsToStartAndStop();
    }
  },
  async goToProfilePage(){
    await actions.goToHomePage();
    $('.profpic').closest('a[href]').click();
    await waitForPageMutationsToStartAndStop();
  },
  async goToFriendsPage(){
    await actions.goToProfilePage();
    (await waitForSelector('a[href*="/friends?"]')).click();
    await waitForPageMutationsToStartAndStop();
  },
  async getFriends(){
    log('getting friends');
    await actions.goToFriendsPage();
    let pageHeight = getPageHeight();
    while(true){
      window.scrollTo(0,99999)
      await waitForPageMutationsToStartAndStop();
      let newPageHeight = getPageHeight();
      if (pageHeight === newPageHeight) break;
      pageHeight = newPageHeight;
    }
    const header = Array.from($$('Header'))
      .find(h => h.innerText.contains('Friends'))
    const friendsContainerSelector = header.nextElementSibling
      .getAttribute('class')
      .split(/\s+/g).map(x => `.${x}`).join('')
    const friendNodes = $$(`${friendsContainerSelector} > div`);
    log('friendNodes', friendNodes);
  },
}
