const fs = require('fs');
const readline = require('readline');
const os = require('os');
const ProgressBar = require('progress');

module.exports = async ({ path, name, new_path, ext, callback, chunk_size = 1000, pause_time = 400, header = false }) => {
    console.log("Início da função converter");

    try {
        console.log("Parâmetros recebidos:", { path, name, new_path, ext, chunk_size, pause_time, header });

        const temp_path = os.tmpdir();
        const txt_path = path + '/' + name;
        const txt_path_temp = temp_path + '/' + name.split('.')[0] + "." + ext;

        console.log("Caminhos:", { txt_path, txt_path_temp });

        fs.mkdirSync(new_path, { recursive: true });
        console.log("Diretório criado:", new_path);

        try {
            fs.unlinkSync(txt_path_temp);
            console.log("Arquivo temporário deletado:", txt_path_temp);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error("Erro ao deletar arquivo temporário existente:", err);
            }
        }

        const readStream = fs.createReadStream(txt_path, { highWaterMark: 64 * 1024 });
        console.log("Read stream criado:", readStream);

        let lineCount = 0;
        let processedLines = 0;
        let delimiter = null;
        let isFirstLine = true;

        const lineCounter = readline.createInterface({
            input: readStream,
            crlfDelay: Infinity
        });

        lineCounter.on('line', (line) => {
            lineCount++;
            if (delimiter === null) {
                if (line.includes('\t')) {
                    delimiter = '\t';
                } else if (line.includes(';')) {
                    delimiter = ';';
                } else if (line.includes(' ')) {
                    delimiter = ' ';
                }
            }
        });

        lineCounter.on('close', async () => {
            console.log("Contagem de linhas concluída. Delimitador:", delimiter);

            if (delimiter === null) {
                delimiter = ' ';
                console.warn("Nenhum delimitador claro detectado. Usando espaço como padrão.");
            }

            console.log(`Delimitador detectado: '${delimiter}'`);
            console.log(`Arquivo ${txt_path} tem ${fs.statSync(txt_path).size / (1024 * 1024)}MB`);
            console.log(`Arquivo ${txt_path} tem ${lineCount} linhas.`);

            const bar = new ProgressBar('[:bar] :percent - :etas - :current/:total - :rate - :elapseds', {
                complete: '=',
                incomplete: ' ',
                width: 40,
                total: lineCount,
            });

            const size = fs.statSync(txt_path).size;
            const sizeMB = size / (1024 * 1024);
            bar.interrupt(`Tamanho do arquivo: ${sizeMB.toFixed(2)}MB - Faltam ${((sizeMB - (processedLines / (1024 * 1024))) / sizeMB * 100).toFixed(2)}% para concluir`);

            const readStreamForProcessing = fs.createReadStream(txt_path, { highWaterMark: 64 * 1024 });
            const rl = readline.createInterface({
                input: readStreamForProcessing,
                crlfDelay: Infinity
            });

            let chunk = [];

            rl.on('line', async (line) => {
                line = line.replace(new RegExp(delimiter, 'g'), ',').trim();


                line = line.replace(/,\s*$/, '').replace(/\s*,/g, ',');

                if (header && isFirstLine) {
                    fs.appendFile(txt_path_temp, line + '\n', (err) => {
                        if (err) console.error("Erro ao escrever cabeçalho no arquivo temporário:", err);
                    });
                    isFirstLine = false;
                } else {
                    chunk.push(line);
                }

                if (chunk.length >= chunk_size) {
                    const formattedChunk = chunk.join('\n') + '\n';
                    fs.appendFile(txt_path_temp, formattedChunk, (err) => {
                        if (err) console.error("Erro ao escrever no arquivo temporário:", err);
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
                    const formattedChunk = chunk.join('\n') + '\n';
                    fs.appendFile(txt_path_temp, formattedChunk, (err) => {
                        if (err) console.error("Erro ao escrever no arquivo temporário:", err);
                    });

                    processedLines += chunk.length;
                    bar.tick(chunk.length);
                }

                console.log("Processamento do arquivo concluído.");
                console.log(`Arquivo ${txt_path_temp} tem ${fs.statSync(txt_path_temp).size / (1024 * 1024)}MB`);

                const readStreamTemp = fs.createReadStream(txt_path_temp);
                const writeStreamNewPath = fs.createWriteStream(new_path + '/' + name.split('.')[0] + '.' + ext);

                readStreamTemp.pipe(writeStreamNewPath);

                readStreamTemp.on('error', (err) => {
                    console.error("Erro ao ler arquivo temporário:", err);
                });

                writeStreamNewPath.on('error', (err) => {
                    console.error("Erro ao escrever novo arquivo:", err);
                });

                writeStreamNewPath.on('finish', () => {
                    console.log("Arquivo movido.");
                });

                readStreamTemp.on('close', () => {
                    fs.unlinkSync(txt_path_temp);
                });

                callback(new_path);
            });

            rl.on('error', (err) => {
                console.error("Erro ao ler ou processar arquivo:", err);
            });
        });

        lineCounter.on('error', (err) => {
            console.error("Erro ao contar linhas:", err);
        });
    } catch (error) {
        console.error("Erro na função converter:", error);
    }

    console.log("Fim da função converter");
};