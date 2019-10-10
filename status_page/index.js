const log = (...args) =>
  console.log('STATUS PAGE', ...args)
;

log('loading…');

const h = React.createElement.bind(React);

function getAppState(){
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(null, state => {
      resolve(state);
      // TODO handle error state here;
    });
  });
}

function setAppState(state){
  return new Promise(resolve => {
    chrome.storage.sync.set(state, resolve);
  });
};

function clearAppState(){
  return new Promise(resolve => {
    chrome.storage.sync.clear(resolve);
  });
};


class App extends React.Component {
  constructor(){
    super()
    this.state = {loadingState: true};
    this.initialize().catch(initializationError => {
      this.setState({ initializationError });
    });
  }

  async initialize(){
    const appState = await getAppState()
    this.setState({ loadingState: false, ...appState });
    chrome.storage.onChanged.addListener(changes => {
      console.log('storage change', changes)
      const state = {};
      for(const key in changes) state[key] = changes[key].newValue;
      this.setState(state);
    });
  }

  async getFacebookUser(){
    await setAppState({
      gettingFacebookUser: true,
      facebookUser: null,
    })
    const facebookUser = await sendCommandToBackground('getFacebookUser');
    console.log({ facebookUser })
    await setAppState({
      gettingFacebookUser: null,
      facebookUser
    })
  }

  inc = () => {
    const count = (this.state.count || 0) + 1;
    setAppState({count});
  }

  reset = async () => {
    await clearAppState();
  }

  render() {
    log('render', this.state)

    if (this.state.loadingState) return (
      h('div', {className:'App'},
        h('h1', {}, 'Loading…'),
      )
    )

    return h('div', {className:'App'},
      h('h1', {}, 'HotelPhone!'),
      h('div', {},
        h('button', {onClick: this.reset}, 'reset'),
        h('button', {onClick: this.getFacebookUser}, 'get facebook user'),
      ),
      h('div', {},
        h('span', {}, 'STATE:'),
        h('pre', {}, JSON.stringify(this.state, null, 2)),
      ),
    );
  }
}

ReactDOM.render(h(App), document.querySelector('main'));


function sendCommandToBackground(command){
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ command }, function({success, error, result}){
      // TODO handle runtime.lastError
      if (!success) {
        reject(new Error(error || 'unkown error'));
      }else{
        resolve(result)
      }
    });
  });
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  log('MESSAGE RECEIVED (runtime)', {request, sender});
});

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
  log('MESSAGE RECEIVED (extension)', {request, sender});
});
