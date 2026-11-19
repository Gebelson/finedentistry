import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { createClient } from '@libsql/client';
import { spawnSync } from 'node:child_process';
if(!process.argv.includes('--worker')){
  const folder=await mkdtemp(path.join(tmpdir(),'fine-analytics-'));
  const result=spawnSync(process.execPath,['--import','tsx',process.argv[1],'--worker'],{stdio:'inherit',env:{...process.env,ANALYTICS_DATABASE_URI:'file:'+path.join(folder,'test.db').replaceAll('\\','/')}});
  await rm(folder,{recursive:true,force:true,maxRetries:5,retryDelay:100});
  process.exit(result.status??1);
}
process.env.ANALYTICS_SECRET=randomBytes(32).toString('hex');
const {recordSiteMetric,siteAnalyticsSummary,anonymousVisitorKey,closeAnalyticsStore}=await import('../lib/analytics-store.ts');
const {referralSource}=await import('../lib/analytics-types.ts');
const now=new Date('2026-11-19T18:00:00Z');
const base={event:'pageview',path:'/',source:'google',device:'mobile',country:'US',ip:'192.0.2.1',agent:'Test browser',now};
try{
  await Promise.all(Array.from({length:4},()=>recordSiteMetric(base)));
  await recordSiteMetric({...base,path:'/contact'});
  await recordSiteMetric({...base,event:'phone_click',path:'/contact'});
  await recordSiteMetric({...base,event:'heartbeat'});
  const summary=await siteAnalyticsSummary(7,now);
  assert.equal(summary.views,5);assert.equal(summary.visitorDays,1);assert.equal(summary.active,1);
  assert.equal(summary.conversions.find(row=>row.name==='phone_click').count,1);
  assert.equal(summary.pages.find(row=>row.name==='/').count,4);
  await recordSiteMetric({...base,now:new Date('2026-11-20T18:00:00Z')});
  assert.equal((await siteAnalyticsSummary(7,new Date('2026-11-20T18:00:00Z'))).visitorDays,2);
  assert.notEqual(anonymousVisitorKey('2026-11-19',base.ip,base.agent),anonymousVisitorKey('2026-11-20',base.ip,base.agent));
  assert.equal(referralSource('www.google.com'),'google');assert.equal(referralSource('evilgoogle.com'),'other');
  const client=createClient({url:process.env.ANALYTICS_DATABASE_URI});
  const records=JSON.stringify((await client.execute('SELECT * FROM site_analytics_visitors')).rows);
  assert.ok(!records.includes(base.ip)&&!records.includes(base.agent));
  const columns=(await client.execute('PRAGMA table_info(site_analytics_visitors)')).rows.map(row=>row.name);
  assert.deepEqual(columns,['day','visitor_key','first_seen','last_seen']);
  client.close();
  console.log('Analytics: atomic counts, daily estimates, conversions, referral matching and storage privacy passed.');
}finally{await closeAnalyticsStore();}
