const log = (...args) =>
  console.log('facebook.js:', ...args)
;

log('loading…');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  log('MESSAGE RECEIVED', {request, sender});
});

// function wait(milliseconds){
//   return new Promise(resolve => {
//     setTimeout(resolve, milliseconds)
//   });
// }

// async function goto(location){
//   window.history.pushState(null, window.document.title, location)
//   await wait(20)
//   // return new Promise(resolve => {
//   //   function onPopstate(){
//   //     window.removeEventListener('popstate', onPopstate)
//   //   }
//   //   window.addEventListener('popstate', onPopstate)
//   //   window.history.pushState(stateObject, window.document.title, location)
//   // })
// }

// async function getUsername(){
//   if (window.location.pathname !== '/') await goto('/')
//   const profileHref = $('.profpic').closest('a[href]').href.split('?')[0]
// }

// function gotoProfile(){
//   const profileHref = $('.profpic').closest('a[href]').href.split('?')[0]
//   if (window.location !== profileHref) window.location = profileHref
// }

// function gotoFriendsList(){
//   // /friends
// }

// function loadFriendsList(){
//   gotoProfile()
// }
