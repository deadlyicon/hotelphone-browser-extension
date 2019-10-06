const log = (...args) =>
  console.log('facebook_scraper.js:', ...args)
;

log('loading…');

let DOMLastMutatedAt = Date.now()
const DOMObserver = new MutationObserver(function(mutationLiust, observer){
  DOMLastMutatedAt = Date.now();
});
DOMObserver.observe(document.body, {childList: true, subtree: true});


function wait(milliseconds){
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds)
  })
}

async function waitForPageMutationsToStartAndStop(){
  log('waitForPageMutationsToStartAndStop WAITING')
  const DOMLastMutatedWhenStarted = DOMLastMutatedAt;
  await wait(200)
  // while(true){
  //   if (DOMLastMutatedAt > DOMLastMutatedWhenStarted) break;
  //   await wait(20)
  // }
  while(true){
    if (Date.now() - DOMLastMutatedAt > 1000){
      log('waitForPageMutationsToStartAndStop DONE')
      return
    }
    await wait(20)
  }
}

const $ = selector => document.querySelector(selector)
const $$ = selector => Array.from(document.querySelectorAll(selector))

async function waitForElement(selector, timeout=1000){
  const startedAt = Date.now()
  while(true){
    if (timeout !== 0 && Date.now() - startedAt > timeout)
      throw new Error(`failed to find element matching '${selector}'`);
    const node = $(selector)
    if (node) return node;
    await wait(10)
  }
}

async function waitForNoElement(selector, timeout=1000){
  const startedAt = Date.now()
  while(true){
    if (timeout !== 0 && Date.now() - startedAt > timeout)
      throw new Error(`failed to not find element matching '${selector}'`);
    const node = $(selector)
    if (!node) return;
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
    (await waitForElement('a[href*="/friends?"]')).click();
    await waitForPageMutationsToStartAndStop();
  },
  async getFriends(){
    log('getting friends');
    await actions.goToFriendsPage();

    // look for friends header
    const header = $$('Header').find(h => h.innerText.includes('Friends'))
    log({header})

    const friendsContainerSelector = (
      header.nextElementSibling
      .getAttribute('class')
      .split(/\s+/g).map(x => `.${x}`).join('') + ' > div'
    )
    log({friendsContainerSelector})

    // scroll down to load all friends
    while($('.seeMoreFriends')){
      window.scrollTo(0,99999)
      await wait(100);
    }

    const friendNodes = $$(friendsContainerSelector);
    log('friendNodes', friendNodes);

    const friends = friendNodes.map(friendNode => {
      const avatarLink = friendNode.querySelector('a.darkTouch');
      const avatarImg = avatarLink.querySelector('i');
      return {
        profilePath: avatarLink.pathname,
        name: avatarImg.getAttribute('aria-label'),
        avatarImageUrl: avatarImg.style.backgroundImage.slice(5, -2),
        mutualFriendsCount: friendNode.querySelector('[data-sigil="m-add-friend-source-replaceable"]').innerText.split(/\s+/)[0],
      }
    })

    log('friends', friends);
    return friends
  },
}
