(() => {
  'use strict';
  const loader=document.querySelector('#arrival-loader');
  const contours=loader.querySelector('.arrival-contours');
  const number=loader.querySelector('.arrival-percent'),bar=loader.querySelector('.arrival-progress');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const started=performance.now(),milestones=new Map(),inertState=new Map();
  let target=0,displayed=0,frame=0,releasing=false,finished=false,releaseTimer,scriptMarks=0;
  let resolveReady;const ready=new Promise(resolve=>resolveReady=resolve);
  window.ArrivalGate={ready,get active(){return !finished;}};
  loader.hidden=false;document.documentElement.classList.add('is-arriving');
  const paths=Array.from({length:8},(_,i)=>{
    const node=document.createElementNS('http://www.w3.org/2000/svg','path');
    node.setAttribute('opacity',String(.7-i*.064));contours.append(node);return node;
  });
  function drawContours(time){
    paths.forEach((path,i)=>{
      let d='';
      for(let j=0;j<=168;j++){
        const angle=j/168*Math.PI*2;
        const radius=155+i*13+(30+i*2.5)*Math.cos(angle*4)+12*Math.cos(angle*8)*Math.sin(time*.55+i*.25);
        const x=Math.cos(angle)*radius*(1.27+i*.035),y=Math.sin(angle)*radius*.91;
        d+=(j?'L':'M')+x.toFixed(2)+' '+y.toFixed(2);
      }
      path.setAttribute('d',d+'Z');
    });
    loader.querySelector('.arrival-orbit').setAttribute('transform','rotate('+time*8+')');
  }
  function render(now){
    frame=0;if(finished)return;
    displayed+=(target-displayed)*.13;if(target===100&&displayed>99.2)displayed=100;
    const value=Math.floor(displayed);number.textContent=String(value).padStart(2,'0');bar.setAttribute('aria-valuenow',String(value));
    if(!reduced.matches)drawContours((now-started)/1000);
    if(!document.hidden)frame=requestAnimationFrame(render);
  }
  function mark(name,weight){if(milestones.has(name)||finished)return;milestones.set(name,weight);target=Math.min(100,[...milestones.values()].reduce((a,b)=>a+b,0));if(!frame)frame=requestAnimationFrame(render);}
  function restore(){
    finished=true;cancelAnimationFrame(frame);clearTimeout(failsafe);clearTimeout(releaseTimer);
    document.documentElement.classList.remove('is-arriving');loader.hidden=true;
    inertState.forEach((value,node)=>node.inert=value);
    loader.querySelector('.arrival-status').textContent='已进入 2027 星辰指引';
    resolveReady();window.dispatchEvent(new Event('arrivalcomplete'));
  }
  function release(){
    if(releasing||finished)return;releasing=true;target=100;
    const minimum=reduced.matches?120:1500;
    releaseTimer=setTimeout(()=>{
      displayed=100;number.textContent='100';bar.setAttribute('aria-valuenow','100');
      loader.classList.add('is-revealing');releaseTimer=setTimeout(restore,reduced.matches?120:900);
    },Math.max(0,minimum-(performance.now()-started)));
  }
  const firstPaint=new Promise(resolve=>window.addEventListener('galleryfirstframe',()=>{mark('scene',25);resolve();},{once:true}));
  document.addEventListener('load',event=>{
    const node=event.target;
    if(node instanceof HTMLScriptElement&&node.src&&!node.src.endsWith('/arrival.js')){scriptMarks++;mark(node.src,5);}
  },true);
  document.addEventListener('DOMContentLoaded',async()=>{
    document.querySelectorAll('.header,#home-content,#route-content,.music-dock,#project-dialog').forEach(node=>{inertState.set(node,node.inert);node.inert=true;});
    mark('document',10);mark('parsed scripts',Math.max(0,30-scriptMarks*5));
    const images=[...document.querySelectorAll('.screen-art img')];
    const imagesReady=Promise.allSettled(images.map(img=>img.decode())).then(()=>mark('art',20));
    const fontsReady=document.fonts.ready.then(()=>mark('type',10));
    await Promise.all([firstPaint,imagesReady,fontsReady]);release();
  },{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else if(!finished&&!frame)frame=requestAnimationFrame(render);});
  const failsafe=setTimeout(release,8500);
  const wheel=document.createElementNS('http://www.w3.org/2000/svg','g');wheel.classList.add('arrival-zodiac-wheel');
  ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'].forEach((symbol,i)=>{const angle=i*Math.PI/6-Math.PI/2;const glyph=document.createElementNS('http://www.w3.org/2000/svg','text');glyph.setAttribute('x',String(Math.cos(angle)*125));glyph.setAttribute('y',String(Math.sin(angle)*125+4));glyph.setAttribute('text-anchor','middle');glyph.setAttribute('fill','#a3c5dd');glyph.setAttribute('font-size','10');glyph.setAttribute('opacity','.55');glyph.setAttribute('font-family','DejaVu Sans, Segoe UI Symbol, sans-serif');glyph.textContent=symbol+'\ufe0e';wheel.append(glyph);});loader.querySelector('svg').append(wheel);
  drawContours(0);mark('arrival',5);
})();
