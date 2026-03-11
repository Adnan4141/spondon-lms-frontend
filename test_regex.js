const fs = require('fs');
let content = fs.readFileSync('/home/adnan/Desktop/Spondon_lms/frontend/app/admin/branches/page.tsx', 'utf8');
let testMatch = content.match(/<Table[\s\S]*?<\/Table>/g);
console.log(testMatch ? testMatch.length : 0);
