const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage();
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 try {
  for(const size of [{width:320,height:568},{width:390,height:844},{width:430,height:932}]) {
   await page.setViewportSize(size);await page.goto('http://127.0.0.1:3000');
   await page.waitForFunction(()=>document.querySelector('#services').dataset.stackReady==='true');
   const m=await page.locator('#services').evaluate(e=>({start:e.querySelector('.treatment-stack-scroll').getBoundingClientRect().top+scrollY-92,step:e.querySelector('.services-stack').offsetHeight*1.3+64}));
   assert.equal(await page.locator('#services .section-label').isVisible(),false);
   for(const progress of [0,.1,.5,1,1.5,2.5,3.5,4.5,5,5.35]) {
    await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),m.start+m.step*progress);await settle();
    const s=await page.locator('#services').evaluate(e=>{const h=e.querySelector('.section-heading').getBoundingClientRect(),v=e.querySelector('.services-stack').getBoundingClientRect(),stage=e.querySelector('.treatment-stack-stage').getBoundingClientRect();return {h:h.top,hb:h.bottom,v:v.top,vb:v.bottom,gap:e.querySelector('.section-end').getBoundingClientRect().top-stage.bottom,overflow:getComputedStyle(e.querySelector('.services-stack')).overflow,shadow:getComputedStyle(e.querySelector('.service-card')).boxShadow}});
    assert.ok(s.h>=92&&s.h<=106,'fixed text below header');assert.ok(s.hb<s.v,'cards cannot cover text');
    assert.ok(s.vb<size.height,'card and caption fit');assert.ok(s.gap>0,'action row outside sticky area');
    assert.equal(s.overflow,'hidden');assert.equal(s.shadow,'none');
    if(progress===.1) assert.ok(await page.locator('#services .services-stack').evaluate(e=>e.children[1].getBoundingClientRect().top>e.getBoundingClientRect().bottom),'next card waits offscreen with a gap');
    if(progress===.5) assert.ok(await page.locator('#services .service-card').first().evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).a<.99),'previous card shrinks as next overlays');
    if(progress===.5) assert.ok(await page.locator('#services .service-card').first().evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).f>0),'previous card retreats downward as it shrinks');
    if(Number.isInteger(progress)) assert.ok(await page.locator('#services .services-stack').evaluate((e,index)=>e.children[index].querySelector('.service-category').getBoundingClientRect().bottom<e.getBoundingClientRect().bottom-10,progress),'settled category fully inside viewport');
    if(progress===1.5&&size.width===390){await page.waitForTimeout(900);await page.screenshot({path:'research/screenshots/mobile-treatment-stack-corrected.png'});}
   }
   const end=await page.locator('#services .section-end').evaluate(e=>e.getBoundingClientRect().top+scrollY);
   await page.evaluate(y=>scrollTo({top:y-350,behavior:'instant'}),end);await settle();
   assert.ok(await page.locator('#services').evaluate(e=>e.querySelector('.section-end').getBoundingClientRect().top>=e.querySelector('.treatment-stack-stage').getBoundingClientRect().bottom));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   console.log('PASS six cards, clipped overlap, fixed text and clean exit before final action',size.width,size.height);
  }
  await page.setViewportSize({width:1440,height:900});await page.goto('http://127.0.0.1:3000');
  assert.equal(await page.locator('#services .section-label').isVisible(),true);
  assert.notEqual(await page.locator('#services .treatment-stack-stage').evaluate(e=>getComputedStyle(e).position),'sticky');
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});await settle();
  assert.notEqual(await page.locator('#services .service-card').first().evaluate(e=>getComputedStyle(e).position),'absolute');
  await page.goto('http://127.0.0.1:3000/services');assert.equal(await page.locator('.service-card').count(),23);
  console.log('PASS desktop, reduced motion and full directory');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
