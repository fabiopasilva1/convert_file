const fs = require('fs');
const readline = require('readline');
const os = require('os');
const ProgressBar = require('progress');
/**
 * Converts a .txt file to .csv file and moves to a new path
 * @param {string} path - The path of the to be converted
 * @param {string} name - The name of the .txt or .csv file
 * @param {string} new_path - The path where the .csv file will be saved
 * @param {string} ext - The extension of the new file
 * @param {number} chunk_size - The number of lines to process at once
 * @param {number} pause_time - The time to pause between processing each chunk, default is 400ms
 * @param {function} callback - The callback that will be called after the file has been converted and moved
 */
module.exports = async (path, name, new_path, ext, callback, chunk_size = 1000, pause_time = 400) => {
    console.log({
        path,
        name,
        new_path,
        ext,
        chunk_size,
        pause_time
    });

    const temp_path = os.tmpdir();
    const txt_path = path + '/' + name;
    const txt_path_temp = temp_path + '/' + name.split('.')[0] + "." + ext;

    // Create the 'temp' directory if it doesn't exist
    fs.mkdirSync(new_path, { recursive: true });

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

    lineCounter.on('close', async () => {
        console.log(`O arquivo ${txt_path} tem ${fs.statSync(txt_path).size / (1024 * 1024)}MB`);
        console.log(`O arquivo ${txt_path} tem ${lineCount} linhas.`);

        const bar = new ProgressBar('[:bar] :percent - :etas - :current/:total - :rate - :elapseds', {
            complete: '=',
            incomplete: ' ',
            width: 40,
            total: lineCount,

        });

        const size = fs.statSync(txt_path).size;
        const sizeMB = size / (1024 * 1024);
        bar.interrupt(`Tamanho do arquivo: ${sizeMB.toFixed(2)}MB - Faltam ${((sizeMB - (processedLines / (1024 * 1024))) / sizeMB * 100).toFixed(2)}% para concluir`);

        const readStreamForProcessing = fs.createReadStream(txt_path, { highWaterMark: 64 * 1024 }); // New stream for processing
        const rl = readline.createInterface({
            input: readStreamForProcessing,
            crlfDelay: Infinity
        });

        let chunk = [];
        rl.on('line', async (line) => {
            line = line.replace(/\t/g, ',').trim().replace(/\s+/g, ' ');

            chunk.push(line);
            if (chunk.length >= chunk_size) {
                fs.appendFile(txt_path_temp, chunk.join('\n') + '\n', (err) => {
                    if (err) console.error("Error writing to temp file:", err);
                });

                processedLines += chunk.length;
                bar.tick(chunk.length);
                chunk = [];
                rl.pause();
                await new Promise(resolve => setTimeout(resolve, pause_time));
                rl.resume();
            }
        });

        rl.on('close', async () => {
            if (chunk.length > 0) {
                fs.appendFile(txt_path_temp, chunk.join('\n'), (err) => {
                    if (err) console.error("Error writing to temp file:", err);
                });

                processedLines += chunk.length;
                bar.tick(chunk.length);
            }

            console.log("File processing complete.");
            console.log(`O arquivo ${txt_path_temp} tem ${fs.statSync(txt_path_temp).size / (1024 * 1024)}MB`);
            // Mover para novo caminho
            const readStreamTemp = fs.createReadStream(txt_path_temp);
            const writeStreamNewPath = fs.createWriteStream(new_path + '/' + name.split('.')[0] + '.' + ext);

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
            callback(new_path);
        });

        rl.on('error', (err) => {
            console.error("Error reading or processing file:", err);
        });

    });

    lineCounter.on('error', (err) => {
        console.error("Error counting lines:", err);
    });

}


