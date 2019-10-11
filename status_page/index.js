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

function F(component){
  if (!component) // || (typeof component !== 'string' && typeof component !== 'function'))
    throw new Error('F requires either a string or a class')
  const factory = function(...args){
    return React.createElement(component, ...args);
  };
  factory.component = component;
  return factory;
};

const
  div = F('div'),
  span = F('span'),
  pre = F('pre'),
  a = F('a');

const
  MuiThemeProvider = F(MaterialUI.MuiThemeProvider),
  Container = F(MaterialUI.Container),
  Typography = F(MaterialUI.Typography),
  Box = F(MaterialUI.Box),
  Link = F(MaterialUI.Link),
  CircularProgress = F(MaterialUI.CircularProgress),
  Button = F(MaterialUI.Button),
  Grid = F(MaterialUI.Grid),
  Avatar = F(MaterialUI.Avatar),
  List = F(MaterialUI.List),
  ListItem = F(MaterialUI.ListItem),
  ListItemText = F(MaterialUI.ListItemText),
  AppBar = F(MaterialUI.AppBar),
  Toolbar = F(MaterialUI.Toolbar),
  Icon = F(MaterialUI.Icon),
  Badge = F(MaterialUI.Badge),
  IconButton = F(MaterialUI.IconButton),
  Menu = F(MaterialUI.Menu);

const theme = MaterialUI.createMuiTheme({
  // palette: {
  //   primary: MaterialUI.colors.purple,
  //   secondary: MaterialUI.colors.green,
  // },
  // status: {
  //   danger: 'orange',
  // },
});

const App = F(class App extends React.Component {
  constructor(){
    super()
    this.state = {}
    this.initialize().catch(initializationError => {
      console.error('initializationError', initializationError)
      this.setState({ initializationError });
    });
  }

  async initialize(){
    chrome.storage.local.onChanged.addListener(changes => {
      // const state = {};
      // for(const key in changes) state[key] = changes[key].newValue;
      // this.setState(state);
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = requestAnimationFrame(() => {
        getAppState().then(appState => {
          this.appState = appState;
          this.forceUpdate();
        })
      })
    });
    this.appState = await getAppState()
    if (!this.appState.currentFacebookUser) exec('getCurrentFacebookUser');
    if (!this.appState.numberOfFacebookFriends) exec('getNumberOfFacebookFriends');
    this.forceUpdate()
  }

  reset = async () => {
    await clearAppState();
    // TODO stop background jobs
  }

  render() {
    console.log('RENDER', this.appState)
    if (!this.appState) return (
      Layout({},
        Box({
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          m: 2,
        },
          CircularProgress({ })
        )
      )
    )

    const {
      loadingState,
      currentFacebookUser,
      facebookFriendUids = [],
    } = this.appState;

    const facebookFriends = facebookFriendUids.map(facebookFriendUid =>
      this.appState[`facebookFriend:${facebookFriendUid}`]
    )

    const requests = Object.keys(this.appState)
      .filter(stateKey => stateKey.match(/^request:\d+$/))
      .map(stateKey => this.appState[stateKey])


    return Layout({
      ...this.appState, facebookFriends, requests
    },
      div({},
        Button(
          {
            onClick: this.reset,
            color: 'secondary'
          },
          'reset'
        ),
        Button(
          {
            onClick: () => { exec('getCurrentFacebookUser'); },
            color: 'primary'
          },
          'get current facebook user'
        ),
        Button(
          {
            onClick: () => { exec('getFacebookFriends') },
            color: 'primary',
          },
          'get facebook friends'
        ),
      ),

      // facebooks slurp state
      List({ dense: true },
        ListItem({},
          ListItemText({
            primary: 'Facebook Username',
            secondary: currentFacebookUser && currentFacebookUser.username,
          })
        ),
        ListItem({},
          ListItemText({
            primary: 'Number of Facebook friends',
            secondary: this.appState.numberOfFacebookFriends,
          })
        ),
        ListItem({},
          ListItemText({
            primary: 'Number of slupred Facebook friends',
            secondary: facebookFriendUids.length,
          })
        ),
        ListItem({},
          ListItemText({
            primary: 'Requests',
            secondary: requests.length,
          })
        ),
      ),

      FacebookAvatars({ facebookFriends }),

      div({},
        span({}, 'STATE:'),
        pre({}, JSON.stringify(this.appState, null, 2)),
      ),
    );
  }
})

const Layout = F(props =>
  div({className: 'Layout'},
    AppBar({ position: 'static' },
      Toolbar({},
        Typography({variant:'h6'}, 'HotelPhone!'),
        (props.requests && props.requests.length > 0 &&
          Badge({badgeContent: props.requests.length},
            CircularProgress({ })
          )
        ),
        span({style: {flexGrow: 1}}),
        props.currentFacebookUser
          ? Link(
            {
              href: props.currentFacebookUser.profileUrl,
              target: '_blank',
              rel: 'noopener',
            },
            Avatar({
              alt: props.currentFacebookUser.name,
              src: props.currentFacebookUser.avatarImageUrl,
            })
          )
          : Button(
            {
              color: 'inherit',
              onClick: () => { exec('getCurrentFacebookUser'); },
            },
            'Not Logged In'
          ),
      )
    ),
    Container({}, props.children)
  )
);

const FacebookAvatars = F(function({ facebookFriends = [] }){
  const nodes = facebookFriends.map(friend =>
    a(
      {
        key: friend.uid,
        href: friend.profileUrl,
        title: friend.name,
        alt: friend.name,
        target: '_blank',
      },
      Avatar({
        alt: friend.name,
        className: 'FacebookAvatars-avatar',
        src: friend.avatarImageUrl,
      })
    )
  )
  return Grid({className: 'FacebookAvatars'}, nodes);
});

ReactDOM.render(
  MuiThemeProvider({theme}, App()),
  document.querySelector('main')
);
