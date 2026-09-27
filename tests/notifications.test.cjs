const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

for (const visible of [true, false]) test(`push displays messages and tests with visible window=${visible}`, async () => {
  const handlers = {}, shown = [];
  const self = { addEventListener: (name, fn) => { handlers[name] = fn; }, registration: { showNotification: async (...args) => shown.push(args) }, clients: { matchAll: async () => [{ visibilityState: visible ? 'visible' : 'hidden', focused: visible }] } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8'), { self, URL });
  for (const tag of ['dm-conversation', 'vaani-push-test']) {
    let done;
    handlers.push({ data: { json: () => ({ title: 'Notification', tag, url: '/messages' }) }, waitUntil: p => { done = p; } });
    await done;
  }
  assert.equal(shown.length, 2);
  assert.equal(shown[0][1].data.url, '/messages');
});

function harness(storage = new Map([['userInfo', JSON.stringify({uid:'user-a'})]])) {
  let posts = 0, fail = false, now = 100000;
  const subscription = { endpoint: 'https://push.example/device', options: { applicationServerKey: new Uint8Array([1, 2, 3]).buffer }, toJSON() { return { endpoint: this.endpoint }; } };
  const registration = { addEventListener() {}, update: async () => {}, pushManager: { getSubscription: async () => subscription } };
  const api = { get: async () => ({ data: { configured: true, publicKey: 'AQID' } }), post: async () => { posts++; if (fail) throw { response: { status: 429, headers: {'retry-after': '60'} } }; } };
  const context = { api, console: {warn(){}}, Date: { now: () => now }, Uint8Array, Notification: {permission: 'granted'}, localStorage: {getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}, navigator: { serviceWorker: { register: async () => registration, addEventListener(){} } }, window: { PushManager: {}, addEventListener(){}, setTimeout(){}, atob: s => Buffer.from(s,'base64').toString('binary') } };
  const source = fs.readFileSync(path.join(__dirname, '../src/services/pwa.js'),'utf8').replace("import api from './api';",'').replaceAll('export const ', 'const ');
  vm.runInNewContext(source+'\nglobalThis.sync = syncPushSubscription;',context);
  return { sync: context.sync, storage, get posts(){return posts;}, fail:()=>{fail=true;}, advance:n=>{now+=n;} };
}
test('successful registration is reused across focus events and page reloads', async () => {
  const h = harness();
  for(let i=0;i<15;i++) assert.equal((await h.sync()).subscribed,true);
  assert.equal(h.posts,1);
  const reloaded = harness(h.storage);
  assert.equal((await reloaded.sync()).subscribed,true);
  assert.equal(reloaded.posts,0);
  reloaded.storage.set('userInfo',JSON.stringify({uid:'user-b'}));
  await reloaded.sync();
  assert.equal(reloaded.posts,1);
});
test('429 responses back off instead of retrying on each focus', async () => {
  const h=harness();h.fail();await h.sync();
  for(let i=0;i<15;i++) assert.equal((await h.sync()).reason,'retry-later');
  assert.equal(h.posts,1);
  h.advance(61000);await h.sync();assert.equal(h.posts,2);
});
