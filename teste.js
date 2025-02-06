const convert = require("./index.js");
var directory = "E:\\uneelOnTarget\\bases\\BASES DE ENERGIA\\BASES DE ENERGIA\\CEEE NOVA";
var name = "Enel PJ completa_02.txt";
convert(directory, name, './newPath2', 'csv', (err) => {
    if (err) {
        console.log(err)
    }
}, 5000, 100)
