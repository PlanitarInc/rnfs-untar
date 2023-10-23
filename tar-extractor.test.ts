import { jest, describe, expect, test } from '@jest/globals';
import { TarExtractor } from './tar-extractor';
import { listTestTarCases, toPrintableString } from './utils.test';

jest.mock('react-native-fs');

describe('TarExtractor', () => {
  const testDirectory = './test.d/';

  listTestTarCases().forEach(tc => {
    describe(tc.filename, () => {
      test('list all files', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number][] = [];

        await tarExtractor.read(tc.tarFilePath, async file => {
          extractedFiles.push([file.header.name, file.header.size]);
          return true; // Continue reading all files
        });

        expect(extractedFiles).toEqual(
          tc.expectedFiles.map(([name, size]) => [name, size] as [string, number]),
        );
      });

      test('read all files', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        await tarExtractor.read(tc.tarFilePath, async file => {
          extractedFiles.push([
            file.header.name,
            file.header.size,
            toPrintableString(await file.read()),
          ]);
          return true; // Continue reading all files
        });

        expect(extractedFiles).toEqual(tc.expectedFiles);
      });

      test('read 3 files', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        let idx = 0;
        await tarExtractor.read(tc.tarFilePath, async file => {
          extractedFiles.push([
            file.header.name,
            file.header.size,
            toPrintableString(await file.read()),
          ]);
          return ++idx < 3; // Stop reading after 3 files
        });

        expect(extractedFiles).toEqual(tc.expectedFiles.slice(0, 3));
      });

      test('read 1st file', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        let idx = 0;
        await tarExtractor.read(tc.tarFilePath, async file => {
          if (idx === 0) {
            extractedFiles.push([
              file.header.name,
              file.header.size,
              toPrintableString(await file.read()),
            ]);
          }
          return ++idx < 1; // Stop reading after the 2nd file
        });

        expect(extractedFiles).toEqual(tc.expectedFiles.slice(0, 1));
      });

      test('read 2nd file', async () => {
        const tarExtractor = new TarExtractor();
        const extractedFiles: [string, number, string][] = [];

        let idx = 0;
        await tarExtractor.read(tc.tarFilePath, async file => {
          if (idx === 1) {
            extractedFiles.push([
              file.header.name,
              file.header.size,
              toPrintableString(await file.read()),
            ]);
          }
          return ++idx < 2; // Stop reading after the 2nd file
        });

        expect(extractedFiles).toEqual(tc.expectedFiles.slice(1, 2));
      });
    });
  });
});
