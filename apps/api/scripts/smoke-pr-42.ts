import fs from 'fs';
import path from 'path';
import { importAndReconcile } from '../src/services/sepa';

async function run() {
  const camtSample = fs.readFileSync(path.resolve(__dirname, '../test/samples/camt.sample.xml'), 'utf-8');
  const res = await importAndReconcile(camtSample, 'camt');
  console.log('CAMP result', JSON.stringify(res, null, 2));

  const mt = fs.readFileSync(path.resolve(__dirname, '../test/samples/mt940.sample.txt'), 'utf-8');
  const res2 = await importAndReconcile(mt, 'mt940');
  console.log('MT940 result', JSON.stringify(res2, null, 2));
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
