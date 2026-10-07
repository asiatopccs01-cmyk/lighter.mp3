(() => {
  'use strict';
  const root=document.querySelector('.hero'),host=document.querySelector('.gl-world');
  const gallery=document.querySelector('.glass-gallery');
  const screens=[...document.querySelectorAll('.floating-screen')],track=document.querySelector('.scroll-track');
  const opening=document.querySelector('.journey-opening'),ending=document.querySelector('.journey-ending');
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const start=-.95,finish=7.15,pitch=3.8,turn=.94;
  const journeyStretch=pitch/3.2;
  let width=root.clientWidth||innerWidth,height=root.clientHeight||innerHeight;
  let step=height*1.24,targetProgress=start,progress=start,commandIndex=null,activeIndex=-1;
  let frame=0,time=0,lastTime=0,entrance=reduceMotion.matches?1:0;
  let pointer={x:0,y:0},initializationAttempted=false;
  let focus=0,targetFocus=0,renderer,scene,camera,structure,particles,shader;
  let key,rim,cool,firstFrame=false;
  let cssRenderer,cssScene,cssCamera,cssObjects=[];
  let tour=null;const tourControl=document.querySelector('.tour-control');
  let navigationFrame=0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a),0,1);return x*x*(3-2*x);};
  const palette=Cosmos.colors.map(row=>[...row.map(color=>color.split(',').map(Number)),[246,218,162]]);
  function updatePalette(){
    const position=clamp(progress,0,6),index=Math.floor(position),next=Math.min(index+1,6),blend=smooth(0,1,position-index);
    const colors=palette[index].map((color,j)=>color.map((value,k)=>Math.round(value+(palette[next][j][k]-value)*blend)));
    ['primary','secondary','accent'].forEach((name,i)=>root.style.setProperty('--scene-'+name,colors[i].join(',')));
    if(key){[key,rim,cool].forEach((light,i)=>light.color.setRGB(...colors[i].map(value=>value/255)));}
    if(shader){['uPrimary','uSecondary','uAccent'].forEach((name,i)=>shader.uniforms[name].value.setRGB(...colors[i].map(value=>value/255)));}
  }
  if(window.THREE){
    camera=new THREE.PerspectiveCamera(38,width/height,.1,90);
    if(THREE.CSS3DRenderer){
      cssRenderer=new THREE.CSS3DRenderer();cssRenderer.domElement.className='helix-dom';
      gallery.append(cssRenderer.domElement);cssScene=new THREE.Scene();cssCamera=new THREE.PerspectiveCamera();
      cssObjects=screens.map(element=>{const object=new THREE.CSS3DObject(element);cssScene.add(object);return object;});
    }
  }
  function readScroll(){targetProgress=clamp(scrollY/step+start,start,finish);if(commandIndex!==null&&Math.abs(targetProgress-commandIndex)<.003)commandIndex=null;}
  function updateCamera(){
    if(!camera)return;
    const mobile=width<700,radius=mobile?3.15:3.7;
    const intro=1-smooth(start,-.02,progress),outro=smooth(6.1,finish,progress);
    const angle=progress*turn+pointer.x*.045+(1-entrance)*.16*intro;
    const distance=radius+(mobile?13.2:9.5)+intro*4.8+outro*4.3-focus*1.2+(1-entrance)*3*intro;
    const y=-progress*pitch+intro*1.1-outro*.6;
    camera.position.set(Math.sin(angle)*distance,y+.45+pointer.y*.16,Math.cos(angle)*distance);
    camera.up.set(0,1,0);camera.lookAt(0,y+(mobile?-.45:.25),0);
    camera.rotateZ(-.14-Math.sin(progress*.45)*.065+outro*.09);
    camera.updateMatrixWorld();
  }
  function updateCover(node,opacity,offset){
    node.style.opacity=String(opacity);node.style.transform=`translate3d(0,${offset}px,0)`;
    node.style.visibility=opacity>.002?'visible':'hidden';node.style.pointerEvents=opacity>.5?'auto':'none';
    node.inert=opacity<.5;node.setAttribute('aria-hidden',String(opacity<.5));
  }
  function updateScreens(){
    const mobile=width<700,current=clamp(Math.round(progress),0,screens.length-1),radius=mobile?3.15:3.7;
    const intro=1-smooth(-.65,-.03,progress),outro=smooth(6.35,finish,progress);
    updateCover(opening,intro,(-progress+start)*100);updateCover(ending,outro,(1-outro)*65);
    root.dataset.phase=progress<-.25?'arrival':progress>6.45?'horizon':'gallery';
    for(let i=0;i<screens.length;i++){
      const screen=screens[i],relative=i-progress,distance=Math.abs(relative);
      const visible=distance<2.15;
      screen.style.visibility=visible?'visible':'hidden';screen.style.pointerEvents=distance<.75&&progress>-.3&&outro<.25?'auto':'none';
      const fade=1-smooth(.4,2.15,distance);
      screen.style.opacity=String(.98*fade*(1-outro*.9));
      screen.style.zIndex=String(10-Math.round(distance*3));screen.tabIndex=i===current&&progress>-.3&&outro<.25?0:-1;
      screen.setAttribute('aria-hidden',String(!visible||intro>.8||outro>.5));screen.classList.toggle('is-front',i===current);
      screen.setAttribute('aria-label',(i===current?'进入':'转向')+worldNames[i]);
      if(cssRenderer){
        const object=cssObjects[i],angle=i*turn;
        object.position.set(Math.sin(angle)*radius*100,-i*pitch*100,Math.cos(angle)*radius*100);
        object.rotation.set(-.055,angle+.035,Math.sin(i*.7)*.022);
        object.scale.setScalar((mobile?3.25:5.7)*100/Math.max(screen.clientWidth,1));object.visible=visible;
      }else{
        const angle=relative*turn;
        screen.style.transform=`translate(-50%,-50%) translate3d(${Math.sin(angle)*width*.49}px,${relative*height*.48}px,${(Math.cos(angle)-1)*700}px) rotateY(${-angle*48}deg) rotateZ(9deg)`;
      }
    }
    if(cssRenderer){cssCamera.copy(camera);cssCamera.position.multiplyScalar(100);cssCamera.updateMatrixWorld();cssRenderer.render(cssScene,cssCamera);}
    const normalized=(progress-start)/(finish-start);root.style.setProperty('--journey-progress',String(normalized));
    const handle=root.querySelector('.timeline-handle');if(handle)handle.style.top=`${4+normalized*92}%`;
    if(current!==activeIndex){activeIndex=current;updateWorldUI(current);root.querySelectorAll('.timeline-dot').forEach((dot,i)=>{dot.classList.toggle('selected',i===current);if(i===current)dot.setAttribute('aria-current','step');else dot.removeAttribute('aria-current');});window.dispatchEvent(new CustomEvent('galleryscenechange',{detail:{index:current}}));}
  }
  function invalidate(){if(!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
  function stopTour(){tour=null;tourControl.hidden=true;}
  function startTour(duration=44000){
    if(reduceMotion.matches){goTo(0);return;}
    goTo(start,{immediate:true});tour={started:performance.now(),elapsed:0,duration:clamp(duration,1000,90000),paused:false};
    tourControl.hidden=false;tourControl.textContent='暂停漫游 Ⅱ';invalidate();
  }
  function toggleTour(){
    if(!tour)return;tour.paused=!tour.paused;
    if(!tour.paused)tour.started=performance.now()-tour.elapsed;
    tourControl.textContent=tour.paused?'继续漫游 ▶':'暂停漫游 Ⅱ';invalidate();
  }
  function goTo(index,{immediate=false}={}){
    stopTour();
    index=clamp(index,start,finish);commandIndex=index;
    cancelAnimationFrame(navigationFrame);navigationFrame=0;
    if(immediate||reduceMotion.matches){scrollTo({top:(index-start)*step,behavior:'instant'});readScroll();progress=targetProgress;updateCamera();updatePalette();updateScreens();}
    else {scrollTo({top:scrollY,behavior:'instant'});navigationFrame=requestAnimationFrame(()=>{navigationFrame=0;scrollTo({top:(index-start)*step,behavior:'smooth'});});}
    invalidate();
  }
  function scrub(value){stopTour();cancelAnimationFrame(navigationFrame);navigationFrame=0;commandIndex=null;scrollTo({top:(clamp(value,start,finish)-start)*step,behavior:'instant'});readScroll();invalidate();}
  window.SpatialGallery={goTo,scrub,startTour,toggleTour,getTargetIndex:()=>commandIndex??clamp(Math.round(targetProgress),-1,7),setFocus:value=>{if(value&&tour&&!tour.paused)toggleTour();targetFocus=value?1:0;invalidate();},getState:()=>({progress,targetProgress,index:activeIndex,step,start,finish,count:screens.length,phase:root.dataset.phase,tour:tour?{paused:tour.paused,elapsed:tour.elapsed}:null,camera:camera?{x:camera.position.x,y:camera.position.y,z:camera.position.z,roll:camera.rotation.z}:null,drawCalls:renderer?.info.render.calls??0,triangles:renderer?.info.render.triangles??0,renderer:!!renderer,css3D:!!cssRenderer,paused:!skyPlaying,focus})};
  function openScreen(index){if(Math.abs(progress-index)>.42){goTo(index);return;}window.LighterRoutes.openFrame(index);}
  screens.forEach((screen,index)=>{screen.addEventListener('click',()=>openScreen(index));screen.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openScreen(index);}});});
  window.addEventListener('scroll',()=>{readScroll();invalidate();},{passive:true});
  function manualInput(event){if(event.type==='touchstart'&&event.target.closest('.tour-control'))return;stopTour();cancelAnimationFrame(navigationFrame);navigationFrame=0;commandIndex=null;}
  root.addEventListener('wheel',manualInput,{passive:true});root.addEventListener('touchstart',manualInput,{passive:true});
  window.addEventListener('keydown',event=>{if(['PageDown','PageUp','Home','End'].includes(event.key))stopTour();});
  function bakeSculpture(group,material){
    group.updateMatrixWorld(true);const geometries=[];
    group.traverse(node=>{if(!node.isMesh)return;const geometry=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();geometry.applyMatrix4(node.matrixWorld);
      if(node.matrixWorld.determinant()<0){for(const attribute of Object.values(geometry.attributes)){for(let i=0;i<attribute.count;i+=3){for(let component=0;component<attribute.itemSize;component++){const a=(i+1)*attribute.itemSize+component,b=(i+2)*attribute.itemSize+component,value=attribute.array[a];attribute.array[a]=attribute.array[b];attribute.array[b]=value;}}}}
      geometries.push(geometry);
    });
    const count=geometries.reduce((sum,geometry)=>sum+geometry.attributes.position.count,0);
    const positions=new Float32Array(count*3),normals=new Float32Array(count*3);let offset=0;
    geometries.forEach(geometry=>{positions.set(geometry.attributes.position.array,offset);normals.set(geometry.attributes.normal.array,offset);offset+=geometry.attributes.position.array.length;geometry.dispose();});
    const merged=new THREE.BufferGeometry();merged.setAttribute('position',new THREE.BufferAttribute(positions,3));merged.setAttribute('normal',new THREE.BufferAttribute(normals,3));merged.computeBoundingSphere();
    while(group.children.length)group.remove(group.children[0]);group.add(new THREE.Mesh(merged,material));
  }
  function environmentTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const context = canvas.getContext('2d');
    const base = context.createLinearGradient(0, 0, 0, 256);
    base.addColorStop(0, '#d5e4fa'); base.addColorStop(.24, '#46677f');
    base.addColorStop(.48, '#101322');base.addColorStop(.7, '#a77acc'); base.addColorStop(1, '#e1b9a0');
    context.fillStyle = base; context.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 5; i++) {
      const glow = context.createRadialGradient(i * 115 + 20, 110, 0, i * 115 + 20, 110, 85);
      glow.addColorStop(0, ['#75d9f0','#af88ee','#ef99bc','#e6be85','#a8e9da'][i]); glow.addColorStop(1, '#06152c00');
      context.fillStyle = glow; context.fillRect(0, 0, 512, 256);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function initialize() {
    if (initializationAttempted || !width || !height) return;
    initializationAttempted = true;
    try {
      if (!window.THREE) throw new Error('Renderer unavailable');
      renderer = new THREE.WebGLRenderer({alpha: true, antialias: width >= 700, powerPreference: 'low-power'});
      renderer.setPixelRatio(pixelRatio());
      renderer.setSize(width, height);
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      host.append(renderer.domElement);
      scene = new THREE.Scene();
      updateCamera();
      const env = environmentTexture();
      const generator = new THREE.PMREMGenerator(renderer);
      scene.environment = generator.fromEquirectangular(env).texture;
      env.dispose(); generator.dispose();
      scene.add(new THREE.AmbientLight('#6f688f', .35));
      key = new THREE.DirectionalLight('#8edcff', 1.45); key.position.set(-2, 4, 5); scene.add(key);
      rim = new THREE.DirectionalLight('#bb80ff', 1.9); rim.position.set(3, -2, 1); scene.add(rim);
      cool = new THREE.DirectionalLight('#f6cb93', 1.1);cool.position.set(-3,-1,-2);scene.add(cool);
      structure = new THREE.Group();
      scene.add(structure);
      const material = new THREE.MeshStandardMaterial({color: '#c4c6d3', metalness: 1, roughness: .19, envMapIntensity: 1.55, transparent: true, opacity: .42, side: THREE.DoubleSide});
      // Astrolabes along one continuous descending orbit; one merged mesh.
      const ringGeometry=new THREE.TorusGeometry(.92,.025,6,64);
      const outerGeometry=new THREE.TorusGeometry(1.26,.014,5,72);
      const starGeometry=new THREE.OctahedronGeometry(.18,0);
      const beadGeometry=new THREE.SphereGeometry(.055,8,6);
      for(let i=0;i<9;i++){
        const constellation=new THREE.Group();constellation.position.y=3.2-i*3.2;
        constellation.rotation.y=i*.56;
        for(let branch=0;branch<3;branch++){const ring=new THREE.Mesh(branch===2?outerGeometry:ringGeometry,material);ring.rotation.set(.44+branch*.84,i*.21,branch*.64);constellation.add(ring);}
        const star=new THREE.Mesh(starGeometry,material);star.rotation.set(.4,i*.35,.35);constellation.add(star);
        for(let j=0;j<4;j++){const bead=new THREE.Mesh(beadGeometry,material);const angle=j*Math.PI/2+i*.33;bead.position.set(Math.sin(angle)*1.26,Math.cos(angle)*1.26,0);constellation.add(bead);}
        structure.add(constellation);
      }
      const strands=[];
      for(let branch=0;branch<2;branch++){const curve=[];for(let i=0;i<=100;i++){const y=4-i*.285,angle=i*.165+branch*Math.PI;curve.push(new THREE.Vector3(Math.sin(angle)*.5,y,Math.cos(angle)*.5));}const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(curve),160,.016,6,false);strands.push(geometry);structure.add(new THREE.Mesh(geometry,material));}
      const haloGeometry=new THREE.TorusGeometry(1.02,.035,6,72);const halo=new THREE.Mesh(haloGeometry,material);halo.position.set(0,-24.3,0);halo.rotation.y=finish*turn;structure.add(halo);
      bakeSculpture(structure,material);structure.scale.y=journeyStretch;
      [ringGeometry,outerGeometry,starGeometry,beadGeometry,haloGeometry,...strands].forEach(geometry=>geometry.dispose());
      const count = width < 700 ? 6500 : 16000;
      const position = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      let randomState = 1827;
      const random = () => {randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296;};
      for (let i = 0; i < count; i++) {
        const angle = random() * Math.PI * 2;
        const branch = random();
        let radius, y, z;
        y=(5-random()*33)*journeyStretch;
        if(branch<.65){radius=.9+random()*1.7;z=Math.sin(angle+y*.16)*radius;}
        else {radius=3+random()*5;z=Math.sin(angle)*radius;}
        position[i*3]=Math.cos(angle+(branch<.65?y*.16:0))*radius;
        position[i*3+1]=y;
        position[i*3+2]=z;
        seeds[i] = random();
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
      geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
      shader = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {uTime: {value: 0}, uRotation: {value: 0}, uTravel: {value: start}, uPixel: {value: renderer.getPixelRatio()},uPrimary:{value:new THREE.Color()},uSecondary:{value:new THREE.Color()},uAccent:{value:new THREE.Color()}},
        vertexShader: `attribute float seed;uniform float uTime;uniform float uTravel;uniform float uRotation;uniform float uPixel;varying float vSeed;varying float vLight;
          void main(){vec3 p=position;float angle=uRotation+uTime*.065;float c=cos(angle);float s=sin(angle);p.xz=mat2(c,-s,s,c)*p.xz;
          p.y+=sin(uTime*.35+seed*31.4)*.065;vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
          gl_PointSize=clamp((2.0+seed*6.0)*uPixel*9.0/max(1.0,-mv.z),1.0,8.0);vSeed=seed;vLight=(.35+.65*pow(.5+.5*sin(uTime*(.65+seed)+seed*40.0),2.0))*(.45+.55*exp(-abs(p.y+uTravel*${pitch.toFixed(1)})*.12));}`,
        fragmentShader: `uniform vec3 uPrimary;uniform vec3 uSecondary;uniform vec3 uAccent;varying float vSeed;varying float vLight;void main(){float d=length(gl_PointCoord-.5)*2.0;if(d>1.0)discard;
          float a=pow(1.0-d,1.6)*vLight;vec3 col=mix(uPrimary,uSecondary,smoothstep(.1,.7,vSeed));col=mix(col,uAccent,step(.76,vSeed));col=mix(col,vec3(.96,.95,1.0),step(.93,vSeed));gl_FragColor=vec4(col,a);}`
      });
      particles = new THREE.Points(geometry, shader);scene.add(particles);
      root.classList.add('has-gl-world');
      renderer.domElement.addEventListener('webglcontextlost', event => {
        event.preventDefault(); cancelAnimationFrame(frame); frame = 0;
        root.classList.remove('has-gl-world');root.classList.add('gl-fallback');
      });
      renderer.domElement.addEventListener('webglcontextrestored', () => {
        root.classList.remove('gl-fallback');root.classList.add('has-gl-world');updateScreens();syncAnimation();
      });
      updateScreens();syncAnimation();
    } catch {
      if (renderer) renderer.dispose();renderer = undefined;
      host.replaceChildren();root.classList.add('gl-fallback');
    }
  }

  function draw(now){
    frame=0;if(document.hidden)return;
    const delta=lastTime?Math.min((now-lastTime)/1000,1):1/60;lastTime=now;
    if(tour&&!tour.paused){
      tour.elapsed=now-tour.started;const u=clamp(tour.elapsed/tour.duration,0,1),position=start+(finish-start)*smooth(0,1,u);
      scrollTo({top:(position-start)*step,behavior:'instant'});if(u===1)stopTour();
    }
    readScroll();
    const ease=reduceMotion.matches?1:1-Math.exp(-delta*8);
    progress+=(targetProgress-progress)*ease;if(Math.abs(targetProgress-progress)<.0001)progress=targetProgress;
    focus+=(targetFocus-focus)*ease;
    entrance=reduceMotion.matches||!skyPlaying?1:entrance+(1-entrance)*(1-Math.exp(-delta*.9));
    if(skyPlaying&&!reduceMotion.matches)time+=Math.min(delta,.05);
    updateCamera();updatePalette();updateScreens();
    if(renderer){
      const outro=smooth(6.1,finish,progress);
      // Keep the opening's text and constellation maps clear; reveal the sculpture as the camera descends.
      structure.children[0].material.opacity=.42+.58*smooth(start,-.03,progress);
      structure.rotation.y=Math.sin(time*.12)*.04;structure.position.set(0,0,0);structure.rotation.z=0;
      shader.uniforms.uTime.value=time;shader.uniforms.uTravel.value=progress;
      shader.uniforms.uRotation.value=Math.sin(time*.08)*.02;
      renderer.toneMappingExposure=1.03+outro*.15;renderer.render(scene,camera);
    }
    if(!firstFrame){firstFrame=true;window.dispatchEvent(new Event('galleryfirstframe'));}
    if(window.ArrivalGate?.active)return;
    if((tour&&!tour.paused)||(skyPlaying&&!reduceMotion.matches)||Math.abs(targetProgress-progress)>.0001||Math.abs(targetFocus-focus)>.0001)invalidate();
  }
  function syncAnimation(){cancelAnimationFrame(frame);frame=0;lastTime=0;invalidate();}
  document.addEventListener('visibilitychange',syncAnimation);reduceMotion.addEventListener('change',syncAnimation);skyToggle.addEventListener('click',syncAnimation);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&tour&&!tour.paused)toggleTour();});
  reduceMotion.addEventListener('change',()=>{if(reduceMotion.matches)stopTour();});
  skyToggle.addEventListener('click',()=>{if(!skyPlaying&&tour&&!tour.paused)toggleTour();});
  root.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||reduceMotion.matches||!skyPlaying)return;const box=root.getBoundingClientRect();pointer={x:(event.clientX-box.left)/box.width-.5,y:.5-(event.clientY-box.top)/box.height};invalidate();},{passive:true});
  root.addEventListener('pointerleave',()=>{pointer={x:0,y:0};invalidate();});
  function pixelRatio(){return Math.min(devicePixelRatio||1,width<700?1:1.2,Math.sqrt(950000/(width*height)));}
  function resize(){
    if(!root.clientWidth||!root.clientHeight)return;
    const previousStep=step,previousProgress=scrollY/previousStep+start;
    width=root.clientWidth;height=root.clientHeight;step=height*(width<700?1.3:1.45);
    track.style.height=`${step*(finish-start)+innerHeight}px`;
    if(Math.abs(previousStep-step)>.1)scrollTo({top:(previousProgress-start)*step,behavior:'instant'});
    if(camera){camera.aspect=width/height;camera.updateProjectionMatrix();}
    if(cssRenderer)cssRenderer.setSize(width,height);
    if(!initializationAttempted)initialize();
    if(renderer){renderer.setPixelRatio(pixelRatio());renderer.setSize(width,height);shader.uniforms.uPixel.value=renderer.getPixelRatio();}
    readScroll();if(reduceMotion.matches)progress=targetProgress;updateCamera();updatePalette();updateScreens();invalidate();
  }
  new ResizeObserver(resize).observe(root);window.addEventListener('resize',resize,{passive:true});
  window.ArrivalGate?.ready.then(syncAnimation);
  resize();window.dispatchEvent(new Event('galleryready'));
})();
