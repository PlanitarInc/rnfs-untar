const fs = require('fs');

module.exports = {
  read: (filePath, length, offset, encoding) => {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) return reject(err);
        const buffer = Uint8Array.prototype.slice.call(data, offset, offset + length);
        resolve(buffer.toString(encoding));
      });
    });
  },
  
  stat: (filePath) => {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) return reject(err);
        resolve({
          size: stats.size,
        });
      });
    });
  },
};
