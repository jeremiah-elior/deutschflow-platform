import { mkdirSync, cpSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const zipPath = process.argv[2];
if (!zipPath) { console.error('Usage: npm run storage:import -- /path/to/wnkxhlqmelualzsiqzhq.storage.zip'); process.exit(1); }
const temp = resolve(process.cwd(), '.storage-import-tmp');
const target = resolve(process.cwd(), process.env.UPLOADS_DIR || 'uploads/content');
rmSync(temp,{recursive:true,force:true}); mkdirSync(temp,{recursive:true}); mkdirSync(target,{recursive:true});
const r=spawnSync('unzip',['-q','-o',resolve(zipPath),'-d',temp],{stdio:'inherit'}); if(r.status!==0){console.error('unzip failed. Extract the ZIP manually and copy its content/ folder into uploads/content.');process.exit(r.status||1);}
function findContent(dir){for(const name of readdirSync(dir,{withFileTypes:true})){if(name.isDirectory()&&name.name==='content')return resolve(dir,name.name);if(name.isDirectory()){const found=findContent(resolve(dir,name.name));if(found)return found;}}return null;}
const content=findContent(temp);if(!content){console.error('Could not find content/ inside storage ZIP');process.exit(1);}cpSync(content,target,{recursive:true,force:true});rmSync(temp,{recursive:true,force:true});console.log(`Storage import complete -> ${target}`);
