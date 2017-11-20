/* eslint-disable */

const fs = require('fs');
const path = require('path');
const Benchmark = require('benchmark');
const posthtml = require('posthtml');
const uglify = require('..');

const suite = new Benchmark.Suite();
const posthtmlUglify = posthtml().use(uglify({
  // whitelist: [
  //   '.★',
  //   '.0utlook',
  //   '.4ndroid',
  //   '.aolmail_',
  //   '.aolReplacedBody',
  //   '.bloop_container',
  //   '.body',
  //   '.ExternalClass',
  //   '.iOSfixClose',
  //   '.iOSfixWrapper',
  //   '.iOSinput',
  //   '.mail-message-content',
  //   '.moz-text-html',
  //   '.MsgBody-html',
  //   '.MsgBody',
  //   '.noform',
  //   '.withform',
  //   '#★',
  //   '#0utlook',
  //   '#mb-email-wrapper',
  //   '#message-content',
  //   '#MessageViewBody',
  //   '#MessageWebViewDiv',
  //   '#msgBody',
  //   '#noform',
  //   '#secdiv',
  //   '#withform',
  // ]
}));

const input = fs.readFileSync(path.join(__dirname, '..', 'test', 'test.html')).toString('utf-8');

console.log('Running benchmark');

suite
  .add('#process', {
    fn: () => {
      const { html } = posthtmlUglify.process(input, { sync: true });
      return html;
    },
    onError: ({ message }) => console.error(message),
  })
  .on('cycle', event => console.log(String(event.target)))
  .run({ async: true });
