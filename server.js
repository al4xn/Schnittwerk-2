// server.js
#!/usr/bin/env node
/* ============================================================================
   SCHNITTWERK – server.js   (v1.2.0)
   Tiny dependency-free game server: accounts (IDs #1-#100), PIN, friends,
   player list, cloud save and coin duels. Also serves the game files.

   Start:   node server.js            (then open http://localhost:3000)
   Options (environment variables):
     PORT           port (default 3000)
     OWNER_NAME     the account name that receives ID #1 (default: first sign-up)
     DATA_DIR       where db.json lives (default ./data)  -> use a persistent disk!
     LOCK_MINUTES   base lock time after 3 wrong PINs (default 15)
   ============================================================================ */
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{promisify}=require('util');
const scrypt=promisify(crypto.scrypt);

const PORT=+process.env.PORT||3000;
const DATA_DIR=process.env.DATA_DIR||path.join(__dirname,'data');
const PUBLIC_DIR=process.env.PUBLIC_DIR||__dirname;
const OWNER_NAME=(process.env.OWNER_NAME||'').trim().toLowerCase();
const VERSION='1.2.0',MAX_PLAYERS=100,ONLINE_MS=45e3;
const PIN_TRIES=3,PIN_LOCK_MS=(+process.env.LOCK_MINUTES||15)*60e3;
const PW_TRIES=6,PW_LOCK_MS=5*60e3,MAX_LOCK_MS=24*3600e3;
const MIN_STAKE=10,MAX_STAKE=1e6,INVITE_MS=120e3,COUNTDOWN_MS=7e3,MATCH_MS=5*60e3,STALE_MS=30e3;
const RESERVED=['admin','owner','system','mod','support','schnittwerk','root','server','team'];

/* codes shown to the owner only (the game itself only ships their hashes) */
const CODES={"START": {"coins": 200}, "SCHNITT": {"coins": 500}, "GOLDRAUSCH": {"coins": 2500}, "WINTER": {"coins": 300}, "HAMMERZEIT": {"tool": "hammer"}, "SAEGEN": {"tool": "saw"}, "LASERBLICK": {"tool": "laser"}, "NEON": {"skin": "neon"}, "CYBER": {"skin": "pink"}, "GOLDKLINGE": {"skin": "gold"}, "PLASMA": {"skin": "plasma"}, "AURA": {"skin": "void"}, "INFERNO": {"skin": "inferno"}, "NORDLICHT": {"skin": "aurora"}};

/* ------------------------------------------------------------------ storage */
fs.mkdirSync(DATA_DIR,{recursive:true});
const FILE=path.join(DATA_DIR,'db.json');
let db={v:1,users:{},names:{},tok:{},matches:{},seq:0};
try{const j=JSON.parse(fs.readFileSync(FILE,'utf8'));if(j&&j.users)db=Object.assign(db,j);}catch(e){}
let dirty=false;
const touch=()=>{dirty=true;};
function flush(){if(!dirty)return;dirty=false;try{const tmp=FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db));fs.renameSync(tmp,FILE);}catch(e){console.error('save failed',e.message);}}
setInterval(flush,1500).unref();
for(const s of ['SIGINT','SIGTERM'])process.on(s,()=>{flush();process.exit(0);});

