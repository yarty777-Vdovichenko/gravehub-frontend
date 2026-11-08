import assert from 'node:assert/strict';
import {build} from 'esbuild';
import axios from 'axios';
import {mkdir,rm} from 'node:fs/promises';
await mkdir('.test-tmp',{recursive:true});
await build({entryPoints:['src/new-api.ts'],outfile:'.test-tmp/api.mjs',bundle:true,platform:'node',format:'esm',external:['axios'],define:{'import.meta.env.VITE_API_URL':'"https://api.test"'}});
const requests=[];
axios.defaults.adapter=async c=>{requests.push(c);assert.equal(c.withCredentials,true);return {data:c.url==='/employees'?{items:[],meta:{page:2,limit:10,total:0,pages:0}}:c.url?.endsWith('/reserve')?{plotId:'plot',reservedUntil:new Date(Date.now()+600000).toISOString()}: {},status:200,statusText:'OK',headers:{},config:c}};
try{
const {newApi}=await import('../.test-tmp/api.mjs');
const page=await newApi.employees({search:'Тест',page:2,limit:10,sortBy:'completedContracts',order:'desc'});assert.equal(page.meta.pages,0);assert.equal(requests.at(-1).params.page,2);
await newApi.reserve('plot');assert.equal(requests.at(-1).url,'/plots/plot/reserve');assert.equal(requests.at(-1).data,undefined);
await newApi.release('plot');assert.equal(requests.at(-1).method,'delete');
await newApi.credit('plot',12,100);assert.deepEqual(requests.at(-1).params,{months:12,downPayment:100});
await newApi.purchase('plot',{paymentType:'full'});assert.deepEqual(JSON.parse(requests.at(-1).data),{paymentType:'full'});
await newApi.purchase('plot',{paymentType:'credit',months:24,downPayment:100});assert.deepEqual(JSON.parse(requests.at(-1).data),{paymentType:'credit',months:24,downPayment:100});
console.log('PASS: employee meta pagination, credentials, reservation methods and exact purchase/credit payloads');
}finally{await rm('.test-tmp',{recursive:true,force:true})}
