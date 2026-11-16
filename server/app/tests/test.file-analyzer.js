const { suite } = require('uvu');
const assert = require('uvu/assert');
const analyzer = require('../common/file-analyzer');

const test = suite('file-analyzer');

function detect(url, disposition) {
  const headers = disposition != undefined ? { 'content-disposition': disposition } : {};
  return analyzer.getFormatAndCompression(url, headers);
}

test('detects format and compression from the download URL', () => {
  assert.equal(detect('https://example.org/data.nt.bz2'), { formatExtension: 'nt', compression: 'bz2' });
  assert.equal(detect('https://example.org/data.ttl'), { formatExtension: 'ttl', compression: 'none' });
  assert.equal(detect('https://example.org/data.nt.gz#part'), { formatExtension: 'nt', compression: 'gz' });
});

test('ignores query string and fragment of the download URL', () => {
  assert.equal(detect('https://zenodo.org/records/1/files/data.nt.bz2?download=1'), { formatExtension: 'nt', compression: 'bz2' });
  assert.equal(detect('https://example.org/data.ttl?raw=true'), { formatExtension: 'ttl', compression: 'none' });
  assert.equal(detect('https://example.org/data.nt.gz?raw=true#L1'), { formatExtension: 'nt', compression: 'gz' });
  assert.equal(detect('https://example.com/data.ttl.gz?redirect=/downloads/file'), { formatExtension: 'ttl', compression: 'gz' });
});

test('prefers the content-disposition filename over the URL', () => {
  assert.equal(detect('https://example.org/download', 'attachment; filename=data.nt.gz'), { formatExtension: 'nt', compression: 'gz' });
  assert.equal(detect('https://example.org/download', 'attachment;filename=data.nt.gz'), { formatExtension: 'nt', compression: 'gz' });
  assert.equal(detect('https://example.org/download', 'attachment; filename="my data.ttl.gz"'), { formatExtension: 'ttl', compression: 'gz' });
  assert.equal(detect('https://example.org/download', 'attachment; filename="data#1.ttl"'), { formatExtension: 'ttl', compression: 'none' });
});

test('getFileNameFromDisposition handles quoted, extended and missing filenames', () => {
  assert.is(analyzer.getFileNameFromDisposition('attachment; filename="data.nt.gz";'), 'data.nt.gz');
  assert.is(analyzer.getFileNameFromDisposition("attachment; filename*=UTF-8''my%20data.nt.bz2"), 'my data.nt.bz2');
  assert.is(analyzer.getFileNameFromDisposition("attachment; filename=\"fallback.ttl\"; filename*=UTF-8''data.nt.bz2"), 'data.nt.bz2');
  assert.is(analyzer.getFileNameFromDisposition("attachment; filename*=UTF-8''bad%E0.nt; filename=\"data.nt.gz\""), 'data.nt.gz');
  assert.is(analyzer.getFileNameFromDisposition('inline'), undefined);
});

test('falls back to none when no file name can be determined', () => {
  assert.equal(detect('https://example.org/download', 'inline'), { formatExtension: 'none', compression: 'none' });
  assert.equal(detect('https://example.org/download'), {});
});

test.run();
