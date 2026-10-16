import { pieceJointeCsv, pieceJointePdf } from './piece-jointe';

describe('pieceJointePdf', () => {
  it('joint le contenu sous son nom avec le type PDF', () => {
    const contenu = Buffer.from('%PDF-1.4');

    expect(pieceJointePdf('rapport.pdf', contenu)).toEqual({
      filename: 'rapport.pdf',
      content: contenu,
      contentType: 'application/pdf',
    });
  });
});

describe('pieceJointeCsv', () => {
  it('joint le contenu sous son nom avec le type CSV en UTF-8', () => {
    const contenu = new TextEncoder().encode('a;b');

    expect(pieceJointeCsv('session.csv', contenu)).toEqual({
      filename: 'session.csv',
      content: Buffer.from('a;b'),
      contentType: 'text/csv; charset=utf-8',
    });
  });
});
