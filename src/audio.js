export class Audio {
  constructor(){this.enabled=false;this.ctx=null;}
  toggle(){this.enabled=!this.enabled;if(this.enabled){this.ctx ||= new (window.AudioContext||window.webkitAudioContext)();this.ctx.resume();}return this.enabled;}
  play(kind,tier=1){
    if(!this.enabled||!this.ctx)return;
    const c=this.ctx,t=c.currentTime,o=c.createOscillator(),gain=c.createGain();o.connect(gain);gain.connect(c.destination);
    const opts={hit:[130,38,.14,'triangle'],swing:[550,160,.09,'sawtooth'],dash:[220,850,.14,'sine'],skill:[170,55,.3,'sawtooth'],guard:[720,330,.12,'sine'],ultimate:[65,25,1.1,'sawtooth']};
    const [from,to,duration,type]=opts[kind]||opts.skill;o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+duration);gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(kind==='ultimate'?.09:.035+Math.min(tier,4)*.007,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);o.start(t);o.stop(t+duration);
  }
}
