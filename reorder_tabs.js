const fs = require('fs');
const content = fs.readFileSync('src/app/features/reinsurance-calculations/reinsurance-calculations.component.html', 'utf8');

const tabsHeaderRegex = /<div class="tabs-header">([\s\S]*?)<\/div>/;
const match = content.match(tabsHeaderRegex);

if (match) {
  const tabsContent = match[1];
  
  // Find the exact buttons
  const baseSheetMatch = tabsContent.match(/<button[\s\S]*?ReinsuranceTab\.Statement[\s\S]*?<\/button>/);
  const gljeMatch = tabsContent.match(/<button[\s\S]*?ReinsuranceTab\.Glje[\s\S]*?<\/button>/);
  const cashMatch = tabsContent.match(/<button[\s\S]*?ReinsuranceTab\.Cash[\s\S]*?<\/button>/);
  
  if (baseSheetMatch && gljeMatch && cashMatch) {
    const baseSheetStr = baseSheetMatch[0];
    const gljeStr = gljeMatch[0];
    const cashStr = cashMatch[0];
    
    // We want the order to be: baseSheet, cash, glje
    // So let's replace the whole tabsContent with them concatenated (with some whitespace)
    const newTabsContent = `\n        ${baseSheetStr}\n        ${cashStr}\n        ${gljeStr}\n      `;
    
    const newContent = content.replace(tabsHeaderRegex, `<div class="tabs-header">${newTabsContent}</div>`);
    fs.writeFileSync('src/app/features/reinsurance-calculations/reinsurance-calculations.component.html', newContent, 'utf8');
    console.log('Reordered tabs successfully.');
  } else {
    console.log('Could not find all three buttons in tabs header');
  }
} else {
  console.log('Could not find tabs header');
}
