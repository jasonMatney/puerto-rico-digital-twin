import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {parseCsv,previewImport,responseHeaders} from '../lib/csv-import.ts';
const sample=await fs.readFile('public/validation/toa-baja-ejemplo-solo-vista-previa.csv','utf8');
let p=previewImport(sample);assert.equal(p.reviews.length,1);assert.equal(p.skipped,11);assert.equal(p.errors.length,0);assert.equal(p.sample,true);
assert.deepEqual(parseCsv('\uFEFFa,b\r\n"comma,here","quote"" and\nnewline"\r\n'),[['a','b'],['comma,here','quote" and\nnewline']]);
assert.throws(()=>parseCsv('a\n"unclosed'));
assert.throws(()=>previewImport('id_refugio\nshelter-1'));
const header=['id_refugio',...responseHeaders];const row=['shelter-3','Proposed name','no','','','pendiente','desconocido','0','2026-09-07','LOCAL CSV TEST','Local test','https://www.toabaja.com/','Test only'];
const csv=rows=>rows.map(r=>r.map(v=>'"'+v.replace(/"/g,'""')+'"').join(',')).join('\r\n');
assert.equal(previewImport(csv([header,row])).reviews[0].review.capacity,0);
for(const [index,value] of [[0,'shelter-99'],[3,'999'],[5,'yes'],[7,'-1'],[8,'2026-02-30'],[9,''],[11,'javascript:alert(1)']]){const bad=[...row];bad[index]=value;assert.equal(previewImport(csv([header,bad])).errors.length,1);}
assert.equal(previewImport(csv([header,row,row])).errors.length,1);
console.log('PASS: synthetic sample, BOM/CRLF/quoted commas/newlines, empty responses, missing headers, unknown and duplicate IDs, dates, coordinates, capacity and evidence validation.');
