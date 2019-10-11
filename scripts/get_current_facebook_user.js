chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('get_current_facebook_user.js', {message});
  getCurrentFacebookUser().then(
    result => {
      console.log(result);
      sendResponse(result);
    },
    error => {
      console.error(error);
      sendResponse({ error });
    }
  );
  return true;
});

async function getCurrentFacebookUser(){

  const link = document.querySelector('#mbasic_inline_feed_composer [role=presentation] a[href]');
  return {
    // uid
    username: link.pathname.slice(1),
    avatarImageUrl: link.querySelector('img').src,
    name: link.getAttribute('alt'),
    profileUrl: link.href,
  }
  // const friendNodes = document.querySelectorAll('#friends_center_main > div:nth-child(3) > div')
  // const pageOfFriends = Array.from(friendNodes).map(friendNode => {
  //   const image = friendNode.querySelector('img[alt]');
  //   const link = friendNode.querySelector('a[href]');
  //   const profileUrl = link.href
  //   const uid = profileUrl.match(/uid=(\d+)/)[1];
  //   // uid=103597&
  //   const mutualFriends = link.nextElementSibling;
  //   return {
  //     uid,
  //     avatarImageUrl: image.src,
  //     name: image.getAttribute('alt'),
  //     profileUrl,
  //     mutualFriendsCount: mutualFriends.innerText.split(/\s+/)[0],
  //   };
  // })
  // const linkToNextPageOfFriends = Array.from(document.querySelectorAll('a[href]'))
  //   .find(a => a.innerText === 'See More')
  // console.log({ linkToNextPageOfFriends })
  // const nextPageOfFriends = linkToNextPageOfFriends && linkToNextPageOfFriends.href
  // return { pageOfFriends, nextPageOfFriends };
}
