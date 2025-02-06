# @presstencao/convert_file

## Descrição

Este pacote é utilizado para converter arquivos `.txt` para `.csv` e mover o arquivo convertido para um novo caminho. Ele possui funcionalidades para manipulação de arquivos em chunks, permitindo o processamento de grandes volumes de dados.

## Instalação

Para instalar o pacote, utilize o npm:

```bash
npm install @presstencao/convert_file
```

## Uso

### Conversão de Arquivo `.txt` para `.csv`

A função principal do pacote realiza a conversão de um arquivo `.txt` para `.csv` e move o arquivo resultante para um novo diretório.

### Parâmetros

-   `options` (Object): Objeto de opções contendo os seguintes campos:
    -   `path` (string): O caminho do diretório onde o arquivo `.txt` está localizado.
    -   `file_name` (string): O nome do arquivo `.txt` que deseja converter.
    -   `new_path` (string): O caminho do diretório onde o arquivo `.csv` deve ser movido.
    -   `ext` (string): A extensão do arquivo que deseja converter (padrão: `csv`).
    -   `callback` (Function) [opcional]: A função de callback que será chamada após o término do processamento.
    -   `chunk_size` (number) [opcional]: O tamanho do chunk que será processado por vez (padrão: 1000).
    -   `pause_time` (number) [opcional]: O tempo de pausa entre cada chunk (padrão: 400ms).
    -   `header` (boolean) [opcional]: Indica se o arquivo tem um cabeçalho (padrão: false).

### Exemplo

```javascript
const convert = require("@presstencao/convert_file");

convert({
    path: "./",
    file_name: "example.txt",
    new_path: "./converted",
    ext: "csv",
    callback: console.log,
    chunk_size: 1000,
    pause_time: 400,
    header: false,
});
```

## Contribuição

Para contribuir com o projeto, envie um pull request no repositório do GitHub: [convert_file](https://github.com/fabiopasilva1/convert_file).

## Licença

Este projeto está licenciado sob a Licença ISC.
