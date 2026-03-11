const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('/home/adnan/Desktop/Spondon_lms/frontend/app/admin');
const files2 = walk('/home/adnan/Desktop/Spondon_lms/frontend/src/components/admin');
const allFiles = [...files, ...files2];

let updatedCount = 0;

allFiles.forEach(file => {
    try {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;

        // Replace the very large SelectItem/SelectTrigger styling with normal sizes
        content = content.replace(/className="[^"]*font-bold text-base uppercase tracking-widest[^"]*"/g, (match) => {
            return 'className="text-sm font-medium"';
        });

        // Also fix the select trigger sizing if it got too big
        content = content.replace(/className="h-12 w-\[\d+px\] rounded-2xl border-slate-200 bg-white font-bold text-base uppercase tracking-widest text-slate-600 shadow-sm"/g, (match) => {
            // Keep the width and general shape, but reduce text
            const widthMatch = match.match(/w-\[\d+px\]/);
            const w = widthMatch ? widthMatch[0] : 'w-[200px]';
            return `className={"h-10 " + "${w}" + " rounded-xl border-slate-200 bg-white font-semibold text-sm text-slate-700 shadow-sm"}`;
        });
        
         content = content.replace(/className="h-12 w-\[\d+px\] rounded-2xl border-slate-200 bg-white font-bold text-base uppercase tracking-widest text-slate-600"/g, (match) => {
            // Same as above but without shadow-sm
            const widthMatch = match.match(/w-\[\d+px\]/);
            const w = widthMatch ? widthMatch[0] : 'w-[200px]';
            return `className={"h-10 " + "${w}" + " rounded-xl border-slate-200 bg-white font-semibold text-sm text-slate-700"}`;
        });

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated filters on: ' + file);
            updatedCount++;
        }
    } catch (e) {
        console.error('Error on ' + file, e);
    }
});

console.log('Total files updated: ' + updatedCount);
