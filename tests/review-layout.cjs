const { chromium } = require('playwright');
const { default:AxeBuilder } = require('@axe-core/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'chrome'});
 const context=await browser.newContext({reducedMotion:'reduce'});
 const page=await context.newPage();
 try {
  for(const width of [320,390,768,1440]) {
   await page.setViewportSize({width,height:1200});
   await page.goto('http://127.0.0.1:3000');
   const carousel=page.locator('.testimonials');
   await carousel.scrollIntoViewIfNeeded();
   const positions=[];
   for(let i=0;i<6;i++) {
    positions.push(await carousel.evaluate(e=>({controls:e.querySelector('.carousel-controls').getBoundingClientRect().top+scrollY,more:e.querySelector('.text-link').getBoundingClientRect().top+scrollY,author:e.querySelector('.review-attribution').getBoundingClientRect().top+scrollY})));
    assert.equal(await carousel.getByRole('img',{name:'5 out of 5 stars'}).count(),1);
    assert.equal(await carousel.locator('.review-stars svg').count(),5);
    assert.equal(await carousel.getByRole('blockquote').count(),1,'only current quote exposed to screen readers');
    assert.ok(await carousel.locator('.review-author-line').evaluate(e=>e.getBoundingClientRect().right<=innerWidth));
    await carousel.getByRole('button',{name:'Next patient story'}).click();
   }
   for(const position of positions) for(const key of ['controls','more','author']) assert.ok(Math.abs(position[key]-positions[0][key])<1,`${key} stays fixed at ${width}px`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===1440 || width===390) {
    await carousel.scrollIntoViewIfNeeded();
    await page.screenshot({path:`research/screenshots/reviews-fixed-stars-${width}.png`});
   }
   const result=await new AxeBuilder({page}).include('.testimonials').analyze();
   assert.deepEqual(result.violations.map(v=>v.id),[]);
   console.log('PASS all 6 reviews: stable author/arrows/read-more, inline 5 stars, accessible active quote, no overflow',width);
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
