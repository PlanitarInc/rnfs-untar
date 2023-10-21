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

      const file = new TarFile(header, async () => {
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

  parseHeader(buffer: Buffer): TarFileHeader | null {
    const h = new TarFileHeader();

    h.name = buffer.subarray(0, 100).toString().replace(/\0/g, '');
    if (!h.name) {
      return null;
    }

    // 8 bytes for mode
    // 8 bytes for uid
    // 8 bytes for gid
    h.size = parseInt(buffer.subarray(124, 136).toString(), 8);
    // 12 bytes for mtime
    // 8 bytes for checksum
    h.typeFlag = buffer.subarray(156, 157).toString();
    // 100 bytes for linkname
    h.ustarIndicator = buffer.subarray(257, 263).toString();
    h.prefix = buffer.subarray(345, 500).toString().replace(/\0/g, '');
    if (h.prefix) {
      h.name = `${h.prefix}/${h.name}`;
    }

    return h;
  }
}

class TarFileHeader {
  constructor(
    public name?: string,
    public size?: number,
    public typeFlag?: string,
    public ustarIndicator?: string,
    public prefix?: string,
  ) {}
}

class TarFile {
  constructor(
    public header: TarFileHeader,
    private readContentsFn: () => Promise<Buffer>,
  ) {}

  async read(): Promise<Buffer> {
    return this.readContentsFn();
  }
}
