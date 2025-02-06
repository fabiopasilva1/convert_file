const convert = require("./index.js");
var directory = "./";
var name = "teste.txt";
convert({
    path: directory,
    file_name: name,
    new_path: "./ewPath2",
    ext: "csv",
    callback: console.log,
    chunk_size: 100,
    pause_time: 100,
    header: true,
});
