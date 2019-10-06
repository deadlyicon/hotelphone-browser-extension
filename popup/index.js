const log = (...args) =>
  console.log('popup.js:', ...args)
;

log('loading…');



const h = React.createElement.bind(React);

class App extends React.Component {
  constructor(){
    super()
    this.keys = ['count'];
    this.state = {};
    chrome.storage.sync.get(this.keys, state => {
      log('constructor state', state);
      this.setState(state);
    });
    chrome.storage.onChanged.addListener((changes, namespace) => {
      log('state changed', changes);
      const state = {}
      for(const key in changes) state[key] = changes[key].newValue;
      this.setState(state);
    });
  }

  setAppState = (...args) => {
    return chrome.storage.sync.set(...args);
  }

  inc = () => {
    const count = (this.state.count || 0) + 1;
    this.setAppState({count});
  }

  render() {
    log('render', this.state)
    return h('div', {className:'App'},
      h('h1', {}, 'HotelPhone!'),
      h('h3', {}, `Count: ${this.state.count || 0}`),
      h(
        'button',
        {
          onClick: this.inc,
        },
        '+'
      ),

    );
  }
}

ReactDOM.render(h(App), document.querySelector('main'));



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  log('MESSAGE RECEIVED (runtime)', {request, sender});
});

chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
  log('MESSAGE RECEIVED (extension)', {request, sender});
});

// chrome.storage.sync.get('color', function(data) {
//   log('color', {data});
//   document.body.style.backgroundColor = data.color;
//   // changeColor.setAttribute('value', data.color);
// });

// let startButton, facebookTab;

// window.addEventListener('DOMContentLoaded', (event) => {
//   startButton = document.getElementById('startButton');
//   startButton.addEventListener('click', function(event){
//     start()
//   });

//   // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//   //   const activeTab = tabs[0];
//   //   chrome.tabs.sendMessage(
//   //     activeTab.id,
//   //     {"message": "start_it_up_up_up"}
//   //   );
//   // });
// });

function start(){
  chrome.runtime.sendMessage({
    msg: "start",
    data: {
      please: true,
    }
  });
}
