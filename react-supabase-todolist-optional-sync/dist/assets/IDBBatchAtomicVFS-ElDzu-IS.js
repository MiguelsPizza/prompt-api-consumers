var Et=Object.defineProperty;var it=o=>{throw TypeError(o)};var bt=(o,e,t)=>e in o?Et(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var et=(o,e,t)=>bt(o,typeof e!="symbol"?e+"":e,t),st=(o,e,t)=>e.has(o)||it("Cannot "+t);var r=(o,e,t)=>(st(o,e,"read from private field"),t?t.call(o):e.get(o)),f=(o,e,t)=>e.has(o)?it("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(o):e.set(o,t),l=(o,e,t,s)=>(st(o,e,"write to private field"),s?s.call(o,t):e.set(o,t),t),R=(o,e,t)=>(st(o,e,"access private method"),t);var S,W,F,I,nt,ut,dt,X,j,G,b,J,O,M,tt,yt,E,P,N,k,y,K,B,_,x,m,at,wt,ft,T,gt;import{S as g,a as d,b as ot,c as ct,d as z,e as H,f as Y,h as pt,i as Z,j as St,k as kt,l as mt,m as Rt,n as xt,o as At,p as Dt,q as $t,r as Lt,s as vt}from"./index-BWjLG_JZ.js";class _t{constructor(){et(this,"mxPathName",64)}xClose(e){return g}xRead(e,t,s){return g}xWrite(e,t,s){return g}xTruncate(e,t){return g}xSync(e,t){return d}xFileSize(e,t){return g}xLock(e,t){return d}xUnlock(e,t){return d}xCheckReservedLock(e,t){return t.setInt32(0,0,!0),d}xFileControl(e,t,s){return ot}xSectorSize(e){return 512}xDeviceCharacteristics(e){return 0}xOpen(e,t,s,a){return ct}xDelete(e,t){return g}xAccess(e,t,s){return g}handleAsync(e){return e()}}const It=z|H|Y|pt|Z;class Ct{constructor(){f(this,I);f(this,S,z);et(this,"timeoutMillis",0);f(this,W,new Map);f(this,F,Promise.resolve(0))}get state(){return r(this,S)}async lock(e){return R(this,I,nt).call(this,R(this,I,ut),e)}async unlock(e){return R(this,I,nt).call(this,R(this,I,dt),e)}async isSomewhereReserved(){throw new Error("unimplemented")}async _NONEtoSHARED(){}async _SHAREDtoEXCLUSIVE(){await this._SHAREDtoRESERVED(),await this._RESERVEDtoEXCLUSIVE()}async _SHAREDtoRESERVED(){}async _RESERVEDtoEXCLUSIVE(){}async _EXCLUSIVEtoRESERVED(){}async _EXCLUSIVEtoSHARED(){await this._EXCLUSIVEtoRESERVED(),await this._RESERVEDtoSHARED()}async _EXCLUSIVEtoNONE(){await this._EXCLUSIVEtoRESERVED(),await this._RESERVEDtoSHARED(),await this._SHAREDtoNONE()}async _RESERVEDtoSHARED(){}async _RESERVEDtoNONE(){await this._RESERVEDtoSHARED(),await this._SHAREDtoNONE()}async _SHAREDtoNONE(){}_acquireWebLock(e,t){return new Promise(async(s,a)=>{try{await navigator.locks.request(e,t,n=>{if(s(n),n)return new Promise(i=>r(this,W).set(e,i))})}catch(n){a(n)}})}_releaseWebLock(e){var t;(t=r(this,W).get(e))==null||t(),r(this,W).delete(e)}async _pollWebLock(e){var t;return(t=(await navigator.locks.query()).held.find(({name:s})=>s===e))==null?void 0:t.mode}_getTimeoutSignal(){if(this.timeoutMillis){const e=new AbortController;return setTimeout(()=>e.abort(),this.timeoutMillis),e.signal}}}S=new WeakMap,W=new WeakMap,F=new WeakMap,I=new WeakSet,nt=async function(e,t){const s=t&It;try{const a=()=>e.call(this,s);return await l(this,F,r(this,F).then(a,a)),l(this,S,s),d}catch(a){return a.name==="AbortError"?St:(console.error(a),kt)}},ut=async function(e){if(e===r(this,S))return d;switch(r(this,S)){case z:switch(e){case H:return this._NONEtoSHARED();default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}case H:switch(e){case Y:return this._SHAREDtoRESERVED();case Z:return this._SHAREDtoEXCLUSIVE();default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}case Y:switch(e){case Z:return this._RESERVEDtoEXCLUSIVE();default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}},dt=async function(e){if(e===r(this,S))return d;switch(r(this,S)){case Z:switch(e){case H:return this._EXCLUSIVEtoSHARED();case z:return this._EXCLUSIVEtoNONE();default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}case Y:switch(e){case H:return this._RESERVEDtoSHARED();case z:return this._RESERVEDtoNONE();default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}case H:switch(e){case z:return this._SHAREDtoNONE();default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}default:throw new Error(`unexpected transition ${r(this,S)} -> ${e}`)}};class Vt extends Ct{constructor(e){super(),this._lockName=e+"-outer",this._reservedName=e+"-reserved"}async isSomewhereReserved(){return await this._pollWebLock(this._reservedName)==="exclusive"}async _NONEtoSHARED(){await this._acquireWebLock(this._lockName,{mode:"exclusive",signal:this._getTimeoutSignal()})}async _SHAREDtoRESERVED(){await this._acquireWebLock(this._reservedName,{mode:"exclusive",signal:this._getTimeoutSignal()})}async _RESERVEDtoSHARED(){this._releaseWebLock(this._reservedName)}async _SHAREDtoNONE(){this._releaseWebLock(this._lockName)}}const Nt=5e3;let Ut=0;const rt=new WeakMap;function v(...o){}class Ht{constructor(e,t={durability:"default"}){f(this,tt);f(this,X);f(this,j);f(this,G);f(this,b,null);f(this,J,0);f(this,O,Promise.resolve());f(this,M,Promise.resolve());l(this,j,Promise.resolve(e).then(s=>l(this,X,s))),l(this,G,t)}async close(){const e=r(this,X)??await r(this,j);await r(this,O),await this.sync(),e.close()}async run(e,t){const s=r(this,O).then(()=>R(this,tt,yt).call(this,e,t));return l(this,O,s.catch(()=>{})),s}async sync(){await r(this,O),await r(this,M),l(this,M,Promise.resolve())}}X=new WeakMap,j=new WeakMap,G=new WeakMap,b=new WeakMap,J=new WeakMap,O=new WeakMap,M=new WeakMap,tt=new WeakSet,yt=async function(e,t){var a,n;const s=r(this,X)??await r(this,j);if(e==="readwrite"&&((a=r(this,b))==null?void 0:a.mode)==="readonly")l(this,b,null);else if(performance.now()-r(this,J)>Nt){try{(n=r(this,b))==null||n.commit()}catch(i){if(i.name!=="InvalidStateError")throw i}await new Promise(i=>setTimeout(i)),l(this,b,null)}for(let i=0;i<2;++i){if(!r(this,b)){l(this,b,s.transaction(s.objectStoreNames,e,r(this,G)));const c=l(this,J,performance.now());l(this,M,r(this,M).then(()=>new Promise((h,u)=>{r(this,b).addEventListener("complete",w=>{h(),r(this,b)===w.target&&l(this,b,null),v(`transaction ${rt.get(w.target)} complete`)}),r(this,b).addEventListener("abort",w=>{console.warn("tx abort",(performance.now()-c)/1e3);const p=w.target.error;u(p),r(this,b)===w.target&&l(this,b,null),v(`transaction ${rt.get(w.target)} aborted`,p)})}))),rt.set(r(this,b),Ut++)}try{const c=Object.fromEntries(Array.from(s.objectStoreNames,h=>[h,new Ot(r(this,b).objectStore(h))]));return await t(c)}catch(c){if(l(this,b,null),i)throw c}}};function V(o){return new Promise((e,t)=>{o.addEventListener("success",()=>e(o.result)),o.addEventListener("error",()=>t(o.error))})}class Ot{constructor(e){f(this,E);l(this,E,e)}get(e){v(`get ${r(this,E).name}`,e);const t=r(this,E).get(e);return V(t)}getAll(e,t){v(`getAll ${r(this,E).name}`,e,t);const s=r(this,E).getAll(e,t);return V(s)}getKey(e){v(`getKey ${r(this,E).name}`,e);const t=r(this,E).getKey(e);return V(t)}getAllKeys(e,t){v(`getAllKeys ${r(this,E).name}`,e,t);const s=r(this,E).getAllKeys(e,t);return V(s)}put(e,t){v(`put ${r(this,E).name}`,e,t);const s=r(this,E).put(e,t);return V(s)}delete(e){v(`delete ${r(this,E).name}`,e);const t=r(this,E).delete(e);return V(t)}clear(){v(`clear ${r(this,E).name}`);const e=r(this,E).clear();return V(e)}index(e){return new Mt(r(this,E).index(e))}}E=new WeakMap;class Mt{constructor(e){f(this,P);l(this,P,e)}getAllKeys(e,t){v(`IDBIndex.getAllKeys ${r(this,P).objectStore.name}<${r(this,P).name}>`,e,t);const s=r(this,P).getAllKeys(e,t);return V(s)}}P=new WeakMap;const Pt=512,ht=3e3,lt={durability:"default",purge:"deferred",purgeAtLeast:16};function A(...o){}class Kt extends _t{constructor(t="wa-sqlite",s=lt){super();f(this,m);f(this,N);f(this,k,new Map);f(this,y);f(this,K,new Set);f(this,B,performance.now());f(this,_,new Set);f(this,x,null);this.name=t,l(this,N,Object.assign({},lt,s)),l(this,y,new Ht(Bt(t),{durability:r(this,N).durability}))}async close(){var t;for(const s of r(this,k).keys())await this.xClose(s);await((t=r(this,y))==null?void 0:t.close()),l(this,y,null)}xOpen(t,s,a,n){var c;const i=this.handleAsync(async()=>{t===null&&(t=`null_${s}`),A(`xOpen ${t} 0x${s.toString(16)} 0x${a.toString(16)}`);try{const h=new URL(t,"http://localhost/"),u={path:h.pathname,flags:a,block0:null,isMetadataChanged:!0,locks:new Vt(h.pathname)};return r(this,k).set(s,u),await r(this,y).run("readwrite",async({blocks:w})=>{if(u.block0=await w.get(R(this,m,T).call(this,u,0)),!u.block0)if(a&mt)u.block0={path:u.path,offset:0,version:0,data:new Uint8Array(0),fileSize:0},w.put(u.block0);else throw new Error(`file not found: ${u.path}`)}),(n.buffer.detached||!n.buffer.byteLength)&&(n=new DataView(new ArrayBuffer(4)),l(this,x,w=>{w.setInt32(0,n.getInt32(0,!0),!0)})),n.setInt32(0,a&Rt,!0),d}catch(h){return console.error(h),ct}});return(c=r(this,x))==null||c.call(this,n),l(this,x,null),i}xClose(t){return this.handleAsync(async()=>{try{const s=r(this,k).get(t);return s&&(A(`xClose ${s.path}`),r(this,k).delete(t),s.flags&xt&&r(this,y).run("readwrite",({blocks:a})=>{a.delete(IDBKeyRange.bound([s.path],[s.path,[]]))})),d}catch(s){return console.error(s),g}})}xRead(t,s,a){var c;const n=s.byteLength,i=this.handleAsync(async()=>{const h=r(this,k).get(t);A(`xRead ${h.path} ${s.byteLength} ${a}`);try{return await r(this,y).run("readonly",async({blocks:u})=>{(s.buffer.detached||!s.buffer.byteLength)&&(s=new Uint8Array(n),l(this,x,p=>p.set(s)));let w=0;for(;w<s.byteLength;){const p=a+w,C=p<h.block0.data.byteLength?h.block0:await u.get(R(this,m,T).call(this,h,-p));if(!C||C.data.byteLength-C.offset<=p)return s.fill(0,w),At;const $=s.subarray(w),U=p+C.offset,D=Math.min(Math.max(C.data.byteLength-U,0),$.byteLength);$.set(C.data.subarray(U,U+D)),w+=D}return d})}catch(u){return console.error(u),g}});return(c=r(this,x))==null||c.call(this,s),l(this,x,null),i}xWrite(t,s,a){const n=r(this,_).has(t);if(n||performance.now()-r(this,B)>ht){const i=this.handleAsync(async()=>{this.handleAsync!==super.handleAsync&&r(this,_).add(t),await new Promise(h=>setTimeout(h));const c=R(this,m,at).call(this,t,s.slice(),a);return l(this,B,performance.now()),c});return n&&r(this,_).delete(t),i}return R(this,m,at).call(this,t,s,a)}xTruncate(t,s){const a=r(this,k).get(t);A(`xTruncate ${a.path} ${s}`);try{Object.assign(a.block0,{fileSize:s,data:a.block0.data.slice(0,s)});const n=Object.assign({},a.block0);return r(this,y).run("readwrite",({blocks:i})=>{i.delete(R(this,m,T).call(this,a,-1/0,-s)),i.put(n)}),d}catch(n){return console.error(n),g}}xSync(t,s){const a=r(this,_).has(t);if(a||r(this,N).durability!=="relaxed"||performance.now()-r(this,B)>ht){const i=this.handleAsync(async()=>{this.handleAsync!==super.handleAsync&&r(this,_).add(t);const c=await R(this,m,wt).call(this,t,s);return l(this,B,performance.now()),c});return a&&r(this,_).delete(t),i}const n=r(this,k).get(t);return A(`xSync ${n.path} ${s}`),d}xFileSize(t,s){const a=r(this,k).get(t);return A(`xFileSize ${a.path}`),s.setBigInt64(0,BigInt(a.block0.fileSize),!0),d}xLock(t,s){return this.handleAsync(async()=>{const a=r(this,k).get(t);A(`xLock ${a.path} ${s}`);try{const n=await a.locks.lock(s);return n===d&&a.locks.state===H&&(a.block0=await r(this,y).run("readonly",({blocks:i})=>i.get(R(this,m,T).call(this,a,0)))),n}catch(n){return console.error(n),g}})}xUnlock(t,s){return this.handleAsync(async()=>{const a=r(this,k).get(t);A(`xUnlock ${a.path} ${s}`);try{return a.locks.unlock(s)}catch(n){return console.error(n),g}})}xCheckReservedLock(t,s){var n;const a=this.handleAsync(async()=>{const i=r(this,k).get(t);A(`xCheckReservedLock ${i.path}`);const c=await i.locks.isSomewhereReserved();return(s.buffer.detached||!s.buffer.byteLength)&&(s=new DataView(new ArrayBuffer(4)),l(this,x,h=>{h.setInt32(0,s.getInt32(0,!0),!0)})),s.setInt32(0,c?1:0,!0),d});return(n=r(this,x))==null||n.call(this,s),l(this,x,null),a}xSectorSize(t){return Pt}xDeviceCharacteristics(t){return Dt|$t|Lt|vt}xFileControl(t,s,a){const n=r(this,k).get(t);switch(A(`xFileControl ${n.path} ${s}`),s){case 11:return n.overwrite=!0,d;case 21:if(n.overwrite)try{return this.handleAsync(async()=>(await R(this,m,gt).call(this,n),d))}catch(i){return console.error(i),g}if(n.isMetadataChanged)try{r(this,y).run("readwrite",async({blocks:i})=>{await i.put(n.block0)}),n.isMetadataChanged=!1}catch(i){return console.error(i),g}return d;case 22:return n.overwrite=!1,d;case 31:return this.handleAsync(async()=>{try{return n.block0.version--,n.changedPages=new Set,r(this,y).run("readwrite",async({blocks:i})=>{const c=await i.index("version").getAllKeys(IDBKeyRange.bound([n.path],[n.path,n.block0.version]));for(const h of c)i.delete(h)}),d}catch(i){return console.error(i),g}});case 32:try{const i=Object.assign({},n.block0);i.data=i.data.slice();const c=n.changedPages;return n.changedPages=null,n.isMetadataChanged=!1,r(this,y).run("readwrite",async({blocks:h})=>{h.put(i);const u=await h.get([n.path,"purge",0])??{path:n.path,offset:"purge",version:0,data:new Map,count:0};u.count+=c.size;for(const w of c)u.data.set(w,i.version);h.put(u),R(this,m,ft).call(this,n.path,u.count)}),d}catch(i){return console.error(i),g}case 33:return this.handleAsync(async()=>{try{return n.changedPages=null,n.isMetadataChanged=!1,n.block0=await r(this,y).run("readonly",({blocks:i})=>i.get([n.path,0,n.block0.version+1])),d}catch(i){return console.error(i),g}});default:return ot}}xAccess(t,s,a){var i;const n=this.handleAsync(async()=>{try{const c=new URL(t,"file://localhost/").pathname;A(`xAccess ${c} ${s}`);const h=await r(this,y).run("readonly",({blocks:u})=>u.getKey(R(this,m,T).call(this,{path:c},0)));return(a.buffer.detached||!a.buffer.byteLength)&&(a=new DataView(new ArrayBuffer(4)),l(this,x,u=>{u.setInt32(0,a.getInt32(0,!0),!0)})),a.setInt32(0,h?1:0,!0),d}catch(c){return console.error(c),g}});return(i=r(this,x))==null||i.call(this,a),l(this,x,null),n}xDelete(t,s){return this.handleAsync(async()=>{const a=new URL(t,"file://localhost/").pathname;try{return r(this,y).run("readwrite",({blocks:n})=>n.delete(IDBKeyRange.bound([a],[a,[]]))),s&&await r(this,y).sync(),d}catch(n){return console.error(n),g}})}async purge(t){const s=Date.now();await r(this,y).run("readwrite",async({blocks:a})=>{const n=await a.get([t,"purge",0]);if(n){for(const[i,c]of n.data)a.delete(IDBKeyRange.bound([t,i,c],[t,i,1/0],!0,!1));await a.delete([t,"purge",0])}A(`purge ${t} ${(n==null?void 0:n.data.size)??0} pages in ${Date.now()-s} ms`)})}}N=new WeakMap,k=new WeakMap,y=new WeakMap,K=new WeakMap,B=new WeakMap,_=new WeakMap,x=new WeakMap,m=new WeakSet,at=function(t,s,a){const n=r(this,k).get(t);A(`xWrite ${n.path} ${s.byteLength} ${a}`);try{const i=n.block0.fileSize;n.block0.fileSize<a+s.byteLength&&(n.block0.fileSize=a+s.byteLength,n.isMetadataChanged=!0);const c=a===0?n.block0:{path:n.path,offset:-a,version:n.block0.version,data:null};return c.data=s.slice(),n.changedPages?(i===n.block0.fileSize&&n.changedPages.add(-a),a!==0&&r(this,y).run("readwrite",({blocks:h})=>h.put(c))):r(this,y).run("readwrite",({blocks:h})=>h.put(c)),n.isMetadataChanged=a===0?!1:n.isMetadataChanged,d}catch(i){return console.error(i),g}},wt=async function(t,s){const a=r(this,k).get(t);A(`xSync ${a.path} ${s}`);try{a.isMetadataChanged&&(r(this,y).run("readwrite",async({blocks:n})=>{await n.put(a.block0)}),a.isMetadataChanged=!1),await r(this,y).sync()}catch(n){return console.error(n),g}return d},ft=function(t,s){r(this,N).purge==="manual"||r(this,K).has(t)||s<r(this,N).purgeAtLeast||(globalThis.requestIdleCallback?globalThis.requestIdleCallback(()=>{this.purge(t),r(this,K).delete(t)}):setTimeout(()=>{this.purge(t),r(this,K).delete(t)}),r(this,K).add(t))},T=function(t,s,a=0){const n=!s||-s<t.block0.data.length?-1/0:t.block0.version;return IDBKeyRange.bound([t.path,s,n],[t.path,a,1/0])},gt=async function(t){const s=t.block0.data.length;if(s<18)return;const a=new DataView(t.block0.data.buffer,t.block0.data.byteOffset);let n=a.getUint16(16);if(n===1&&(n=65536),n===s)return;const i=Math.max(s,n),c=i/s,h=i/n,u=a.getUint32(28)*n,w=t.block0.version;await r(this,y).run("readwrite",async({blocks:p})=>{const C=await p.index("version").getAllKeys(IDBKeyRange.bound([t.path,w+1],[t.path,1/0]));for(const $ of C)p.delete($);p.delete([t.path,"purge",0]);for(let $=0;$<u;$+=i){const U=await p.getAll(IDBKeyRange.lowerBound([t.path,-($+i),1/0]),c);for(const D of U)p.delete([D.path,D.offset,D.version]);if(h===1){const D=new Uint8Array(n);for(const q of U)D.set(q.data,-($+q.offset));const L={path:t.path,offset:-$,version:w,data:D};L.offset===0&&(L.fileSize=u,t.block0=L),p.put(L)}else{const D=U[0];for(let L=0;L<h;++L){const q=-($+L*n);if(-q>=u)break;const Q={path:D.path,offset:q,version:w,data:D.data.subarray(L*n,(L+1)*n)};Q.offset===0&&(Q.fileSize=u,t.block0=Q),p.put(Q)}}}})};function Bt(o){return new Promise((e,t)=>{const s=globalThis.indexedDB.open(o,5);s.addEventListener("upgradeneeded",function(){s.result.createObjectStore("blocks",{keyPath:["path","offset","version"]}).createIndex("version",["path","version"])}),s.addEventListener("success",()=>{e(s.result)}),s.addEventListener("error",()=>{t(s.error)})})}export{Kt as IDBBatchAtomicVFS};