const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'chrome'});
 const page = await browser.newPage();
 try {
  for(const {width,height} of [{width:390,height:700},{width:768,height:900},{width:1440,height:900}]) {
   await page.setViewportSize({width,height});
   await page.goto('http://127.0.0.1:3000');
   const initial = await page.locator('.hero').boundingBox();
   await page.evaluate(()=>window.scrollTo({top:400,behavior:'instant'}));
   await page.waitForTimeout(700);
   const hero=await page.locator('.hero').boundingBox();
   const about=await page.locator('#about').boundingBox();
   assert.ok(Math.abs(hero.y-Math.min(0,height-760))<1,'hero remains pinned');
   assert.ok(Math.abs(about.y-(initial.height-400))<1,'next section moves over hero');
   const covered = await page.evaluate(({y})=>document.elementFromPoint(2,y)?.closest('.home-content')!==null,{y:about.y+10});
   assert.ok(covered,'opaque next section covers hero including side margins');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===1440) await page.screenshot({path:'research/screenshots/hero-cover-desktop.png'});
   await page.locator('.header .wordmark').click();
   await page.waitForFunction(()=>scrollY<1);
   console.log('PASS pinned hero, full-width covering section, logo return',width,height);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.reload();
  assert.equal(await page.locator('.hero').evaluate(e=>getComputedStyle(e).position),'relative');
  console.log('PASS reduced-motion uses normal page scroll');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
