const log = (...args) =>
  console.log('facebook_scraper.js:', ...args)
;

log('loading…');


chrome.extension.sendRequest({
  bodyHTML: document.body.innerHTML,
});
