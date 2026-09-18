import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base=process.argv[2]||"http://127.0.0.1:3001";
let cookie="";
async function request(url,method="GET",data,admin=false,token){const response=await fetch(base+url,{method,headers:{...(data?{"Content-Type":"application/json"}:{}),...(admin?{Cookie:cookie}:{}),...(token?{"x-order-token":token}:{})},body:data?JSON.stringify(data):undefined});const result=await response.json();assert.equal(response.status,200,`${method} ${url}: ${JSON.stringify(result)}`);return {response,result};}
const health=await request("/api/health");assert.equal(health.result.ok,true);
const login=await request("/api/auth/login","POST",{username:process.env.ADMIN_USERNAME||"admin",password:process.env.ADMIN_PASSWORD||"demo-2026"});cookie=login.response.headers.get("set-cookie").split(";")[0];
assert.equal((await fetch(base+"/api/dashboard")).status,401);
const {result:products}=await request("/api/products");const product=products.find(p=>p.variants.some(v=>v.stock>0));assert.ok(product);const variant=product.variants.find(v=>v.stock>0);
const token=randomUUID()+randomUUID(),payload={idempotencyKey:randomUUID(),queryToken:token,items:[{variantId:variant.id,quantity:1}],address:{name:"Deployment demo verification",email:"deployment@example.com",phone:"0000000000",region:"CN",city:"Demo city",street:"Demo address",postalCode:"000000"}};
const {result:order}=await request("/api/orders","POST",payload);const duplicate=await request("/api/orders","POST",payload);assert.equal(duplicate.result.id,order.id);
assert.equal((await fetch(base+`/api/orders?id=${order.id}`)).status,404);
await request("/api/orders","PATCH",{id:order.id,action:"pay"},false,token);await request("/api/orders","PATCH",{id:order.id,action:"pay"},false,token);
await request("/api/orders","PATCH",{id:order.id,action:"ship",carrier:"Demo Logistics",tracking:"DEPLOYMENT-DEMO"},true);
const shipped=await request(`/api/orders?id=${order.id}`,"GET",undefined,false,token);assert.equal(shipped.result.status,"shipped");assert.equal(shipped.result.tracking,"DEPLOYMENT-DEMO");
await request("/api/orders","PATCH",{id:order.id,action:"refund"},true);const restored=await request(`/api/products?id=${product.id}`);assert.equal(restored.result.variants.find(v=>v.id===variant.id).stock,variant.stock);
const inquiry=await request("/api/inquiries","POST",{name:"Deployment demo verification",email:"deployment@example.com",message:"Deployment smoke test. Demo only; no response required."});await request("/api/inquiries","PUT",{id:inquiry.result.id,status:"Closed",note:"Deployment verified"},true);
await request("/api/auth/logout","POST",undefined,true);assert.equal((await fetch(base+"/api/dashboard",{headers:{Cookie:cookie}})).status,401);
console.log(JSON.stringify({ok:true,base,products:products.length,demoOrder:order.number,workflow:"created -> paid -> shipped -> refunded",stockRestored:true,inquiry:"closed",sessionRevoked:true}));
