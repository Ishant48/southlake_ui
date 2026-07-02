const fs = require('fs');
const file = 'src/app/layout/sidebar/sidebar.component.html';
let html = fs.readFileSync(file, 'utf8');

const circleIcon = `<svg class="sub-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /></svg>`;

html = html.replace(/(<a class="nav-item sub-item"[^>]*>)\s*(<span>[^<]+<\/span>\s*<\/a>)/g, (match, p1, p2) => {
  return p1 + '\n                  ' + circleIcon + '\n                  ' + p2;
});

fs.writeFileSync(file, html);
console.log('Icons updated successfully');
