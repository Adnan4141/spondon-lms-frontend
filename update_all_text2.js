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
    // Skip exams page since we already updated it heavily
    if (file.includes('exams/page.tsx')) return;

    try {
        let content = fs.readFileSync(file, 'utf8');
        let original = content;

        // Apply globally across the file
        content = content.replace(/\btext-(\[10px\]|\[11px\]|xs|sm)\b/g, (match, p1) => {
            switch(p1) {
                case '[10px]': return 'text-xs';
                case '[11px]': return 'text-sm';
                case 'xs': return 'text-sm';
                case 'sm': return 'text-base';
                default: return match;
            }
        });

        if (content !== original) {
            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated: ' + file);
            updatedCount++;
        }
    } catch (e) {
        console.error('Error on ' + file, e);
    }
});

console.log('Total files updated: ' + updatedCount);
