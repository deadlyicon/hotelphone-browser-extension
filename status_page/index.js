const log = (...args) =>
  console.log('STATUS PAGE', ...args)
;

log('loading…');

const h = React.createElement.bind(React);

function getAppState(){
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, resolve);
  });
}

function setAppState(state){
  return new Promise(resolve => {
    chrome.storage.local.set(state, resolve);
  });
};

function clearAppState(){
  return new Promise(resolve => {
    chrome.storage.local.clear(resolve);
  });
};

function exec(command){
  chrome.runtime.sendMessage({ command });
}

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
    chrome.storage.local.onChanged.addListener(changes => {
      console.log('storage change', changes)
      const state = {};
      for(const key in changes) state[key] = changes[key].newValue;
      this.setState(state);
    });
  }

  async getFacebookUser(){
    await exec('getFacebookUser');
  }

  reset = async () => {
    await clearAppState();
  }

  render() {
    log('render', this.state)

    const {
      loadingState,
      facebookUsername,
      facebookFriendUids = [],
    } = this.state;

    const facebookFriends = facebookFriendUids.map(facebookFriendUid =>
      this.state[`facebookFriend:${facebookFriendUid}`]
    )

    if (loadingState) return (
      h('div', {className: 'App'},
        h('h1', {}, 'Loading…'),
      )
    )

    return h('div', {className: 'App'},
      h('h1', {}, 'HotelPhone!'),

      // buttons
      h('div', {},
        h(
          'button',
          {onClick: this.reset},
          'reset'
        ),
        h(
          'button',
          {onClick: () => { exec('getFacebookUsername') }},
          'get facebook user'
        ),
        h(
          'button',
          {onClick: () => { exec('getFacebookFriends') }},
          'get facebook friends'
        ),
      ),

      // facebooks slurp state
      h('div', {},
        h('div', {},
          h('strong', {}, 'Facebook Username: '),
          h('span', {}, facebookUsername),
        ),
        h('div', {},
          h('strong', {}, 'Number of slupred Facebook friends: '),
          h('span', {}, facebookFriendUids.length),
        ),
      ),

      h(FacebookAvatars, { facebookFriends }),

      h('div', {},
        h('span', {}, 'STATE:'),
        h('pre', {}, JSON.stringify(this.state, null, 2)),
      ),
    );
  }
}

ReactDOM.render(h(App), document.querySelector('main'));

class FacebookAvatars extends React.PureComponent {
  render(){
    const { facebookFriends = [] } = this.props;
    const nodes = facebookFriends.map(friend =>
      h('a',
        {
          href: friend.profileUrl,
          key: friend.uid,
          target: '_blank',
        },
        h('img', {
          className: 'FacebookAvatars-avatar',
          src: friend.avatarImageUrl,
        })
      )
    )
    return h('div', {className: 'FacebookAvatars'}, nodes);
  }
}
