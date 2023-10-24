# `rnfs-untar` [![npm](https://img.shields.io/npm/v/%40planitar%2Frnfs-untar)](https://www.npmjs.com/package/@planitar/rnfs-untar) [![CI](https://github.com/PlanitarInc/rnfs-untar/actions/workflows/node.js.yml/badge.svg)](https://github.com/PlanitarInc/rnfs-untar/actions/workflows/node.js.yml) [![Coverage Status](https://coveralls.io/repos/github/PlanitarInc/rnfs-untar/badge.svg)](https://coveralls.io/github/PlanitarInc/rnfs-untar)

`rnfs-untar` is a utility for extracting files from TAR archives in React Native environments. This library provides both a low-level API for granular control and high-level API functions for common tasks such as listing all files, finding a specific file, and reading the entire TAR archive.

## Installation

```
npm install @planitar/rnfs-untar
```

## High-Level API Usage

### `listFiles(tarFilePath: string): Promise<string[]>`

Lists all files in the TAR archive.

```javascript
import { listFiles } from '@planitar/rnfs-untar';

listFiles('/path/to/tar/archive.tar').then(files => {
  console.log('Files:', files);
});
```

### `findFile(tarFilePath: string, fileName: string | RegExp): Promise<TarFile | null>`

Finds a specific file in the TAR archive.

```javascript
import { findFile } from '@planitar/rnfs-untar';

// Match by exact full path.
findFile('/path/to/tar/archive.tar', 'specific/file.txt').then(file => {
  if (file) {
    console.log('File found:', file.header.name);
    console.log('File content:', (await file.read()).toString('utf-8'));
  } else {
    console.log('File not found.');
  }
});

// Match by regexp.
findFile('/path/to/tar/archive.tar', /\bfile\.txt$/).then(file => {
  if (file) {
    console.log('File found:', file.header.name);
    console.log('File content:', (await file.read()).toString('utf-8'));
  } else {
    console.log('File not found.');
  }
});
```

### `readTar(tarFilePath: string, callback: (file: TarFile) => Promise<boolean | void>): Promise<void>`

Reads the entire TAR archive and calls the provided callback function for each file in the archive.

```javascript
import { readTar } from '@planitar/rnfs-untar';

readTar('/path/to/tar/archive.tar', async (file) => {
  console.log('File:', file.header.name);
  console.log('Content:', (await file.read()).toString('utf-8'));
});
```

## Low-Level API Usage

The low-level API provides direct access to the `TarExtractor` class.

```javascript
import { TarExtractor } from '@planitar/rnfs-untar';

const tarExtractor = new TarExtractor();

tarExtractor.read('/path/to/tar/archive.tar', async (file) => {
  console.log('File:', file.header.name);
  console.log('Content:', (await file.read()).toString('utf-8'));
});
```

## API Reference

### `TarExtractor`

Low-level API for reading TAR archives.

#### `read(tarFilePath: string, callback: (file: TarFile) => Promise<boolean | void>): Promise<void>`

Reads the TAR archive at the given file path and calls the provided callback function for each file in the archive.

### `TarFile`

Represents a file in a TAR archive.

#### `header: TarFileHeader`

The header information for the file.

#### `read(): Promise<Buffer>`

Reads and returns the contents of the file as a Buffer.

### `TarFileHeader`

Represents the header of a file in a TAR archive.

#### `name: string`

The name of the file.

#### `size: number`

The size of the file.

#### `typeFlag: string`

The type flag of the file.

#### `ustarIndicator: string`

The ustar indicator of the file.

#### `prefix: string`

The prefix of the file.

#### `isPax(): boolean`

Returns `true` if the header is a PAX header, `false` otherwise.
