
const fs=require('fs'), path=require('path'), {nativeImage}=require('electron');
const src='C:/Foxline/build/icon-source.png';
const img=nativeImage.createFromPath(src);
if(img.isEmpty()){console.error('empty'); process.exit(2);}
for(const s of [16,24,32,48,64,128,256,512]){
  const r=img.resize({width:s,height:s,quality:'best'});
  fs.writeFileSync(path.join('C:/Foxline/build','icon-'+s+'.png'), r.toPNG());
}
fs.writeFileSync('C:/Foxline/build/icon.png', img.resize({width:512,height:512,quality:'best'}).toPNG());
console.log('ok', img.getSize());
