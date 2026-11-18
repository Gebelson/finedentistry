const { chromium }=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
  for(const width of [390,1440]) {
   await page.setViewportSize({width,height:900});
   await page.goto('http://127.0.0.1:3000');
   await page.waitForTimeout(1000);
   const panel=page.locator('.page-transition');
   const treatments=page.locator('footer a[href="/services"]').first();
   await treatments.click();
   assert.equal(await panel.getAttribute('data-phase'),'covering');
   assert.equal(new URL(page.url()).pathname,'/','old route stays visible during cover');
   await page.waitForURL('**/services');
   await page.waitForFunction(()=>document.querySelector('.page-transition').dataset.phase==='idle');
   assert.equal(await page.locator('#main').evaluate(e=>e===document.activeElement),true);
   const card=page.locator('.service-card').first();
   const target=await card.getAttribute('href');
   await card.focus();
   await page.keyboard.press('Enter');
   await page.waitForURL('**'+target);
   await page.waitForFunction(()=>document.querySelector('.page-transition').dataset.phase==='idle');
   await page.goBack();
   await page.waitForURL('**/services');
   assert.equal(await panel.getAttribute('data-phase'),'idle');
   await page.locator('.header .wordmark').click();
   await page.waitForURL('http://127.0.0.1:3000/');
   await page.waitForFunction(()=>document.querySelector('.page-transition').dataset.phase==='idle');
   await page.getByRole('link',{name:'Scroll to discover ↓'}).click();
   assert.equal(await panel.getAttribute('data-phase'),'idle','anchor does not animate');
   await page.locator('.header .wordmark').click();
   await page.waitForFunction(()=>scrollY<1);
   await page.locator('.hero-aside button').click();
   assert.equal(await page.locator('dialog[open]').count(),1);
   assert.equal(await panel.getAttribute('data-phase'),'idle','booking button unchanged');
   await page.keyboard.press('Escape');
   await page.emulateMedia({reducedMotion:'reduce'});
   await treatments.click();
   await page.waitForURL('**/services');
   assert.equal(await panel.getAttribute('data-phase'),'idle');
   await page.emulateMedia({reducedMotion:'no-preference'});
   console.log('PASS cover/reveal, click/keyboard routing, back, logo, anchor, booking, reduced motion',width);
  }
  assert.deepEqual(errors,[]);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
