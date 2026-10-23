'use strict';
const {createHash,randomBytes}=require('node:crypto');
const {isIP}=require('node:net');
const salt=randomBytes(16).toString('hex');
// Vercel overwrites X-Forwarded-For. Outside Vercel, trust the socket only.
function clientKey(req){
  const forwarded=process.env.VERCEL==='1' && typeof req.headers['x-forwarded-for']==='string' ? req.headers['x-forwarded-for'].split(',')[0].trim() : '';
  const peer=req.socket?.remoteAddress;
  const address=isIP(forwarded) ? forwarded : typeof peer==='string' && isIP(peer) ? peer : 'unknown';
  return createHash('sha256').update(salt+address).digest('hex');
}
function createLimiter(now=Date.now){
  const clients=new Map();
  return function acquire(key){
    const time=now(),minute=Math.floor(time/60000),hour=Math.floor(time/3600000);
    for(const [id,entry] of clients) if(entry.hour<hour && !entry.busy) clients.delete(id);
    let entry=clients.get(key);
    if(!entry){
      if(clients.size>=2048) return {ok:false,retryAfter:60};
      entry={minute,hour,count:0,total:0,busy:false};clients.set(key,entry);
    }
    if(entry.busy) return {ok:false,retryAfter:20};
    if(entry.hour!==hour){entry.hour=hour;entry.total=0;}
    if(entry.minute!==minute){entry.minute=minute;entry.count=0;}
    if(entry.total>=20) return {ok:false,retryAfter:Math.max(1,Math.ceil(((hour+1)*3600000-time)/1000))};
    if(entry.count>=5) return {ok:false,retryAfter:Math.max(1,Math.ceil(((minute+1)*60000-time)/1000))};
    entry.count++;entry.total++;entry.busy=true;
    let released=false;
    return {ok:true,release(){if(!released){entry.busy=false;released=true;}}};
  };
}
const acquire=createLimiter();
module.exports={createLimiter,clientKey,acquireRecommendation:req=>acquire(clientKey(req))};
