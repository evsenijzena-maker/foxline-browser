const fs=require('fs'), path=require('path');
const png=fs.readFileSync(path.join(__dirname,'build','icon-source.png'));
// Read PNG IHDR for width/height
if(png.toString('hex',0,8)!=='89504e470d0a1a0a') throw new Error('not png');
let w=0,h=0,off=8;
while(off<png.length){const len=png.readUInt32BE(off); const type=png.toString('ascii',off+4,off+8); if(type==='IHDR'){w=png.readUInt32BE(off+8); h=png.readUInt32BE(off+12); break;} off+=12+len;}
console.log('png',w,'x',h,png.length);
