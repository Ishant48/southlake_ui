const fs = require('fs');
const file = 'src/app/layout/sidebar/sidebar.component.html';
let html = fs.readFileSync(file, 'utf8');

// We want to remove the @if (xxxExpanded) { wrappers around <div class="nav-sub-items">
// Since the HTML is well formatted, let's just do a string replacement.

html = html.replace(/@if\s*\(\w+Expanded\)\s*{\s*(<div class="nav-sub-items">[\s\S]*?<\/div>)\s*}/g, '$1');

fs.writeFileSync(file, html);
console.log('HTML @if wrappers removed');
