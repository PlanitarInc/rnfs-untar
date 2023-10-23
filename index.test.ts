import { jest, describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import { findFile, listFiles, readTar } from './index';
import { listTestTarCases, toPrintableString } from './utils.test';

jest.mock('react-native-fs');

describe('listFiles', () => {
  listTestTarCases().forEach(tc => {
    test(tc.filename, async () => {
      expect(
        await listFiles(tc.tarFilePath),
      ).toEqual(
        tc.expectedFiles.map(([name]) => name),
      );
    });
  });
});

describe('findFile', () => {
  const tarFilePath = './test.d/01-simple.tar';

  test('exact match', async () => {
    expect(
      await findFile(tarFilePath, '3.txt').then(async f => [
        f.header.name,
        f.header.size,
        (await f.read()).toString('utf8'),
      ]),
    ).toEqual([
      '3.txt',
       5,
       'three',
    ]);
  });

  test('exact match w/ directory', async () => {
    expect(
      await findFile(tarFilePath, 'directory/2.txt').then(async f => [
        f.header.name,
        f.header.size,
      ]),
    ).toEqual(
      ['directory/2.txt', 3],
    );
  });

  test('regexp match', async () => {
    expect(
      await findFile(tarFilePath, /\.json$/).then(async f => [
        f.header.name,
        f.header.size,
        (await f.read()).toString('utf8'),
      ]),
    ).toEqual([
      'object.json',
      16,
      '{"prop":"value"}',
    ]);
  });

  test('exact mismatch', async () => {
    await expect(findFile(tarFilePath, '9.txt')).rejects.toThrowError('File not found: 9.txt');
  });

  test('regexp mismatch', async () => {
    await expect(findFile(tarFilePath, /qwe\.zip$/)).rejects.toThrowError('File not found: /qwe\\.zip$/');
  });
});

describe('readTar', () => {
  listTestTarCases().forEach(tc => {
    test(tc.filename, async () => {
      const extractedFiles: [string, number, string][] = [];

      await readTar(tc.tarFilePath, async file => {
        extractedFiles.push([
          file.header.name,
          file.header.size,
          toPrintableString(await file.read()),
        ]);
        return true; // Continue reading all files
      });

      expect(extractedFiles).toEqual(tc.expectedFiles);
    });
  });
});
