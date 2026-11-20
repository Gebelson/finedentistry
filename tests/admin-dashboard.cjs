const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const base=process.env.TEST_URL||'http://localhost:3000';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const context=await browser.newContext({extraHTTPHeaders:{Origin:base}});
  assert.equal((await context.request.post(base+'/api/users/login',{data:{username:process.env.TEST_ADMIN_USERNAME,password:process.env.TEST_ADMIN_PASSWORD}})).status(),200);
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/admin');
  await page.getByRole('heading',{name:'Dashboard',exact:true}).waitFor({timeout:5000});
  const counts=await(await context.request.get(base+'/api/posts?limit=1&where[_status][equals]=published')).json();
  assert.equal(Number(await page.locator('[data-metric="published-articles"]').innerText()),counts.totalDocs);
  assert.equal(await page.locator('.template-default').count(),1);
  await page.getByRole('heading',{name:'Website analytics',exact:true}).waitFor();
  await page.getByRole('img',{name:/Daily website activity/}).waitFor();
  assert.ok(await page.getByRole('link',{name:'New appointment',exact:true}).count());
  assert.equal(await page.locator('.ops-kpi').count(),4);
  assert.ok(await page.getByRole('link',{name:'Reception inbox',exact:true}).count());
  const changed=page.waitForResponse(response=>response.url().includes('/api/site-analytics?days=7'));
  await page.getByLabel('Period',{exact:true}).selectOption('7');assert.equal((await changed).status(),200);
  fs.mkdirSync('.cache/admin-qa',{recursive:true});
  for(const width of [1440,768,390]){
   await page.setViewportSize({width,height:1000});
   const toggle=page.locator(width>=1024?'.template-default__nav-toggler':'.app-header__mobile-nav-toggler');
   if(width<1024&&/^close/i.test(await toggle.getAttribute('aria-label')))await page.locator('.nav__mobile-close').click();
   await page.waitForFunction(()=>document.documentElement.scrollWidth<=innerWidth);
   assert.ok(await page.getByRole('heading',{name:'Dashboard',exact:true}).evaluate(el=>parseFloat(getComputedStyle(el).fontSize)<=32));
   await page.screenshot({path:`.cache/admin-qa/operational-dashboard-${width}.png`,fullPage:true});
  }
  await page.getByLabel('Period',{exact:true}).selectOption('30');
  const light=await page.locator('html').getAttribute('data-theme');assert.equal(light,'light');
  assert.deepEqual(errors,[]);console.log('PASS operational dashboard: actual published count, four KPIs, embedded chart/filter, working action links, compact heading, light theme, responsive layouts and no runtime errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
