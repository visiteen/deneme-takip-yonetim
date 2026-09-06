import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
const parts=[0,1,2,3,4].map(n=>fs.readFileSync(new URL(`./source.bundle.part${String(n).padStart(2,'0')}`, import.meta.url),"utf8"));
const b64=parts.join('').trim();
const data=JSON.parse(zlib.gunzipSync(Buffer.from(b64,"base64")).toString("utf8"));
for (const [rel,content] of Object.entries(data.files)) {
  const p=path.resolve(process.cwd(),rel);
  fs.mkdirSync(path.dirname(p),{recursive:true});
  fs.writeFileSync(p,content,"utf8");
}
console.log(`Unpacked ${Object.keys(data.files).length} V28 source files`);
