import { jest, describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { TarExtractor } from './tar-extractor';

jest.mock('react-native-fs');

describe('TarExtractor', () => {
  const testDirectory = './test.d/';

  fs.readdirSync(testDirectory).forEach(file => {
    if (path.extname(file) !== '.tar') {
      return;
    }

    describe(file, () => {
      const basename = path.basename(file, '.tar');
      const tarFilePath = path.join(testDirectory, file);
      const expectedFiles = loadJSON(path.join(testDirectory, `${basename}.contents.json`));

      test('list all files', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number][] = [];

        await tarExtractor.read(tarFilePath, async file => {
          extractedFiles.push([file.header.name, file.header.size]);
          return true; // Continue reading all files
        });

        expect(extractedFiles).toEqual(
          expectedFiles.map(([name, size]) => [name, size] as [string, number]),
        );
      });

      test('read all files', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        await tarExtractor.read(tarFilePath, async file => {
          extractedFiles.push([
            file.header.name,
            file.header.size,
            toPrintableString(await file.read()),
          ]);
          return true; // Continue reading all files
        });

        expect(extractedFiles).toEqual(expectedFiles);
      });

      test('read 3 files', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        let idx = 0;
        await tarExtractor.read(tarFilePath, async file => {
          extractedFiles.push([
            file.header.name,
            file.header.size,
            toPrintableString(await file.read()),
          ]);
          return ++idx < 3; // Stop reading after 3 files
        });

        expect(extractedFiles).toEqual(expectedFiles.slice(0, 3));
      });

      test('read 1st file', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        let idx = 0;
        await tarExtractor.read(tarFilePath, async file => {
          if (idx === 0) {
            extractedFiles.push([
              file.header.name,
              file.header.size,
              toPrintableString(await file.read()),
            ]);
          }
          return ++idx < 1; // Stop reading after the 2nd file
        });

        expect(extractedFiles).toEqual(expectedFiles.slice(0, 1));
      });

      test('read 2nd file', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        let idx = 0;
        await tarExtractor.read(tarFilePath, async file => {
          if (idx === 1) {
            extractedFiles.push([
              file.header.name,
              file.header.size,
              toPrintableString(await file.read()),
            ]);
          }
          return ++idx < 2; // Stop reading after the 2nd file
        });

        expect(extractedFiles).toEqual(expectedFiles.slice(1, 2));
      });
    });
  });
});

function loadJSON(file: string): any {
  const buf = fs.readFileSync(file);
  const exp = JSON.parse(buf.toString('utf-8'));
  return exp;
}

function toPrintableString(buffer) {
  const printableChars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

  let result = '';
  for (let i = 0; i < buffer.length; i++) {
    const char = buffer.toString('utf8', i, i + 1);
    if (printableChars.includes(char)) {
      result += char;
    } else {
      result += '\\x' + buffer[i].toString(16).padStart(2, '0');
    }
  }

  return result;
}
