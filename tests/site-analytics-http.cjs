const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const guest=await browser.newContext({extraHTTPHeaders:{Origin:base}});
 const staff=await browser.newContext({extraHTTPHeaders:{Origin:base}});
 try{
  assert.equal((await guest.request.get(base+'/api/site-analytics')).status(),403);
  const login=await staff.request.post(base+'/api/users/login',{data:{username:process.env.TEST_ADMIN_USERNAME,password:process.env.TEST_ADMIN_PASSWORD}});assert.equal(login.status(),200);
  const before=await (await staff.request.get(base+'/api/site-analytics?days=7')).json();
  const body={event:'pageview',path:'/',source:'google'};
  const normalAgent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142.0.0.0 Safari/537.36';
  for(const headers of [{DNT:'1'},{'Sec-GPC':'1'}])assert.equal((await guest.request.post(base+'/api/site-analytics',{data:body,headers:{...headers,'User-Agent':normalAgent}})).status(),204);
  for(const path of ['/admin','/workspace-preview','/api/users','/made-up-page'])assert.equal((await guest.request.post(base+'/api/site-analytics',{data:{...body,path},headers:{'User-Agent':normalAgent}})).status(),204);
  assert.equal((await guest.request.post(base+'/api/site-analytics',{data:body,headers:{Origin:'https://untrusted.example.invalid'}})).status(),403);
  assert.equal((await guest.request.post(base+'/api/site-analytics',{data:'null',headers:{'Content-Type':'application/json','User-Agent':normalAgent}})).status(),400);
  assert.equal((await guest.request.post(base+'/api/site-analytics',{data:{...body,path:'/?patient=private'},headers:{'User-Agent':normalAgent}})).status(),400);
  assert.equal((await staff.request.post(base+'/api/site-analytics',{data:body,headers:{'User-Agent':normalAgent}})).status(),204);
  const after=await(await staff.request.get(base+'/api/site-analytics?days=7')).json();assert.equal(after.views,before.views);assert.equal(after.visitorDays,before.visitorDays);
  const page=await staff.newPage();await page.goto(base+'/admin/analytics');await page.getByRole('heading',{name:'Website analytics'}).waitFor();
  await page.getByLabel('Period').selectOption('90');await page.getByRole('button',{name:'Refresh'}).waitFor();
  fs.mkdirSync('.cache/admin-qa',{recursive:true});
  await page.screenshot({path:'.cache/admin-qa/analytics-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'.cache/admin-qa/analytics-mobile.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const publicPage=await guest.newPage();await publicPage.goto(base);assert.equal(await publicPage.locator('footer a[href="/admin"]').count(),1);await publicPage.getByRole('button',{name:'Let’s talk',exact:false}).waitFor();
  assert.ok((await publicPage.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'));
  const chatOpened=publicPage.waitForRequest(request=>new URL(request.url()).pathname==='/api/site-analytics'&&request.postDataJSON()?.event==='chat_open');
  await publicPage.getByRole('button',{name:'Let’s talk',exact:false}).click();
  assert.equal((await chatOpened).postDataJSON().path,'/');
  await publicPage.locator('.clinic-chat-toggle').click();
  const appointmentClicked=publicPage.waitForRequest(request=>new URL(request.url()).pathname==='/api/site-analytics'&&request.postDataJSON()?.event==='appointment_click');
  await publicPage.getByRole('button',{name:'Request an Appointment',exact:true}).first().click();
  assert.equal((await appointmentClicked).postDataJSON().path,'/');
  console.log('PASS analytics authentication, privacy controls, staff/bot/private-route exclusion, dashboard periods, responsive layout, footer login, public chat and noindex.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
