const log = (...args) =>
  console.log('STATUS PAGE', ...args)
;

log('loading…');

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
  CircularProgress = F(MaterialUI.CircularProgress),
  Button = F(MaterialUI.Button),
  Grid = F(MaterialUI.Grid),
  Avatar = F(MaterialUI.Avatar),
  List = F(MaterialUI.List),
  ListItem = F(MaterialUI.ListItem),
  ListItemText = F(MaterialUI.ListItemText),
  AppBar = F(MaterialUI.AppBar),
  Toolbar = F(MaterialUI.Toolbar),
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

  reset = async () => {
    await clearAppState();
    // TODO stop background jobs
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
      Layout({},
        CircularProgress({ color: 'secondary' })
      )
    )

    return Layout({},
      // buttons
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
            onClick: () => { exec('getFacebookUsername') },
            color: 'primary'
          },
          'get facebook user'
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
            secondary: facebookUsername,
          })
        ),
        ListItem({},
          ListItemText({
            primary: 'Number of slupred Facebook friends',
            secondary: facebookFriendUids.length,
          })
        ),
      ),

      FacebookAvatars({ facebookFriends }),

      div({},
        span({}, 'STATE:'),
        pre({}, JSON.stringify(this.state, null, 2)),
      ),
    );
  }
})

const Layout = F(props =>
  div({className: 'Layout'},
    AppBar({ position: 'static' },
      Toolbar({},
        Typography({variant:'h6'}, 'HotelPhone!'),
        span({style: {flexGrow: 1}}),
        Button({color: 'inherit'}, 'Login'),
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
