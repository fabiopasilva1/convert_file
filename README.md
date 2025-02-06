# convert_file

This module converts a `.txt` file to a `.csv` file and moves it to a new path.

## Installation

You can install this module with npm: npm i @presstencao/convert_file

## API

### convert(options)

Converts a `.txt` file to a `.csv` file and moves it to a new path.

#### Options

##### path

Type: `string`

The path of the directory where the `.txt` file is located.

##### file_name

Type: `string`

The name of the `.txt` file you want to convert.

##### new_path

Type: `string`

The path of the directory where the `.csv` file should be moved.

##### ext

Type: `string`

The extension of the file that you want to convert (default: `csv`).

##### callback

Type: `Function`

The callback function that will be called after the end of the process (optional).

##### chunk_size

Type: `number`

The size of the chunk that will be processed at once (default: 1000).

##### pause_time

Type: `number`

The time of pause between each chunk (default: 400ms).

##### header

Type: `boolean`

Indicates if the file has a header (default: false).
