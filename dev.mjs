import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const server=createServer(async(req,res)=>{try{res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});res.end(await readFile(new URL('./dist/index.html',import.meta.url)));}catch{res.writeHead(503);res.end('Workshop is building.');}});
server.listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
