const converter = require('./conversor.js');

const file = `E:\\uneelOnTarget\\bases\\BASES DE ENERGIA\\BASES DE ENERGIA\\CEEE NOVA\\Enel PJ completa_02.txt`;
converter(file, './temp/cpfl.csv', '.csv', (err) => { console.log(err) });
