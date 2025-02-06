const fs = require('fs');
const readline = require('readline');
const os = require('os');
const ProgressBar = require('progress');

/**
 * Converts a `.txt` file to a specified format (e.g., `.csv`) and moves it to a new path.
 * The conversion process involves reading the file line by line, determining the delimiter,
 * and writing converted content to a temporary file before moving it to the specified new path.
 * 
 * @param {Object} options - Options for the conversion process.
 * @param {string} options.path - The directory of the source file.
 * @param {string} options.name - The name of the source file.
 * @param {string} options.new_path - The directory to move the converted file to.
 * @param {string} options.ext - The extension of the converted file.
 * @param {Function} options.callback - Callback function to be called after conversion.
 * @param {number} [options.chunk_size=1000] - Number of lines to process per chunk.
 * @param {number} [options.pause_time=400] - Pause time in milliseconds between processing chunks.
 * @param {boolean} [options.header=false] - Indicates if the first line should be treated as a header.
 */

module.exports = async ({ path, name, new_path, ext, callback, chunk_size = 1000, pause_time = 400, header = false }) => {
    console.log("Início da função converter");

    try {
        console.log("Parâmetros recebidos:", { path, name, new_path, ext, chunk_size, pause_time, header });

        // 1. Cria um diretório temporário para armazenar o arquivo convertido
        const temp_path = os.tmpdir();
        // 2. Cria o caminho do arquivo temporário
        const txt_path_temp = temp_path + '/' + name.split('.')[0] + "." + ext;

        console.log("Caminhos:", { txt_path: path + '/' + name, txt_path_temp });

        // 3. Cria o diretório de destino se ele não existir
        fs.mkdirSync(new_path, { recursive: true });
        console.log("Diretório criado:", new_path);

        // 4. Deleta o arquivo temporário existente, se houver
        try {
            fs.unlinkSync(txt_path_temp);
            console.log("Arquivo temporário deletado:", txt_path_temp);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error("Erro ao deletar arquivo temporário existente:", err);
            }
        }

        // 5. Cria um read stream para ler o arquivo fonte
        const readStream = fs.createReadStream(path + '/' + name, { highWaterMark: 64 * 1024 });


        // 6. Conta o número de linhas do arquivo fonte
        let lineCount = 0;
        const lineCounter = readline.createInterface({
            input: readStream,
            crlfDelay: Infinity
        });

        lineCounter.on('line', (line) => {
            lineCount++;
        });

        lineCounter.on('close', async () => {
            console.log("Contagem de linhas concluída. Total de linhas:", lineCount);

            // 7. Detecta o delimitador do arquivo
            let delimiter = null;
            const delimiterDetector = readline.createInterface({
                input: readStream,
                crlfDelay: Infinity
            });

            delimiterDetector.on('line', (line) => {
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

            delimiterDetector.on('close', async () => {
                console.log("Delimitador detectado:", delimiter);

                if (delimiter === null) {
                    delimiter = ' ';
                    console.warn("Nenhum delimitador claro detectado. Usando espaço como padrão.");
                }

                // 8. Converte o arquivo
                const bar = new ProgressBar('[:bar] :percent - :etas - :current/:total - :rate - :elapseds', {
                    complete: '=',
                    incomplete: ' ',
                    width: 40,
                    total: lineCount,
                });

                const size = fs.statSync(path + '/' + name).size;
                const sizeMB = size / (1024 * 1024);
                bar.interrupt(`Tamanho do arquivo: ${sizeMB.toFixed(2)}MB - Faltam ${((sizeMB - (lineCount / (1024 * 1024))) / sizeMB * 100).toFixed(2)}% para concluir`);

                const readStreamForProcessing = fs.createReadStream(path + '/' + name, { highWaterMark: 64 * 1024 });
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

                        lineCount -= chunk.length;
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

                        lineCount -= chunk.length;
                        bar.tick(chunk.length);
                    }

                    console.log("Processamento do arquivo concluído.");
                    console.log(`Arquivo ${txt_path_temp} tem ${fs.statSync(txt_path_temp).size / (1024 * 1024)}MB`);

                    // 9. Move o arquivo convertido para o diretório de destino
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

            delimiterDetector.on('error', (err) => {
                console.error("Erro ao detectar delimitador:", err);
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
