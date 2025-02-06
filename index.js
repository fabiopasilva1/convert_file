#!/usr/bin/env node
const fs = require('fs');
const readline = require('readline');
const os = require('os');
const ProgressBar = require('progress');

/**
 * Converte um arquivo .txt para .csv, corrigindo caracteres especiais,
 * tratando cabeçalho (opcional) e removendo vírgulas extras.
 * @param {string} path - O caminho do arquivo a ser convertido
 * @param {string} name - O nome do arquivo .txt ou .csv
 * @param {string} new_path - O caminho onde o arquivo .csv será salvo
 * @param {string} ext - A extensão do novo arquivo
 * @param {function} callback - O callback que será chamado após a conversão e movimentação do arquivo
 * @param {number} chunk_size - O número de linhas a serem processadas por vez
 * @param {number} pause_time - O tempo de pausa entre o processamento de cada chunk
 * @param {boolean} header - Indica se a primeira linha do arquivo é um cabeçalho (opcional)
 */
module.exports = async (path, name, new_path, ext, callback, chunk_size = 1000, pause_time = 400, header = false) => {
    console.log({
        path,
        name,
        new_path,
        ext,
        chunk_size,
        pause_time,
        header
    });

    const temp_path = os.tmpdir();
    const txt_path = path + '/' + name;
    const txt_path_temp = temp_path + '/' + name.split('.')[0] + "." + ext;

    fs.mkdirSync(new_path, { recursive: true });

    try {
        fs.unlinkSync(txt_path_temp);
    } catch (err) {
        if (err.code !== 'ENOENT') {
            console.error("Erro ao deletar arquivo temporário existente:", err);
        }
    }

    const readStream = fs.createReadStream(txt_path, { highWaterMark: 64 * 1024 });

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
        if (delimiter === null) {
            delimiter = ' ';
            console.warn("Nenhum delimitador claro detectado. Usando espaço como padrão.");
        }

        console.log(`Delimitador detectado: '${delimiter}'`);
        console.log(`Arquivo ${txt_path} tem ${fs.statSync(txt_path).size / (1024 * 1024)}MB`);
        console.log(`Arquivo ${txt_path} tem ${lineCount} linhas.`);

        const bar = new ProgressBar('[:bar] :percent - :etas - :current/:total - :rate - :elapseds', {
            complete: '=',
            incomplete: '-',
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

            if (delimiter === '\t') {


                line = line.replace(/\t/g, ',');
            }
            if (delimiter === ';') {
                line = line.replace(/;/g, ',');
            }
            if (delimiter === ' ') {
                line = line.replace(/  /g, ',');
            }
            // remove espaços em excesso e entre as delimitadores
            line = line.replace(/, +/g, ',').replace(/ +,/g, ',');




            if (header && isFirstLine) {
                fs.appendFile(txt_path_temp, line.trim().replace(/s/g, '') + '\n', (err) => {
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
};