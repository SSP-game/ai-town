const gentle = require('./data/gentle.js');

console.log('Map dimensions:', gentle.mapwidth, 'x', gentle.mapheight);
console.log('Checking fence area (x:32-44, y:0-16) for obstacles...');

let blocked = 0;
let free = 0;
const details = [];

for(let x = 32; x <= 44; x++) {
  for(let y = 0; y <= 16; y++) {
    if(gentle.objmap[x][y] !== -1) {
      blocked++;
      details.push(`(${x},${y}): ${gentle.objmap[x][y]}`);
    } else {
      free++;
    }
  }
}

console.log('Blocked tiles:', blocked);
console.log('Free tiles:', free);
console.log('Fence area total:', (44-32+1) * (16-0+1));
console.log('% Free:', ((free / ((44-32+1) * (16-0+1))) * 100).toFixed(1) + '%');

if(blocked > 0 && blocked < 50) {
  console.log('\nBlocked tile details:');
  details.forEach(d => console.log('  ' + d));
}
