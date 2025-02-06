const fs = require('fs');
const ProgressBar = require('progress');
const readline = require('readline');
const os = require('os');

/**
 * Converts a .txt file to .csv file and moves to a new path
 * @param {string} path - The path of the .txt file to be converted
 * @param {string} new_path - The path where the .csv file will be saved
 * @param {string} ext - The extension of the new file
 * @param {function} callback - The callback that will be called after the file has been converted and moved
 */
module.exports = (path, new_path, ext, callback) => {
    const temp_path = os.tmpdir();
    const txt_path = path;
    const txt_path_temp = temp_path + '/cpfl' + "." + ext;

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
            console.log(`O arquivo ${txt_path_temp} tem ${fs.statSync(txt_path_temp).size / (1024 * 1024)}MB`);
            // Mover para novo caminho
            const readStreamTemp = fs.createReadStream(txt_path_temp);
            const writeStreamNewPath = fs.createWriteStream(new_path);

            readStreamTemp.pipe(writeStreamNewPath);

            readStreamTemp.on('error', (err) => {
                console.error("Error reading temp file:", err);
            });

            writeStreamNewPath.on('error', (err) => {
                console.error("Error writing to new file:", err);
            });

            writeStreamNewPath.on('finish', () => {
                console.log("File moved.");
            });

            readStreamTemp.on('close', () => {
                fs.unlinkSync(txt_path_temp);
            });
            callback(txt_path_temp);
        });

        rl.on('error', (err) => {
            console.error("Error reading or processing file:", err);
        });

    });

    lineCounter.on('error', (err) => {
        console.error("Error counting lines:", err);
    });

}