import RNFS from 'react-native-fs';

export class TarExtractor {
  blockSize = 512;

  async read(
    tarFilePath: string,
    callback: (file: TarFile) => Promise<boolean | void>,
  ): Promise<void> {
    const { size: fileSize } = await RNFS.stat(tarFilePath);
    let offset = 0;

    while (offset < fileSize) {
      const headerBuffer = await this.readChunk(tarFilePath, offset, this.blockSize);
      const header = this.parseHeader(headerBuffer);

      if (!header) {
        break;
      }

      offset += this.blockSize;

      const fileDataSize = header.size;

      const file = new TarFile(header.name, fileDataSize, async () => {
        const fileDataBuffer = await this.readChunk(tarFilePath, offset, fileDataSize);
        return fileDataBuffer;
      });

      const shouldContinue = await callback(file);

      if (shouldContinue === false) {
        break;
      }

      offset += Math.ceil(fileDataSize / this.blockSize) * this.blockSize;
    }
  }

  async readChunk(filePath: string, offset: number, length: number): Promise<Buffer> {
    const buffer = await RNFS.read(filePath, length, offset, 'base64');
    return Buffer.from(buffer, 'base64');
  }

  parseHeader(buffer: Buffer): { name: string; size: number } | null {
    const name = buffer.slice(0, 100).toString().replace(/\0/g, '');
    const size = parseInt(buffer.slice(124, 136).toString(), 8);

    if (!name) {
      return null;
    }

    return { name, size };
  }
}

class TarFile {
  constructor(
    public name: string,
    public size: number,
    private readContentsFn: () => Promise<Buffer>,
  ) {}

  async read(): Promise<Buffer> {
    return this.readContentsFn();
  }
}
