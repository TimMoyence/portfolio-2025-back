import { pieceJointePdf } from './piece-jointe-pdf';

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
