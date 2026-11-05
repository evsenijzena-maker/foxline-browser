const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const electron = require('electron');
const base = 'C:/Foxline';
const script = `
const fs=require('fs'), path=require('path');
const {app,nativeImage}=require('electron');
app.whenReady().then(()=>{
  const src='C:/Foxline/build/icon-source.png';
  const img=nativeImage.createFromPath(src);
  if(img.isEmpty()){console.error('empty'); process.exit(2);}
  for(const s of [16,24,32,48,64,128,256,512]){
    const r=img.resize({width:s,height:s,quality:'best'});
    fs.writeFileSync(path.join('C:/Foxline/build','icon-'+s+'.png'), r.toPNG());
  }
  fs.writeFileSync('C:/Foxline/build/icon.png', img.resize({width:512,height:512,quality:'best'}).toPNG());
  console.log('ok', JSON.stringify(img.getSize()));
  app.exit(0);
}).catch(e=>{console.error(e); process.exit(1);});
`;
fs.writeFileSync(path.join(base,'_mkicons_main.js'), script);
execFileSync(electron, [path.join(base,'_mkicons_main.js')], { cwd: base, stdio: 'inherit', timeout: 120000 });
