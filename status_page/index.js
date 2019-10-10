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

const {
  Container,
  Typography,
  Button,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
} = MaterialUI;

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
      h(Container, {className: 'App'},
        h(Typography, {variant:'h3', gutterBottom: true}, 'Loading…')
      )
    )

    return h(Container, {className: 'App'},
      h(Typography, {variant:'h1', gutterBottom: true}, 'HotelPhone!'),

      // buttons
      h('div', {},
        h(
          Button,
          {
            onClick: this.reset,
            color: 'secondary',
          },
          'reset'
        ),
        h(
          Button,
          {
            onClick: () => { exec('getFacebookUsername') },
            color: 'primary',
          },
          'get facebook user'
        ),
        h(
          Button,
          {
            onClick: () => { exec('getFacebookFriends') },
            color: 'primary',
          },
          'get facebook friends'
        ),
      ),

      // facebooks slurp state
      h(List, {},
        h(ListItem, {},
          h(ListItemText, {
            primary: 'Facebook Username',
            secondary: facebookUsername,
          })
        ),
        h(ListItem, {},
          h(ListItemText, {
            primary: 'Number of slupred Facebook friends',
            secondary: facebookFriendUids.length,
          })
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
          key: friend.uid,
          href: friend.profileUrl,
          title: friend.name,
          alt: friend.name,
          target: '_blank',
        },
        h(Avatar, {
          alt: friend.name,
          className: 'FacebookAvatars-avatar',
          src: friend.avatarImageUrl,
        })
      )
    )
    return h(Grid, {className: 'FacebookAvatars'}, nodes);
  }
}
