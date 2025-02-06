const convert = require("./index.js");
var directory = "./";
var name = "teste.txt";
convert(directory, name, './newPath', 'csv', (err) => {
    if (err) {
        console.log(err)
    }
}, 5000, 1000)
