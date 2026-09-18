import { DatabaseSync, backup } from "node:sqlite";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
const source=process.env.DATABASE_PATH||path.join(process.cwd(),"data/demo.sqlite");
const destination=process.argv[2];
if(!destination)throw new Error("Usage: node scripts/backup-database.mjs /absolute/path/backup.sqlite");
if(!existsSync(source))throw new Error("Database does not exist");
if(existsSync(destination))throw new Error("Backup destination already exists; choose a new filename");
mkdirSync(path.dirname(path.resolve(destination)),{recursive:true});
const db=new DatabaseSync(source,{readOnly:true});
try{await backup(db,destination);console.log(`Database backup completed: ${destination}`);}finally{db.close();}
