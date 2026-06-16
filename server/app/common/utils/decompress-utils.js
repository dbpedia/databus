const pako = require('pako');
const seekBzip = require('seek-bzip');

class DecompressUtils {

    static maxPreviewLength = 4096;

    static async decodeGzipPreview(url, maxPreviewLength = DecompressUtils.maxPreviewLength) {
        try {
            const res = await fetch(url);
            if (!res.body) return null;

            const reader = res.body.getReader();
            const inflator = new pako.Inflate({ to: 'string' });

            let decoded = '';
            let done = false;

            while (!done) {
                const { value: chunk, done: streamDone } = await reader.read();
                if (chunk) inflator.push(chunk, false);

                if (inflator.result) {
                    decoded += inflator.result;
                    inflator.result = null;
                }

                if (decoded.length >= maxPreviewLength) break;
                if (streamDone) done = true;
            }

            return decoded.slice(0, maxPreviewLength);

        } catch (e) {
            return null;
        }
    }

    static concatUint8Arrays(chunks, totalLength) {
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        return result;
    }

    static async decodeBz2Preview(url, maxPreviewLength = DecompressUtils.maxPreviewLength) {
        try {
            const res = await fetch(url);
            if (!res.body) return null;

            const reader = res.body.getReader();
            const chunks = [];
            let totalLength = 0;
            let firstBlockFound = false;

            const BLOCK_MAGIC = [0x31, 0x41, 0x59, 0x26, 0x53, 0x59];

            function findSecondBlockIndex(buffer) {
                let count = 0;
                for (let i = 0; i <= buffer.length - 6; i++) {
                    if (BLOCK_MAGIC.every((b, j) => buffer[i + j] === b)) {
                        count++;
                        if (count === 2) return i; // index of second block start
                    }
                }
                return -1;
            }

            while (!firstBlockFound) {
                const { value: chunk, done } = await reader.read();
                if (chunk) {
                    chunks.push(chunk);
                    totalLength += chunk.length;
                }

                const buffer = DecompressUtils.concatUint8Arrays(chunks, totalLength);
                const secondIndex = findSecondBlockIndex(buffer);

                if (secondIndex > 0 || done) {
                    const firstBlockBytes = secondIndex > 0 ? buffer.slice(0, secondIndex) : buffer;
                    const decoded = seekBzip.decode(firstBlockBytes);
                    return new TextDecoder().decode(decoded).slice(0, maxPreviewLength);
                }

                if (done) break;
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    static async decodeTextPreview(url, maxPreviewLength = DecompressUtils.maxPreviewLength) {
        try {
            const res = await fetch(url);
            const arrayBuffer = await res.arrayBuffer();
            const text = new TextDecoder().decode(new Uint8Array(arrayBuffer));
            return text.slice(0, maxPreviewLength);
        } catch (e) {
            return null;
        }
    }

    static async decodePreview(url, compression = null, maxPreviewLength = DecompressUtils.maxPreviewLength) {
        compression = (compression || '').toLowerCase();

        if (compression === 'gz' || compression === 'gzip') {
            return await DecompressUtils.decodeGzipPreview(url, maxPreviewLength);
        } else if (compression === 'bz2') {
            return await DecompressUtils.decodeBz2Preview(url, maxPreviewLength);
        } else {
            return await DecompressUtils.decodeTextPreview(url, maxPreviewLength);
        }
    }
}

module.exports = DecompressUtils;
