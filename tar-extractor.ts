import RNFS from 'react-native-fs';
import { Buffer } from 'buffer';

export class TarExtractor {
  blockSize = 512;
  debug = false;

  async read(
    tarFilePath: string,
    callback: (file: TarFile) => Promise<boolean | void>,
  ): Promise<void> {
    const { size: fileSize } = await RNFS.stat(tarFilePath);
    let offset = 0;
    let paxHeaderData = {};

    this.__log(`Reading ${tarFilePath} (${fileSize} bytes)`);
    while (offset < fileSize) {
      this.__log(`Reading header at offset ${offset}`);
      const headerBuffer = await this.readChunk(tarFilePath, offset, this.blockSize);
      const header = this.parseHeader(headerBuffer, paxHeaderData);
      if (!header) {
        this.__log(`Invalid header at offset ${offset}`);
        break;
      }

      offset += this.blockSize;

      if (header.isPax()) {
        this.__log(`Found PAX header at offset ${offset}, size ${header.size}`);
        // PAX headers can span multiple blocks
        const paxBuffer = await this.readChunk(tarFilePath, offset, header.size);
        paxHeaderData = this.parsePaxHeader(paxBuffer);
        const paxHeaderSize = Math.ceil(header.size / this.blockSize) * this.blockSize;
        offset += paxHeaderSize;
        continue;  // Skip to the next iteration to handle the next header
      }

      this.__log(`Iterating over file ${header.name} at offset ${offset}, size ${header.size}`);
      const fileDataSize = header.size;
      const file = new TarFile(header, () => this.readChunk(tarFilePath, offset, fileDataSize));
      const shouldContinue = await callback(file);
      if (shouldContinue === false) {
        break;
      }

      offset += Math.ceil(fileDataSize / this.blockSize) * this.blockSize;
      paxHeaderData = {};  // Clear the PAX header data for the next file
    }
  }

  async readChunk(filePath: string, offset: number, length: number): Promise<Buffer> {
    const buffer = await RNFS.read(filePath, length, offset, 'base64');
    return Buffer.from(buffer, 'base64');
  }

  parseHeader(buffer: Buffer, paxHeaderData: Record<string, any>): TarFileHeader | null {
    const h = new TarFileHeader();

    h.name = buffer.subarray(0, 100).toString('utf8').replace(/\0+$/, '');
    // XXX: Remove this debug print later
    this.__log(`parsed file name '${h.name}' from header block of size ${buffer.length}`);
    if (!h.name) {
        return null;
    }

    // 8 bytes for mode
    // 8 bytes for uid
    // 8 bytes for gid
    h.size = parseInt(buffer.subarray(124, 136).toString('utf8'), 8);
    // 12 bytes for mtime
    // 8 bytes for checksum
    h.typeFlag = buffer.subarray(156, 157).toString('utf8');
    // 100 bytes for linkname
    h.ustarIndicator = buffer.subarray(257, 263).toString('utf8');
    h.prefix = buffer.subarray(345, 500).toString('utf8').replace(/\0+$/, '');
    if (h.prefix) {
        h.name = `${h.prefix}/${h.name}`;
    }

    // Update the header data with PAX header data
    if (paxHeaderData['path']) {
      h.name = paxHeaderData['path'];
    }
    if (paxHeaderData['size']) {
      h.size = parseInt(paxHeaderData['size'], 10);
    }

    return h;
  }

  parsePaxHeader(paxBuffer: Buffer): Record<string, any> {
    let offset = 0;
    const paxHeaderData = {};
    
    while (offset < paxBuffer.length) {
      // Find the space character that separates the size field from the key-value pair.
      const spaceIndex = paxBuffer.indexOf(' ', offset);
      if (spaceIndex === -1) {
        break; // No space found, so we're done.
      }
      
      // Read the size field and convert it to a number.
      const size = parseInt(paxBuffer.toString('utf8', offset, spaceIndex), 10);
      if (isNaN(size)) {
        break; // The size field is not a valid number, so we're done.
      }
      
      // Read the entire record.
      const record = paxBuffer.toString('utf8', offset, offset + size);
      // Find the equals sign that separates the key from the value.
      const equalsIndex = record.indexOf('=');
      if (equalsIndex !== -1) {
        const key = record.slice(spaceIndex + 1, equalsIndex);
        const value = record.slice(equalsIndex + 1, -1); // Exclude the newline character.
        if (key && value) {
          paxHeaderData[key] = value;
        }
      }
      
      // Move to the next record.
      offset += size;
    }
    
    return paxHeaderData;
  }

  __log(...args: any[]): void {
    if (this.debug) {
      args[0] = `rnfs-tar: ${args[0]}`;
      console.log.apply(console, args);
    }
  }
}

export class TarFileHeader {
  constructor(
    public name?: string,
    public size?: number,
    public typeFlag?: string,
    public ustarIndicator?: string,
    public prefix?: string,
  ) {}

  isPax(): boolean {
    return this.typeFlag === 'x' || this.typeFlag === 'g';
  }
}

export class TarFile {
  constructor(
    public header: TarFileHeader,
    private readContentsFn: () => Promise<Buffer>,
  ) {}

  async read(): Promise<Buffer> {
    return this.readContentsFn();
  }
}
