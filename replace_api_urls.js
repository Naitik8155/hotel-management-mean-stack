const fs = require('fs');
const path = require('path');

const directory = 'd:/All__PROJECTS/Angular/Hotel management/frontend/src/app';
const apiBaseUrl = 'https://hotel-management-backend-n59d.onrender.com/api';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(directory, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.html')) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('http://localhost:5000/api')) {
      console.log(`Updating ${filePath}`);
      // Special handling for imports in .ts files
      if (filePath.endsWith('.ts')) {
        // If it's a service, add import if not present
        if (filePath.includes('service.ts') && !content.includes('API_CONFIG')) {
           // This is just a simple string replacement for now
           // For a more robust solution, I'd need to calculate relative path to API_CONFIG
        }
      }
      
      let newContent = content.replace(/http:\/\/localhost:5000\/api/g, apiBaseUrl);
      fs.writeFileSync(filePath, newContent, 'utf8');
    }
  }
});
