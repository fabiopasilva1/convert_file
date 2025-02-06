const assert = require('assert');
const fs = require('fs');
const path = require('path');
const convert = require('../index'); // Ou o nome do seu pacote

describe('convert function', () => {
    it('should throw an error when path is not provided', async () => {
        try {
            await convert({ file_name: 'test.txt', new_path: './newPath' });
            assert.fail('Expected an error to be thrown');
        } catch (error) {
            assert.strictEqual(error.message, 'path is required');
        }
    });

    it('should throw an error when file_name is not provided', async () => {
        try {
            await convert({ path: './', new_path: './newPath' });
            assert.fail('Expected an error to be thrown');
        } catch (error) {
            assert.strictEqual(error.message, 'file_name is required');
        }
    });

    it('should throw an error when new_path is not provided', async () => {
        try {
            await convert({ path: './', file_name: 'test.txt' });
            assert.fail('Expected an error to be thrown');
        } catch (error) {
            assert.strictEqual(error.message, 'new_path is required');
        }
    });


    // it('should convert a file correctly', async () => {
    //     const inputPath = path.join(__dirname, 'test.txt');
    //     const newFilePath = path.join(__dirname, 'newPath', 'test.csv');

    //     // Create a sample input file
    //     fs.writeFileSync(inputPath, "linha1,linha2\nlinha3,linha4"); // Vírgulas como exemplo

    //     await convert({
    //         path: inputPath, file_name: 'test.txt', new_path: newFilePath, ext: 'csv', callback: (new_path) => {
    //             assert.strictEqual(new_path, './newPath');
    //         }
    //     });

    //     assert.strictEqual(fs.existsSync(newFilePath), true);

    //     const csvContent = fs.readFileSync(newFilePath, 'utf8');
    //     assert.strictEqual(csvContent, "linha1,linha2\nlinha3,linha4\n"); // Verifica o conteúdo convertido

    //     // Limpeza (opcional, mas recomendado)
    //     fs.unlinkSync(inputPath);
    //     fs.unlinkSync(newFilePath);
    // });


    // it('should handle large files correctly', async () => {
    //     const largeFilePath = path.join(__dirname, 'largeFile.txt');
    //     const newLargeFilePath = path.join(__dirname, 'newPath', 'largeFile.csv');

    //     // Crie um arquivo grande de teste (exemplo - ajuste conforme necessário)
    //     const largeFileContent = Array(1000).fill("linha").join("\n"); // Exemplo: 1000 linhas
    //     fs.writeFileSync(largeFilePath, largeFileContent);

    //     await convert(largeFilePath, 'largeFile.txt', './newPath', 'csv', (new_path) => {
    //         assert.strictEqual(new_path, './newPath');
    //     });

    //     assert.strictEqual(fs.existsSync(newLargeFilePath), true);

    //     // Verifique o tamanho ou algumas linhas do arquivo grande convertido (para evitar lentidão)
    //     const stats = fs.statSync(newLargeFilePath);
    //     assert.ok(stats.size > 0); // Arquivo não vazio

    //     // Limpeza (opcional, mas recomendado)
    //     fs.unlinkSync(largeFilePath);
    //     fs.unlinkSync(newLargeFilePath);
    // });

    // it('should handle files with different delimiters correctly', async () => {
    //     const tabDelimitedFilePath = path.join(__dirname, 'tabDelimited.txt');
    //     const newTabDelimitedFilePath = path.join(__dirname, 'newPath', 'tabDelimited.csv');

    //     fs.writeFileSync(tabDelimitedFilePath, "linha1\tlinha2\nlinha3\tlinha4"); // Tab como delimitador

    //     await convert(tabDelimitedFilePath, 'tabDelimited.txt', './newPath', 'csv', (new_path) => {
    //         assert.strictEqual(new_path, './newPath');
    //     });

    //     assert.strictEqual(fs.existsSync(newTabDelimitedFilePath), true);
    //     const csvContent = fs.readFileSync(newTabDelimitedFilePath, 'utf8');
    //     assert.strictEqual(csvContent, "linha1,linha2\nlinha3,linha4\n");

    //     fs.unlinkSync(tabDelimitedFilePath);
    //     fs.unlinkSync(newTabDelimitedFilePath);
    // });

    // it('should call the callback function correctly', async () => {
    //     const callback = jest.fn();
    //     const inputPath = path.join(__dirname, 'test_callback.txt');
    //     fs.writeFileSync(inputPath, "test");

    //     await convert(inputPath, 'test_callback.txt', './newPath', 'csv', callback);

    //     assert.strictEqual(callback.mock.calls.length, 1);
    //     assert.strictEqual(callback.mock.calls[0][0], './newPath');

    //     fs.unlinkSync(inputPath);
    // });
});