/* ------------------------------------------------------------------ helpers */
const now=()=>Date.now();
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const rnd=n=>crypto.randomBytes(n).toString('hex');
const clampInt=(v,a,b)=>{v=Math.floor(+v);return isFinite(v)?Math.min(b,Math.max(a,v)):a;};
const str=(v,max,re)=>{v=String(v==null?'':v).replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,max);return re&&!re.test(v)?'':v;};
async function hashSecret(secret,saltHex){return (await scrypt(secret,Buffer.from(saltHex,'hex'),32,{N:16384,r:8,p:1})).toString('hex');}
function same(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
const ipOf=req=>String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
const hits={};
function limited(key,max,winMs){if(process.env.RATE_LIMIT==='0')return false;const t=now(),a=(hits[key]=(hits[key]||[]).filter(x=>t-x<winMs));if(a.length>=max)return true;a.push(t);return false;}
setInterval(()=>{const t=now();for(const k in hits){hits[k]=hits[k].filter(x=>t-x<3600e3);if(!hits[k].length)delete hits[k];}},600e3).unref();

const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, Authorization','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Max-Age':'86400'};
function send(res,status,obj){const b=JSON.stringify(obj);res.writeHead(status,Object.assign({'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'},CORS));res.end(b);}
const fail=(res,status,error,extra)=>send(res,status,Object.assign({ok:false},extra||{},{error}));
function readBody(req,max){return new Promise((ok,no)=>{let n=0;const c=[];req.on('data',d=>{n+=d.length;if(n>max){no(new Error('big'));req.destroy();}else c.push(d);});req.on('end',()=>{try{ok(c.length?JSON.parse(Buffer.concat(c).toString('utf8')):{});}catch(e){no(new Error('json'));}});req.on('error',no);});}

/* ------------------------------------------------------------------ users */
function newUser(id,name,pwHash,salt){
  return {id,name,pw:pwHash,salt,joined:now(),seen:now(),pin:'',pinSalt:'',pinFails:0,pinLock:0,pinLevel:0,pwFails:0,pwLock:0,pwLevel:0,
    tokens:[],friends:[],reqIn:[],reqOut:[],adj:[],adjSeq:0,matchId:0,save:null,
    pub:{coins:80,stats:{},maps:0,best:'',bestNo:0,tools:[],skins:[],upg:{},ms:0,time:0,frame:'none',nameFx:'none',color:'#ffb02e',badge:'',title:'',bio:''},
    duel:{w:0,l:0,won:0,lost:0}};
}
function issueToken(u){
  const t=rnd(24),h=sha(t);db.tok[h]={id:u.id,t:now()};u.tokens.push(h);
  while(u.tokens.length>8){delete db.tok[u.tokens.shift()];}
  touch();return t;
}
function authUser(req){
  const m=/^Bearer ([a-f0-9]{48})$/.exec(req.headers.authorization||'');if(!m)return null;
  const e=db.tok[sha(m[1])];if(!e)return null;const u=db.users[e.id];if(!u)return null;
  u.seen=now();return u;
}
const online=u=>now()-u.seen<ONLINE_MS;
const isOwner=u=>!!u&&u.id===1;
const nextId=key=>{
  if(OWNER_NAME&&key===OWNER_NAME&&!db.users[1])return 1;
  for(let i=OWNER_NAME?2:1;i<=MAX_PLAYERS;i++)if(!db.users[i])return i;
  return 0;
};

/* public view of an account. Owner gets the extra details. */
function view(u,full){
  const p=u.pub||{};
  const o={id:u.id,name:u.name,joined:u.joined,seen:u.seen,online:online(u),
    title:p.title||'',frame:p.frame||'none',nameFx:p.nameFx||'none',color:p.color||'#ffb02e',badge:p.badge||'',bio:p.bio||'',
    time:p.time|0,best:p.best||'',bestNo:p.bestNo|0,maps:p.maps|0,ms:p.ms|0,stats:p.stats||{},
    duel:{w:u.duel.w,l:u.duel.l,won:u.duel.won,lost:u.duel.lost},friends:u.friends.length};
  if(full){o.coins=p.coins|0;o.tools=p.tools||[];o.skins=p.skins||[];o.upg=p.upg||{};o.pin=!!u.pin;o.pinLock=u.pinLock>now()?u.pinLock:0;o.pwLock=u.pwLock>now()?u.pwLock:0;}
  return o;
}
const mini=u=>({id:u.id,name:u.name,online:online(u),seen:u.seen,title:u.pub.title||'',frame:u.pub.frame||'none',nameFx:u.pub.nameFx||'none',color:u.pub.color||'#ffb02e',badge:u.pub.badge||'',coins:u.pub.coins|0,bestNo:u.pub.bestNo|0,best:u.pub.best||''});
function me(u){return {id:u.id,name:u.name,owner:isOwner(u),pin:!!u.pin,joined:u.joined};}

/* sanitise what a client reports about itself */
function cleanPub(p,old){
  p=p&&typeof p==='object'?p:{};const o=Object.assign({},old);
  const num=(v,max)=>clampInt(v,0,max);
  if('coins' in p)o.coins=num(p.coins,1e9);
  if(p.stats&&typeof p.stats==='object'){o.stats={};for(const k of ['cuts','crumbs','earned','bombs','hammers','lasers','saws','time'])if(k in p.stats)o.stats[k]=num(p.stats[k],1e10);}
  if('maps' in p)o.maps=num(p.maps,200);
  if('bestNo' in p)o.bestNo=num(p.bestNo,200);
  if('best' in p)o.best=str(p.best,24,/^[a-z0-9_]*$/);
  if('ms' in p)o.ms=num(p.ms,500);
  if('time' in p)o.time=num(p.time,1e9);
  if(Array.isArray(p.tools))o.tools=p.tools.slice(0,12).map(x=>str(x,12,/^[a-z0-9_]*$/)).filter(Boolean);
  if(Array.isArray(p.skins))o.skins=p.skins.slice(0,24).map(x=>str(x,12,/^[a-z0-9_]*$/)).filter(Boolean);
  if(p.upg&&typeof p.upg==='object'){o.upg={};for(const k of ['len','speed','bonus','magnet','auto'])if(k in p.upg)o.upg[k]=num(p.upg[k],5);}
  for(const k of ['frame','nameFx','badge','title'])if(k in p)o[k]=str(p[k],16,/^[a-z0-9_]*$/);
  if('color' in p)o.color=str(p.color,7,/^#[0-9a-fA-F]{6}$/)||'#ffb02e';
  if('bio' in p)o.bio=str(p.bio,140);
  return o;
}

/* ------------------------------------------------------------------ locks (PIN / password) */
const lockLeft=(u,k)=>Math.max(0,Math.ceil((u[k+'Lock']-now())/1000));
function registerFail(u,k){
  const tries=k==='pin'?PIN_TRIES:PW_TRIES,base=k==='pin'?PIN_LOCK_MS:PW_LOCK_MS;
  u[k+'Fails']++;
  if(u[k+'Fails']>=tries){u[k+'Fails']=0;u[k+'Lock']=now()+Math.min(MAX_LOCK_MS,base*Math.pow(2,u[k+'Level']));u[k+'Level']=Math.min(u[k+'Level']+1,8);touch();return{error:'locked',retry:lockLeft(u,k)};}
  touch();return{error:k+'_wrong',left:tries-u[k+'Fails']};
}
function registerOk(u,k){if(u[k+'Fails']||u[k+'Level']){u[k+'Fails']=0;u[k+'Level']=0;touch();}}
async function checkPw(u,pw){
  if(lockLeft(u,'pw'))return{error:'locked',retry:lockLeft(u,'pw')};
  const h=await hashSecret(String(pw||''),u.salt);
  if(same(h,u.pw)){registerOk(u,'pw');return null;}
  return registerFail(u,'pw');
}
async function checkPin(u,pin){
  if(!u.pin)return null;
  if(lockLeft(u,'pin'))return{error:'locked',retry:lockLeft(u,'pin')};
  if(!/^\d{4}$/.test(String(pin||'')))return{error:'pin_needed'};
  const h=await hashSecret(String(pin),u.pinSalt);
  if(same(h,u.pin)){registerOk(u,'pin');return null;}
  return registerFail(u,'pin');
}

/* ------------------------------------------------------------------ duels */
function addAdj(u,d,why){u.adj.push({id:++u.adjSeq,d,why,t:now()});if(u.adj.length>60)u.adj.shift();touch();}
const sideOf=(m,u)=>m.a.id===u.id?'a':m.b.id===u.id?'b':null;
const other=s=>s==='a'?'b':'a';
function finishMatch(m,winnerSide,reason){
  if(m.state==='done')return;
  m.state='done';m.reason=reason;m.endedAt=now();
  const A=db.users[m.a.id],B=db.users[m.b.id];
  if(winnerSide){
    const W=db.users[m[winnerSide].id],L=db.users[m[other(winnerSide)].id];
    m.winner=W.id;addAdj(W,m.stake*2,'duel_win');
    W.duel.w++;W.duel.won+=m.stake;L.duel.l++;L.duel.lost+=m.stake;
  }else{m.winner=0;if(A)addAdj(A,m.stake,'duel_refund');if(B)addAdj(B,m.stake,'duel_refund');}
  touch();
}
function tickMatch(m){
  const t=now();
  if(m.state==='invited'&&t>m.expires){m.state='expired';m.endedAt=t;const A=db.users[m.a.id];if(A)addAdj(A,m.stake,'duel_refund');touch();}
  else if(m.state==='countdown'&&t>=m.startAt){m.state='running';touch();}
  if(m.state==='running'||m.state==='countdown'){
    const stale=s=>t-m[s].seen>STALE_MS;
    const sa=stale('a'),sb=stale('b');
    if(sa&&sb)finishMatch(m,null,'draw');
    else if(sa)finishMatch(m,'b','left');
    else if(sb)finishMatch(m,'a','left');
    else if(m.state==='running'&&t>m.endAt){
      if(m.a.pr>m.b.pr)finishMatch(m,'a','time');else if(m.b.pr>m.a.pr)finishMatch(m,'b','time');else finishMatch(m,null,'draw');
    }
  }
}
function matchView(m,u){
  const s=sideOf(m,u),o=other(s),O=db.users[m[o].id];
  return {id:m.id,state:m.state,stake:m.stake,map:m.map,startAt:m.startAt||0,endAt:m.endAt||0,expires:m.expires||0,reason:m.reason||'',winner:m.winner||0,
    host:s==='a',you:{pr:m[s].pr,fin:!!m[s].fin},opp:{id:O.id,name:O.name,pr:m[o].pr,fin:!!m[o].fin,frame:O.pub.frame||'none',nameFx:O.pub.nameFx||'none',color:O.pub.color||'#ffb02e',title:O.pub.title||''}};
}
const activeMatch=u=>{const m=u.matchId&&db.matches[u.matchId];return m||null;};

/* ------------------------------------------------------------------ API */
async function api(req,res,url){
  const p=url.pathname.slice(5),M=req.method;
  if(p==='ping'&&M==='GET')return send(res,200,{ok:true,game:'schnittwerk',v:VERSION,players:Object.keys(db.users).length,max:MAX_PLAYERS,time:now(),owner:!!db.users[1],ownerName:db.users[1]?db.users[1].name:''});
  const ip=ipOf(req);
  let b={};
  if(M==='POST'){try{b=await readBody(req,p==='sync'||p==='save'?260e3:20e3);}catch(e){return fail(res,400,'bad_request');}}

  /* ---- accounts (no token needed) ---- */
  if(p==='register'&&M==='POST'){
    if(limited('reg'+ip,12,3600e3))return fail(res,429,'slow_down');
    const name=str(b.name,14,/^[A-Za-z0-9_]{3,14}$/),pw=String(b.password||'');
    if(!name)return fail(res,400,'name_invalid');
    if(pw.length<4||pw.length>64)return fail(res,400,'pass_invalid');
    const key=name.toLowerCase();
    if(RESERVED.includes(key)&&key!==OWNER_NAME)return fail(res,409,'name_taken');
    if(db.names[key])return fail(res,409,'name_taken');
    if(!nextId(key))return fail(res,409,'full');
    const salt=rnd(16),h=await hashSecret(pw,salt);
    /* re-check after the async hash: nobody may have taken the name / slot meanwhile */
    if(db.names[key])return fail(res,409,'name_taken');
    const id=nextId(key);if(!id)return fail(res,409,'full');
    const u=newUser(id,name,h,salt);db.users[id]=u;db.names[key]=id;
    const token=issueToken(u);touch();
    return send(res,200,{ok:true,token,me:me(u),time:now()});
  }
  if(p==='login'&&M==='POST'){
    if(limited('log'+ip,40,600e3))return fail(res,429,'slow_down');
    const key=String(b.name||'').trim().toLowerCase(),u=db.names[key]&&db.users[db.names[key]];
    if(!u){await hashSecret('x','00');return fail(res,401,'bad_login');}
    const e=await checkPw(u,b.password);
    if(e)return fail(res,e.error==='locked'?429:401,e.error==='pw_wrong'?'bad_login':e.error,e);
    const e2=await checkPin(u,b.pin);
    if(e2)return fail(res,e2.error==='locked'?429:401,e2.error,e2);
    u.seen=now();const token=issueToken(u);
    return send(res,200,{ok:true,token,me:me(u),time:now()});
  }

  /* ---- everything below needs a token ---- */
  const u=authUser(req);
  if(!u)return fail(res,401,'auth');

  if(p==='logout'&&M==='POST'){const m=/^Bearer (.+)$/.exec(req.headers.authorization||'');const h=sha(m[1]);delete db.tok[h];u.tokens=u.tokens.filter(x=>x!==h);touch();return send(res,200,{ok:true});}
  if(p==='me'&&M==='GET')return send(res,200,{ok:true,me:me(u),time:now()});

  if(p==='password'&&M==='POST'){
    const np=String(b.new||'');if(np.length<4||np.length>64)return fail(res,400,'pass_invalid');
    const e=await checkPw(u,b.old);if(e)return fail(res,e.error==='locked'?429:401,e.error==='pw_wrong'?'bad_login':e.error,e);
    const e2=await checkPin(u,b.pin);if(e2)return fail(res,e2.error==='locked'?429:401,e2.error,e2);
    u.salt=rnd(16);u.pw=await hashSecret(np,u.salt);
    const cur=/^Bearer (.+)$/.exec(req.headers.authorization||'')[1];const keep=sha(cur);
    for(const h of u.tokens)if(h!==keep)delete db.tok[h];u.tokens=[keep];touch();
    return send(res,200,{ok:true});
  }
  if(p==='pin/set'&&M==='POST'){
    if(u.pin)return fail(res,409,'pin_exists');
    if(!/^\d{4}$/.test(String(b.pin||'')))return fail(res,400,'pin_invalid');
    const e=await checkPw(u,b.password);if(e)return fail(res,e.error==='locked'?429:401,e.error==='pw_wrong'?'bad_login':e.error,e);
    u.pinSalt=rnd(16);u.pin=await hashSecret(String(b.pin),u.pinSalt);touch();
    return send(res,200,{ok:true});
  }
  if(p==='pin/change'&&M==='POST'){
    if(!u.pin)return fail(res,409,'pin_none');
    if(!/^\d{4}$/.test(String(b.pin||'')))return fail(res,400,'pin_invalid');
    const e=await checkPin(u,b.old);if(e)return fail(res,e.error==='locked'?429:401,e.error,e);
    u.pinSalt=rnd(16);u.pin=await hashSecret(String(b.pin),u.pinSalt);touch();
    return send(res,200,{ok:true});
  }
  if(p==='pin/remove'&&M==='POST'){
    if(!u.pin)return fail(res,409,'pin_none');
    const e=await checkPin(u,b.pin);if(e)return fail(res,e.error==='locked'?429:401,e.error,e);
    u.pin='';u.pinSalt='';touch();return send(res,200,{ok:true});
  }

  /* ---- profile + cloud save ---- */
  if(p==='sync'&&M==='POST'){
    u.pub=cleanPub(b.pub,u.pub);
    if(b.save&&typeof b.save==='object'&&b.save.data&&typeof b.save.data==='object'){
      const raw=JSON.stringify(b.save.data);if(raw.length<200e3)u.save={t:clampInt(b.save.t,0,4e12),data:b.save.data};
    }
    touch();return send(res,200,{ok:true,time:now()});
  }
  if(p==='save'&&M==='GET')return send(res,200,{ok:true,save:u.save||null});

  /* ---- lists ---- */
  if(p==='players'&&M==='GET'){
    const full=isOwner(u);
    return send(res,200,{ok:true,time:now(),players:Object.values(db.users).sort((a,b)=>a.id-b.id).map(x=>view(x,full)),max:MAX_PLAYERS});
  }
  if(p==='player'&&M==='GET'){
    const x=db.users[clampInt(url.searchParams.get('id'),0,MAX_PLAYERS)];if(!x)return fail(res,404,'not_found');
    return send(res,200,{ok:true,player:view(x,isOwner(u)),friend:u.friends.includes(x.id)});
  }

  /* ---- poll: everything the client needs regularly ---- */
  if(p==='poll'&&M==='GET'){
    const ack=clampInt(url.searchParams.get('ack'),0,1e9);
    if(ack)u.adj=u.adj.filter(a=>a.id>ack);
    let m=activeMatch(u);
    if(m){tickMatch(m);
      const s=sideOf(m,u);m[s].seen=now();
      if(m.state==='done'&&(m[s].ack||now()-m.endedAt>120e3)){u.matchId=0;m=null;}
      else if(['declined','canceled','expired'].includes(m.state)&&now()-m.endedAt>4e3){u.matchId=0;m=null;}
    }
    const byId=id=>db.users[id];
    return send(res,200,{ok:true,time:now(),me:me(u),adj:u.adj,
      friends:u.friends.map(byId).filter(Boolean).map(mini),
      reqIn:u.reqIn.map(byId).filter(Boolean).map(mini),
      reqOut:u.reqOut.map(byId).filter(Boolean).map(mini),
      match:m?matchView(m,u):null,players:Object.keys(db.users).length});
  }

  /* ---- friends ---- */
  if(p.startsWith('friend/')&&M==='POST'){
    const act=p.slice(7),o=db.users[clampInt(b.id,0,MAX_PLAYERS)];
    if(!o||o.id===u.id)return fail(res,404,'not_found');
    const rm=(arr,id)=>{const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);};
    if(act==='request'){
      if(u.friends.includes(o.id))return fail(res,409,'already');
      if(u.reqOut.includes(o.id))return fail(res,409,'pending');
      if(u.reqIn.includes(o.id)){rm(u.reqIn,o.id);rm(o.reqOut,u.id);u.friends.push(o.id);o.friends.push(u.id);touch();return send(res,200,{ok:true,state:'friends'});}
      if(u.reqOut.length>=30)return fail(res,429,'too_many');
      u.reqOut.push(o.id);o.reqIn.push(u.id);touch();return send(res,200,{ok:true,state:'sent'});
    }
    if(act==='accept'){
      if(!u.reqIn.includes(o.id))return fail(res,404,'no_request');
      rm(u.reqIn,o.id);rm(o.reqOut,u.id);
      if(!u.friends.includes(o.id))u.friends.push(o.id);if(!o.friends.includes(u.id))o.friends.push(u.id);touch();return send(res,200,{ok:true});
    }
    if(act==='decline'){rm(u.reqIn,o.id);rm(o.reqOut,u.id);touch();return send(res,200,{ok:true});}
    if(act==='cancel'){rm(u.reqOut,o.id);rm(o.reqIn,u.id);touch();return send(res,200,{ok:true});}
    if(act==='remove'){rm(u.friends,o.id);rm(o.friends,u.id);touch();return send(res,200,{ok:true});}
    return fail(res,404,'unknown');
  }

  /* ---- duels ---- */
  if(p.startsWith('duel/')&&M==='POST'){
    const act=p.slice(5);
    if(act==='invite'){
      const o=db.users[clampInt(b.to,0,MAX_PLAYERS)];
      if(!o||!u.friends.includes(o.id))return fail(res,403,'not_friends');
      const stake=clampInt(b.stake,0,MAX_STAKE),map=str(b.map,20,/^[a-z0-9_]+$/);
      if(stake<MIN_STAKE)return fail(res,400,'stake_low');
      if(!map)return fail(res,400,'bad_map');
      if(clampInt(b.coins,0,1e12)<stake)return fail(res,402,'poor');
      if((o.pub.coins|0)<stake)return fail(res,402,'friend_poor');
      const mu=activeMatch(u),mo=activeMatch(o);
      if(mu&&!['done','declined','canceled','expired'].includes(mu.state))return fail(res,409,'busy');
      if(mo&&!['done','declined','canceled','expired'].includes(mo.state))return fail(res,409,'friend_busy');
      if(!online(o))return fail(res,409,'friend_offline');
      const m={id:++db.seq,a:{id:u.id,pr:0,fin:0,seen:now()},b:{id:o.id,pr:0,fin:0,seen:0},stake,map,state:'invited',created:now(),expires:now()+INVITE_MS,winner:0};
      db.matches[m.id]=m;u.matchId=m.id;o.matchId=m.id;
      const ids=Object.keys(db.matches).map(Number).sort((x,y)=>x-y);while(ids.length>400)delete db.matches[ids.shift()];
      touch();return send(res,200,{ok:true,match:matchView(m,u)});
    }
    const m=activeMatch(u);if(!m)return fail(res,404,'no_match');
    tickMatch(m);const s=sideOf(m,u),o=other(s);
    if(act==='accept'){
      if(s!=='b'||m.state!=='invited')return fail(res,409,'not_open');
      if(clampInt(b.coins,0,1e12)<m.stake)return fail(res,402,'poor');
      m.state='countdown';m.startAt=now()+COUNTDOWN_MS;m.endAt=m.startAt+MATCH_MS;m.b.seen=now();m.a.seen=now();touch();
      return send(res,200,{ok:true,match:matchView(m,u),time:now()});
    }
    if(act==='decline'){
      if(s!=='b'||m.state!=='invited')return fail(res,409,'not_open');
      m.state='declined';m.endedAt=now();addAdj(db.users[m.a.id],m.stake,'duel_refund');touch();return send(res,200,{ok:true});
    }
    if(act==='cancel'){
      if(s!=='a'||m.state!=='invited')return fail(res,409,'not_open');
      m.state='canceled';m.endedAt=now();addAdj(u,m.stake,'duel_refund');touch();return send(res,200,{ok:true});
    }
    if(act==='progress'){
      if(!['countdown','running'].includes(m.state)&&m.state!=='done')return fail(res,409,'not_running');
      if(m.state!=='done'){
        m[s].seen=now();m[s].pr=Math.max(m[s].pr,clampInt(b.pr,0,100));
        if(m.state==='running'&&b.fin&&!m[s].fin){m[s].fin=now();m[s].pr=100;finishMatch(m,s,'finish');}
      }
      return send(res,200,{ok:true,match:matchView(m,u),time:now()});
    }
    if(act==='forfeit'){
      if(['countdown','running'].includes(m.state))finishMatch(m,o,'forfeit');
      return send(res,200,{ok:true,match:matchView(m,u)});
    }
    if(act==='ack'){m[s].ack=true;if(m.state==='done'||['declined','canceled','expired'].includes(m.state))u.matchId=0;touch();return send(res,200,{ok:true});}
    return fail(res,404,'unknown');
  }

  /* ---- owner tools ---- */
  if(p.startsWith('admin/')){
    if(!isOwner(u))return fail(res,403,'owner_only');
    if(p==='admin/codes'&&M==='GET')return send(res,200,{ok:true,codes:CODES});
    if(p==='admin/unlock'&&M==='POST'){
      const x=db.users[clampInt(b.id,0,MAX_PLAYERS)];if(!x)return fail(res,404,'not_found');
      x.pinLock=0;x.pinFails=0;x.pinLevel=0;x.pwLock=0;x.pwFails=0;x.pwLevel=0;touch();return send(res,200,{ok:true});
    }
  }
  return fail(res,404,'unknown');
}

/* ------------------------------------------------------------------ static files */
const FILES={'/':'index.html','/index.html':'index.html','/style.css':'style.css','/game.js':'game.js','/sw.js':'sw.js','/matter.min.js':'matter.min.js','/manifest.webmanifest':'manifest.webmanifest','/icon.svg':'icon.svg'};
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml'};
function serveStatic(req,res,url){
  const f=FILES[url.pathname];
  if(!f||req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found');}
  fs.readFile(path.join(PUBLIC_DIR,f),(err,buf)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain'});return res.end('Not found');}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(req.method==='HEAD'?undefined:buf);
  });
}

const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    if(req.method==='OPTIONS'){res.writeHead(204,CORS);return res.end();}
    if(url.pathname.startsWith('/api/'))return await api(req,res,url);
    return serveStatic(req,res,url);
  }catch(e){console.error(e);try{fail(res,500,'server');}catch(_){}}
});
server.listen(PORT,()=>console.log('Schnittwerk server '+VERSION+' on http://localhost:'+PORT+'  (data: '+DATA_DIR+')'+(OWNER_NAME?'  owner: '+OWNER_NAME:'')));
