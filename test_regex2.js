const fs = require('fs');
let content = fs.readFileSync('/home/adnan/Desktop/Spondon_lms/frontend/app/admin/branches/page.tsx', 'utf8');

let tableRegex = /<Table[\s\S]*?<\/Table>/g;
content = content.replace(tableRegex, (tableMatch) => {
    let modifiedTable = tableMatch;
    modifiedTable = modifiedTable.replace(/text-(\[9px\]|\[10px\]|\[11px\]|xs|sm|base)/g, (match, p1) => {
        switch(p1) {
            case '[9px]': return 'text-xs';
            case '[10px]': return 'text-sm';
            case '[11px]': return 'text-sm';
            case 'xs': return 'text-sm';
            case 'sm': return 'text-base';
            default: return match;
        }
    });
    return modifiedTable;
});

console.log(content.includes('text-[9px]'));
console.log(content.includes('text-[10px]'));
