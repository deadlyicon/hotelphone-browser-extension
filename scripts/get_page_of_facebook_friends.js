chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('get_page_of_facebook_friends.js', message);
  getPageOfFriends().then(
    result => {
      console.log({ result });
      sendResponse({ result });
    },
    error => {
      console.error(error);
      sendResponse({ error });
    }
  );
});

async function getPageOfFriends(){
  const friendNodes = document.querySelectorAll('#friends_center_main > div:nth-child(3) > div')
  const pageOfFriends = Array.from(friendNodes).map(friendNode => {
    const image = friendNode.querySelector('img[alt]');
    const link = friendNode.querySelector('a[href]');
    const mutualFriends = link.nextElementSibling;
    return {
      avatarImageUrl: image.src,
      name: image.getAttribute('alt'),
      profilePath: link.getAttribute('href'),
      mutualFriendsCount: mutualFriends.innerText.split(/\s+/)[0],
    };
  })
  const moreFriends = Array.from(document.querySelectorAll('a[href]'))
    .some(a => a.innerText === 'See More')
  chrome.runtime.sendMessage({ pageOfFriends, moreFriends })
}

