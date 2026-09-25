const fs = require('fs');

const data = fs.readFileSync('query_result.txt', 'utf8');
const lines = data.split('\n');

lines.forEach(line => {
  if (line.includes('Name (decrypted):') || 
      line.includes('Role:') || 
      line.includes('Email (decrypted):') || 
      line.includes('Image:') || 
      line.includes('ShopLogo:') || 
      line.includes('BannerImage:')) {
    
    // If the line has base64 data, truncate it
    if (line.includes('data:image')) {
      const parts = line.split(':');
      const prefix = parts[0];
      const val = parts.slice(1).join(':');
      console.log(`${prefix}: [Base64 string of length ${val.length}]`);
    } else {
      console.log(line);
    }
  } else if (line.includes('User ID:')) {
    console.log('\n' + line);
  } else if (line.includes('Connected to MongoDB') || line.includes('Collections in database') || line.includes('Found')) {
    console.log(line);
  }
});
