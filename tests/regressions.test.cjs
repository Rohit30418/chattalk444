const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((r,j) => { resolve=r; reject=j; }); return { promise,resolve,reject }; };
const screenModule = import('../src/room/utils/screenShare.js');
function screenHarness(createScreenShareSession) {
  const pending = deferred(), published = [], released = [], errors = [];
  let captures = 0, stopped = 0;
  const stream = { getVideoTracks: () => [{ readyState: 'live', addEventListener() {} }] };
  const session = createScreenShareSession({ capture: () => { ++captures; return pending.promise; }, publish: (s) => published.push(s), release: (id) => released.push(id), onError: (e) => errors.push(e), stopTracks: (s) => { if(s) ++stopped; } });
  return { session,pending,stream,published,released,errors,get captures(){return captures;}, get stopped(){return stopped;} };
}
test('screen approval before chooser completion never starts a second capture', async () => {
  const {createScreenShareSession}=await screenModule;const h=screenHarness(createScreenShareSession);
  const id=h.session.start();h.session.approve(id);assert.equal(h.session.start(),null);assert.equal(h.captures,1);
  h.pending.resolve(h.stream);await tick();assert.deepEqual(h.published,[h.stream]);h.session.cancel();assert.equal(h.stopped,1);
});
test('capture completing before approval does not broadcast', async () => {
  const {createScreenShareSession}=await screenModule;const h=screenHarness(createScreenShareSession);
  const id=h.session.start();h.pending.resolve(h.stream);await tick();assert.equal(h.published.length,0);
  h.session.approve('stale');assert.equal(h.published.length,0);h.session.approve(id);assert.equal(h.published.length,1);h.session.cancel();
});
test('denial while chooser is open stops the late stream', async () => {
  const {createScreenShareSession}=await screenModule;const h=screenHarness(createScreenShareSession);
  const id=h.session.start();assert(h.session.deny(id));h.pending.resolve(h.stream);await tick();
  assert.equal(h.published.length,0);assert.equal(h.stopped,1);
});
test('unmount/cancel before capture resolves releases lease and stops late tracks', async () => {
  const {createScreenShareSession}=await screenModule;const h=screenHarness(createScreenShareSession);
  const id=h.session.start();h.session.cancel();h.session.approve(id);h.pending.resolve(h.stream);await tick();
  assert.equal(h.published.length,0);assert.equal(h.stopped,1);assert.deepEqual(h.released,[id]);
});
test('permission cancellation releases screen lease', async () => {
  const {createScreenShareSession}=await screenModule;const h=screenHarness(createScreenShareSession);
  const id=h.session.start();h.pending.reject(Object.assign(new Error('cancelled'),{name:'NotAllowedError'}));await tick();
  assert.deepEqual(h.released,[id]);assert.equal(h.errors.length,1);
});
test('microphone-only device can acquire in-room media', async () => {
  const {acquireUserMedia}=await import('../src/room/utils/media.js');const calls=[];const stream={audio:true};
  const result=await acquireUserMedia({getUserMedia:async(c)=>{calls.push(c);if(c.video)throw Object.assign(new Error('No camera'),{name:'NotFoundError'});return stream;}});
  assert.equal(result,stream);assert.equal(calls.length,2);assert.equal(calls[1].video,false);
});
test('camera-only fallback and stale exact device recovery', async () => {
  const {acquireUserMedia}=await import('../src/room/utils/media.js');let calls=0;
  const result=await acquireUserMedia({getUserMedia:async(c)=>{calls++;if(c.audio)throw Object.assign(new Error('No mic'),{name:'NotFoundError'});return 'camera';}},{audioDeviceId:'unplugged'});
  assert.equal(result,'camera');assert.equal(calls,4);
});
test('permission denial is not retried', async () => {
  const {acquireUserMedia}=await import('../src/room/utils/media.js');let calls=0;
  await assert.rejects(acquireUserMedia({getUserMedia:async()=>{calls++;throw Object.assign(new Error('Denied'),{name:'NotAllowedError'});}}),{name:'NotAllowedError'});assert.equal(calls,1);
});
const authSource=fs.readFileSync(path.join(__dirname,'../src/components/auth/AppWrapper.jsx'),'utf8');
const begin='onAuthStateChanged(auth, async (firebaseUser) => {';
const code='async (firebaseUser) => {'+authSource.slice(authSource.indexOf(begin)+begin.length,authSource.indexOf('\n    });',authSource.indexOf(begin)))+'\n}';
for(const scenario of ['logout','account switch','unmount'])test(`late profile sync is discarded after ${scenario}`,async()=>{
  const pending=deferred();let current=null,cached=null;
  const auth={currentUser:{uid:'A'}};const generation={current:0};
  const cb=vm.runInNewContext('('+code+')',{auth,authGeneration:generation,readCachedUser:()=>null,setUser:u=>current=u,persistUser:u=>cached=u,setLoading(){},connectSocketForFirebaseUser(){},disconnectSocket(){},api:{post:()=>pending.promise},console});
  const sync=cb({uid:'A'});
  if(scenario==='logout'){auth.currentUser=null;await cb(null);}
  else if(scenario==='account switch'){auth.currentUser={uid:'B'};generation.current++;current={uid:'B'};cached=current;}
  else{generation.current++;current=null;cached=null;}
  pending.resolve({data:{user:{}}});await sync;
  assert.equal(current?.uid,scenario==='account switch'?'B':undefined);assert.equal(cached?.uid,scenario==='account switch'?'B':undefined);
});
test('history merges preserve live updates without duplicating messages',async()=>{
  const {mergeMessages}=await import('../src/services/messageHistory.js');
  const result=mergeMessages([{id:'1',createdAt:1,text:'old'},{id:'2',createdAt:2,text:'stale'}],[{id:'2',createdAt:2,text:'fresh'},{id:'3',createdAt:3}]);
  assert.deepEqual(result.map(m=>m.id),['1','2','3']);assert.equal(result[1].text,'fresh');
});
