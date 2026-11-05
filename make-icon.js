const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf){let c=~0>>>0;for(let i=0;i<buf.length;i++){c^=buf[i];for(let k=0;k<8;k++)c=(c>>>1)^(0xEDB88320&-(c&1));}return(~c)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);const t=Buffer.from(type);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);return Buffer.concat([len,t,data,crc]);}
function lerp(a,b,t){return Math.round(a+(b-a)*t);}
function px(size,x,y){
  const w=size,h=size,dx=x-w/2,dy=y-h/2,d=Math.sqrt(dx*dx+dy*dy)/(w/2);
  let r=21,g=25,b=34,a=0;
  const rad=w*0.46, corner=w*0.12;
  const rx=Math.max(Math.abs(dx)- (rad-corner),0), ry=Math.max(Math.abs(dy)-(rad-corner),0);
  if(Math.sqrt(rx*rx+ry*ry)<corner && Math.abs(dx)<rad && Math.abs(dy)<rad){ a=255; }
  // orange glow
  const glow=Math.max(0,1-d)*0.22;
  r=lerp(r,255,glow*0.4); g=lerp(g,122,glow*0.3); b=lerp(b,24,glow*0.1);
  // fox head
  const nx=Math.abs(dx)/(w*0.30), ny=dy/(h*0.30);
  if(nx+Math.abs(ny-0.02)<1.0 && ny>-0.85 && ny<0.95){
    const t=Math.max(0,Math.min(1,(ny+0.2)));
    r=lerp(255,255,t); g=lerp(154,106,t); b=lerp(61,24,t); a=255;
  }
  // inner face
  const fnx=Math.abs(dx)/(w*0.20), fny=(dy-w*0.05)/(h*0.18);
  if(fnx*fnx+fny*fny<1.0){ r=255; g=235; b=220; a=255; }
  // eyes
  for(const ex of [-w*0.075,w*0.075]){
    if(Math.hypot(dx-ex,dy+w*0.01)<w*0.028){ r=30;g=32;b=40;a=255; }
    if(Math.hypot(dx-ex+w*0.008,dy+w*0.018)<w*0.008){ r=255;g=255;b=255;a=255; }
  }
  // nose
  if(Math.hypot(dx,dy-w*0.07)<w*0.022){ r=40;g=42;b=50;a=255; }
  return [r,g,b,a];
}
function png(size){
  const w=size,h=size; const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4); ihdr[8]=8; ihdr[9]=6;
  const raw=Buffer.alloc((w*4+1)*h);
  for(let y=0;y<h;y++){
    raw[y*(w*4+1)]=0;
    for(let x=0;x<w;x++){ const i=y*(w*4+1)+1+x*4; const [r,g,b,a]=px(size,x,y); raw[i]=r;raw[i+1]=g;raw[i+2]=b;raw[i+3]=a; }
  }
  const idat=zlib.deflateSync(raw,{level:9});
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR',ihdr), chunk('IDAT',idat), chunk('IEND',Buffer.alloc(0))]);
}
function dib(size){
  // 32-bit BGRA bottom-up with AND mask
  const w=size,h=size; const img=Buffer.alloc(w*h*4); const maskRow=((w+31)>>5)*4; const mask=Buffer.alloc(maskRow*h);
  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const srcY=h-1-y; const [r,g,b,a]=px(size,x,srcY); const i=(y*w+x)*4;
      img[i]=b; img[i+1]=g; img[i+2]=r; img[i+3]=a;
      if(a<128){ const mi=y*maskRow + (x>>3); mask[mi]|=(0x80>>(x&7)); }
    }
  }
  const header=Buffer.alloc(40);
  header.writeUInt32LE(40,0); header.writeInt32LE(w,4); header.writeInt32LE(h*2,8); header.writeUInt16LE(1,12); header.writeUInt16LE(32,14);
  header.writeUInt32LE(0,16); header.writeUInt32LE(img.length+mask.length,20);
  return Buffer.concat([header,img,mask]);
}
const sizes=[16,24,32,48,64,128,256];
const images=sizes.map(s=> s>=256 ? png(s) : dib(s));
const count=images.length;
const header=Buffer.alloc(6); header.writeUInt16LE(0,0); header.writeUInt16LE(1,2); header.writeUInt16LE(count,4);
let offset=6+16*count; const entries=[];
for(let i=0;i<count;i++){
  const s=sizes[i], img=images[i]; const e=Buffer.alloc(16);
  e[0]=s>=256?0:s; e[1]=s>=256?0:s; e[2]=0; e[3]=0; e.writeUInt16LE(1,4); e.writeUInt16LE(32,6); e.writeUInt32LE(img.length,8); e.writeUInt32LE(offset,12);
  entries.push(e); offset+=img.length;
}
const ico=Buffer.concat([header,...entries,...images]);
for(const dir of [path.join(__dirname,'build'), path.join('C:/Users/Admin/OneDrive/Рабочий стол/Foxline','build')]){
  fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'icon.ico'),ico); fs.writeFileSync(path.join(dir,'icon.png'), png(512));
}
console.log('ok', ico.length, 'bytes, sizes', sizes.join(','));
