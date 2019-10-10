chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('get_page_of_facebook_friends.js', {message});
  getPageOfFriends().then(
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

async function getPageOfFriends(){
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
  const linkToNextPageOfFriends = Array.from(document.querySelectorAll('a[href]'))
    .find(a => a.innerText === 'See More')
  console.log({ linkToNextPageOfFriends })
  const nextPageOfFriends = linkToNextPageOfFriends && linkToNextPageOfFriends.href
  return { pageOfFriends, nextPageOfFriends };
}

function getLinkToNextPageOfFriends(){
  return Array.from(document.querySelectorAll('a[href]'))
    .find(a => a.innerText === 'See More')
}
