const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const electron = require('electron');
const base = 'C:/Foxline';
const script = `
console.log('pv', process.versions.electron, typeof require('electron'));
try{ const e=require('electron'); console.log(Object.keys(e||{}).slice(0,8)); }catch(err){console.error(err)}
`;
fs.writeFileSync(path.join(base,'_probe.js'), script);
execFileSync(electron, [path.join(base,'_probe.js')], { cwd: base, stdio: 'inherit', timeout: 60000 });
