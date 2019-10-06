const log = (...args) =>
  console.log('popup.js:', ...args)
;

log('loading…');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  log('MESSAGE RECEIVED (runtime)', {request, sender});
});

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
  log('MESSAGE RECEIVED (extension)', {request, sender});
});

chrome.storage.sync.get('color', function(data) {
  log('color', {data});
  document.body.style.backgroundColor = data.color;
  // changeColor.setAttribute('value', data.color);
});

let startButton, facebookTab;

window.addEventListener('DOMContentLoaded', (event) => {
  startButton = document.getElementById('startButton');
  startButton.addEventListener('click', function(event){
    start()
  });

  // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
  //   const activeTab = tabs[0];
  //   chrome.tabs.sendMessage(
  //     activeTab.id,
  //     {"message": "start_it_up_up_up"}
  //   );
  // });
});

function start(){
  chrome.runtime.sendMessage({
    msg: "start",
    data: {
      please: true,
    }
  });
}
