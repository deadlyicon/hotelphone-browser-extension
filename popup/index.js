const log = (...args) =>
  console.log('popup.js:', ...args)
;

log('loading…');

const h = React.createElement.bind(React);

const setAppState = (...args) =>
  chrome.storage.sync.set(...args);
;

class App extends React.Component {
  constructor(){
    super()
    this.keys = ['count'];
    this.state = {loadingState: true};
    chrome.storage.sync.get(this.keys, state => {
      this.setState({
        loadingState: false,
        ...state,
      });
    });
    chrome.storage.onChanged.addListener((changes, namespace) => {
      const state = {}
      for(const key in changes) state[key] = changes[key].newValue;
      this.setState(state);
    });
  }

  inc = () => {
    const count = (this.state.count || 0) + 1;
    setAppState({count});
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
      h('h3', {}, `Count: ${this.state.count || 0}`),
      h(
        'button',
        {
          onClick: () => { sendCommandToBackground('decrementCount') },
        },
        '-'
      ),
      h(
        'button',
        {
          onClick: () => { sendCommandToBackground('incrementCount') },
        },
        '+'
      ),
      h(
        'button',
        {
          onClick: () => { sendCommandToBackground('start') },
        },
        'start'
      ),

    );
  }
}

ReactDOM.render(h(App), document.querySelector('main'));


function sendCommandToBackground(command){
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ command }, function(response){
      // TODO handle runtime.lastError
      resolve(response)
    });
  });
}

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

// function start(){
//   chrome.runtime.sendMessage({
//     msg: "start",
//     data: {
//       please: true,
//     }
//   });
// }
