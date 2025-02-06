const fs = require('fs');
const ProgressBar = require('progress');
const readline = require('readline');

const txt_path = './CPFL Completa atualizada.txt';
const txt_path_temp = './temp/cpfl.csv';

// Create the 'temp' directory if it doesn't exist
fs.mkdirSync('./temp', { recursive: true });

// Remove the temp file if it exists to avoid appending to old data.
try {
    fs.unlinkSync(txt_path_temp);
} catch (err) {
    if (err.code !== 'ENOENT') { // Ignore "file not found" errors
        console.error("Error deleting existing temp file:", err);
    }
}


const readStream = fs.createReadStream(txt_path, { highWaterMark: 64 * 1024 }); // Adjust highWaterMark as needed

let lineCount = 0;
let processedLines = 0;

// First, count the lines (without loading everything into memory)
const lineCounter = readline.createInterface({
    input: readStream,
    crlfDelay: Infinity
});

lineCounter.on('line', () => {
    lineCount++;
});

lineCounter.on('close', () => {
    console.log(`O arquivo ${txt_path} tem ${fs.statSync(txt_path).size / (1024 * 1024)}MB`);
    console.log(`O arquivo ${txt_path} tem ${lineCount} linhas.`);

    const bar = new ProgressBar('[:bar] :percent - :etas - :current/:total - :value - :elapseds', {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: lineCount
    });

    const readStreamForProcessing = fs.createReadStream(txt_path, { highWaterMark: 64 * 1024 }); // New stream for processing
    const rl = readline.createInterface({
        input: readStreamForProcessing,
        crlfDelay: Infinity
    });

    rl.on('line', (line) => {
        line = line.replace(/\t/g, ',').trim().replace(/\s+/g, ' ');

        fs.appendFile(txt_path_temp, line + '\n', (err) => {
            if (err) console.error("Error writing to temp file:", err);
        });

        processedLines++;
        bar.tick();
    });

    rl.on('close', () => {
        console.log("File processing complete.");
    });

    rl.on('error', (err) => {
        console.error("Error reading or processing file:", err);
    });

});

lineCounter.on('error', (err) => {
    console.error("Error counting lines:", err);
});