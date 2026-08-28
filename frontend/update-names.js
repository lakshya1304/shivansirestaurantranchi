const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/routes/*.tsx');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/"Shivansi Restaurant & Sweet Shop"/g, '`${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"}`');
  content = content.replace(/"Shivansi"/g, '`${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"}`');
  content = content.replace(/— Shivansi Restaurant & Sweet Shop/g, '— ${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"}');
  content = content.replace(/— Shivansi/g, '— ${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"}');
  content = content.replace(/at Shivansi\./g, 'at ${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"}.');
  content = content.replace(/Shivansi order/g, '${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"} order');
  content = content.replace(/Shivansi owner dashboard/g, '${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"} owner dashboard');
  content = content.replace(/Shivansi menu/g, '${import.meta.env.VITE_BUSINESS_NAME ?? "Restaurant"} menu');
  fs.writeFileSync(file, content);
});
console.log('Replaced route heads');
