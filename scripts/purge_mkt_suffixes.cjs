const fs = require('fs');

function purge(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/.*MKT LOCAL NORTH_(HP|TH|TN|PT).*\n?/g, '');
  fs.writeFileSync(file, content);
}

purge('src/app/workers/timesheet.worker.ts');
purge('src/app/workers/audit.worker.ts');
purge('src/app/pages/03-master/MasterAE.tsx');
purge('src/app/constants/initial-data.ts');
purge('src/app/lib/utils/l07-resolver.ts');

