import { TarExtractor, TarFile, TarFileHeader } from './tar-extractor';

export { TarExtractor, TarFile, TarFileHeader };

export function listFiles(tarFilePath: string): Promise<string[]> {
  const tarExtractor = new TarExtractor();
  const files: string[] = [];

  return tarExtractor.read(tarFilePath, async file => {
    files.push(file.header.name);
    return true; // Continue reading all files
  }).then(() => files);
};

export function findFile(tarFilePath: string, fileName: string | RegExp): Promise<TarFile | null> {
  const tarExtractor = new TarExtractor();
  let foundFile: TarFile | null = null;

  return tarExtractor.read(tarFilePath, async file => {
    if (typeof fileName === 'string' && file.header.name === fileName) {
      foundFile = file;
      return false; // Stop reading
    }
    if (fileName instanceof RegExp && fileName.test(file.header.name)) {
      foundFile = file;
      return false; // Stop reading
    }
    return true; // Continue reading all files
  }).then(() => foundFile || Promise.reject(new Error(`File not found: ${fileName}`)));
};

export function readTar(
  tarFilePath: string,
  callback: (file: TarFile) => Promise<boolean | void>,
): Promise<void> {
  const tarExtractor = new TarExtractor();
  return tarExtractor.read(tarFilePath, callback);
};
