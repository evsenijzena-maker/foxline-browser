
console.log('pv', process.versions.electron, typeof require('electron'));
try{ const e=require('electron'); console.log(Object.keys(e||{}).slice(0,8)); }catch(err){console.error(err)}
