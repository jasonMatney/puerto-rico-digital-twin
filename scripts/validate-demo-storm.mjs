import assert from 'node:assert/strict';
import {stormFrame,demoStatus} from '../lib/demo-storm.ts';
assert.equal(stormFrame(-10).hour,0);assert.equal(stormFrame(99).hour,24);assert.equal(stormFrame(NaN).hour,0);
assert.equal(stormFrame(7.99).phase,'approach');assert.equal(stormFrame(8).phase,'peak');assert.equal(stormFrame(16).phase,'recovery');
assert(stormFrame(12).rain>stormFrame(0).rain);assert(stormFrame(24).rain<stormFrame(12).rain);
assert(stormFrame(12).wind>stormFrame(0).wind);assert(stormFrame(24).wind<stormFrame(12).wind);
for(let t=0;t<=24;t+=.1){const s=stormFrame(t);assert(s.rain>=0&&s.rain<=75);assert(s.wind>=20&&s.wind<=128);assert(s.direction>=0&&s.direction<=360);for(const n of [6,31]){const counts={online:0,standby:0,offline:0};for(let i=0;i<n;i++)counts[demoStatus(i,t)]++;assert.equal(Object.values(counts).reduce((a,b)=>a+b),n);}}
assert.equal(demoStatus(0,12),'offline');assert.notEqual(demoStatus(0,24),'offline');
console.log('PASS: bounded fictional values, stage transitions, storm peak/recovery and facility totals for both municipalities.');
