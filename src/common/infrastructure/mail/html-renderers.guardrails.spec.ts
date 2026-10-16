import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'fs';
import { join, relative } from 'path';
import {
  createCompilerHost,
  createProgram,
  createSourceFile,
  forEachChild,
  getCombinedNodeFlags,
  getNameOfDeclaration,
  isArrayLiteralExpression,
  isBinaryExpression,
  isCallExpression,
  isDecorator,
  isElementAccessExpression,
  isExportSpecifier,
  isExpression,
  isExpressionWithTypeArguments,
  isForInStatement,
  isGetAccessorDeclaration,
  isIdentifier,
  isImportClause,
  isImportSpecifier,
  isMethodDeclaration,
  isNamespaceImport,
  isObjectBindingPattern,
  isArrayBindingPattern,
  isObjectLiteralExpression,
  isParameter,
  isParameterPropertyDeclaration,
  isPrivateIdentifier,
  isPropertyAccessExpression,
  isPropertyAssignment,
  isPropertyDeclaration,
  isModuleDeclaration,
  isSetAccessorDeclaration,
  isShorthandPropertyAssignment,
  isSourceFile,
  isSpreadAssignment,
  isSpreadElement,
  isStringLiteral,
  isTaggedTemplateExpression,
  isTypeNode,
  isVariableDeclaration,
  NodeFlags,
  ObjectFlags,
  parseJsonConfigFileContent,
  readConfigFile,
  resolveModuleName,
  flattenDiagnosticMessageText,
  SymbolFlags,
  SyntaxKind,
  sys,
  TypeFlags,
  type CallExpression,
  type CompilerOptions,
  type Expression,
  type Node,
  type ObjectType,
  type Program,
  type PropertyAccessExpression,
  type Signature,
  type SourceFile,
  type Symbol as TsSymbol,
  type Type,
  type TypeChecker,
  type TypeReference,
} from 'typescript';
import { z } from 'zod';
import {
  escapeHtml,
  htmlEmis,
  safeHtml,
  type EscapedHtml,
} from '../../domain/texte/html-escape.util';
import {
  sourcesHorsProprietaire,
  sourcesQuiEcrivent,
} from '../../../../test/helpers/source-tree';

const DEPOT = process.cwd();

const read = (relativePath: string): string =>
  readFileSync(join(DEPOT, relativePath), 'utf8');

const BALISES_HTML =
  'a b i p br hr em h1 h2 h3 h4 h5 h6 li ol ul td th tr div img span body head html meta small style table tbody thead strong button footer header section blockquote'.split(
    ' ',
  );

const ECRIT_DU_HTML = new RegExp(
  String.raw`\bsafeHtml\x60|<\/?(?:${BALISES_HTML.join('|')})\b[^<>]*>`,
);

const PROPRIETAIRE_DES_ETIQUETTES =
  'src/common/domain/texte/html-escape.util.ts';

const SOURCES = sourcesHorsProprietaire(
  join(DEPOT, 'src'),
  join(DEPOT, PROPRIETAIRE_DES_ETIQUETTES),
);

const RENDERERS = sourcesQuiEcrivent(DEPOT, SOURCES, ECRIT_DU_HTML);

describe('Renderers HTML — garanties non observables par le compilateur', () => {
  it('trouve chaque source qui ecrit une balise HTML ou le tag safeHtml', () => {
    expect(RENDERERS).toEqual(
      expect.arrayContaining([
        'src/common/infrastructure/mail/section-header.ts',
        'src/common/infrastructure/pdf/couverture-de-pdf.ts',
        'src/modules/contacts/infrastructure/ContactMailer.service.ts',
        'src/modules/lead-magnets/infrastructure/ToolkitHtmlRenderer.service.ts',
        'src/modules/users/infrastructure/MailerDeLienTemporaire.ts',
        'src/modules/users/infrastructure/PasswordResetMailer.service.ts',
        'src/modules/users/infrastructure/VerificationMailer.service.ts',
      ]),
    );
  });

  it.each(RENDERERS)('%s assemble son HTML via le tag safeHtml', (file) => {
    expect(read(file)).toMatch(/\bsafeHtml`/);
  });

  it.each(RENDERERS)(
    '%s ne laisse aucun gabarit HTML nu — un litteral sans tag accepte toute string sans casser la compilation',
    (file) => {
      const content = read(file);

      expect(content).not.toMatch(/html:\s*`/);
      expect(content).not.toMatch(/return\s+`\s*</);
      expect(content).not.toMatch(/\s[?:]\s*`\s*</);
    },
  );

  it.each(RENDERERS)('%s echappe via escapeHtml, jamais a la main', (file) => {
    const content = read(file);

    expect(content).not.toMatch(/replaceAll\(\s*'&'/);
    expect(content).not.toMatch(/replace\(\s*\/&\/g/);
  });
});

describe('Une contrefacon d EscapedHtml est echappee au rendu', () => {
  const ARBITRAIRE = '<img src=x onerror=alert(1)>';
  const ECHAPPE = '<p>&lt;img src=x onerror=alert(1)&gt;</p>';

  it('echappe une valeur de configuration lue comme un fragment emis', () => {
    const config = new ConfigService({ SIGNATURE_HTML: ARBITRAIRE });
    const signature = config.get<EscapedHtml>('SIGNATURE_HTML', escapeHtml(''));

    expect(htmlEmis(safeHtml`<p>${signature}</p>`)).toBe(ECHAPPE);
  });

  it('echappe une entree validee par un schema qui la type comme un fragment emis', () => {
    const fragment = z.custom<EscapedHtml>(
      (valeur) => typeof valeur === 'string',
    );
    const corps: unknown = ARBITRAIRE;

    expect(htmlEmis(safeHtml`<p>${fragment.parse(corps)}</p>`)).toBe(ECHAPPE);
  });

  it('echappe une chaine ecrite par un alias plus large du porteur du fragment', () => {
    const lien = { introHtml: escapeHtml('a') };
    const vue: { introHtml: unknown } = lien;
    vue.introHtml = ARBITRAIRE;

    expect(htmlEmis(safeHtml`<p>${lien.introHtml}</p>`)).toBe(ECHAPPE);
  });
});

const CHAMPS_DU_COURRIEL = new Set([
  'from',
  'to',
  'replyTo',
  'subject',
  'text',
  'html',
  'headers',
  'attachments',
]);

function htmlDuCourriel(appel: CallExpression): Expression | undefined {
  const message = appel.arguments.at(0);
  if (message === undefined || !isObjectLiteralExpression(message)) {
    return undefined;
  }
  let html: Expression | undefined;
  for (const champ of message.properties) {
    if (
      !isPropertyAssignment(champ) ||
      !isIdentifier(champ.name) ||
      !CHAMPS_DU_COURRIEL.has(champ.name.text)
    ) {
      return undefined;
    }
    if (champ.name.text === 'html') html = champ.initializer;
  }
  return html;
}

const htmlDeLaPage = (appel: CallExpression): Expression | undefined =>
  appel.arguments[0];

interface Puits {
  readonly nom: string;
  readonly declaration: RegExp;
  readonly membres: Readonly<Record<string, readonly string[]>>;
  readonly ecriture?: {
    readonly fichier: string;
    readonly methode: string;
    readonly html: (appel: CallExpression) => Expression | undefined;
  };
}

const PUITS: readonly Puits[] = [
  {
    nom: 'nodemailer',
    declaration: /\/node_modules\/@types\/nodemailer\//,
    membres: {
      'src/common/infrastructure/mail/expediteur-smtp.ts': [
        'sendMail',
        'createOptionalSmtpTransporter',
      ],
      'src/common/infrastructure/mail/smtp-transporter.util.ts': [
        'createTransport',
      ],
    },
    ecriture: {
      fichier: 'src/common/infrastructure/mail/expediteur-smtp.ts',
      methode: 'sendMail',
      html: htmlDuCourriel,
    },
  },
  {
    nom: 'puppeteer',
    declaration: /\/node_modules\/puppeteer(?:-core)?\//,
    membres: {
      'src/common/infrastructure/pdf/ImprimeriePdf.ts': [
        'launch',
        'newPage',
        'setContent',
        'pdf',
        'close',
        '#getBrowser',
      ],
    },
    ecriture: {
      fichier: 'src/common/infrastructure/pdf/ImprimeriePdf.ts',
      methode: 'setContent',
      html: htmlDeLaPage,
    },
  },
  {
    nom: 'chargeur de modules',
    declaration: /\/node_modules\/@types\/node\/module\.d\.ts$/,
    membres: {},
  },
];

const SANS_TYPE_ADMIS: readonly {
  readonly declaration: RegExp;
  readonly nom: string;
}[] = [
  { declaration: /\/node_modules\/fast-xml-parser\//, nom: 'parse' },
  { declaration: /\/node_modules\/typeorm\//, nom: 'query' },
];

function requireDUnPaquetTiers(noeud: Expression): boolean {
  const { parent } = noeud;
  if (
    !isIdentifier(noeud) ||
    noeud.text !== 'require' ||
    !isCallExpression(parent) ||
    parent.expression !== noeud ||
    parent.arguments.length !== 1
  ) {
    return false;
  }
  const [chemin] = parent.arguments;
  if (!isStringLiteral(chemin)) return false;
  const { resolvedModule } = resolveModuleName(
    chemin.text,
    noeud.getSourceFile().fileName,
    OPTIONS,
    sys,
  );
  return (
    resolvedModule?.isExternalLibraryImport === true &&
    !PUITS.some(({ declaration }) =>
      declaration.test(resolvedModule.resolvedFileName),
    )
  );
}

function typesDe(verificateur: TypeChecker, type: Type): Type[] {
  const vus = new Set<Type>();
  const pile = [type];
  for (let courant = pile.pop(); courant !== undefined; courant = pile.pop()) {
    if (vus.has(courant)) continue;
    vus.add(courant);
    if (courant.isUnionOrIntersection()) pile.push(...courant.types);
    pile.push(...(courant.aliasTypeArguments ?? []));
    if (
      courant.flags & TypeFlags.Object &&
      (courant as ObjectType).objectFlags & ObjectFlags.Reference
    ) {
      pile.push(...verificateur.getTypeArguments(courant as TypeReference));
    }
    for (const signature of courant.getCallSignatures()) {
      pile.push(signature.getReturnType());
    }
  }
  return [...vus];
}

const declarePar = (
  symbole: TsSymbol | undefined,
  declaration: RegExp,
): boolean =>
  symbole?.declarations?.some((noeud) =>
    declaration.test(noeud.getSourceFile().fileName),
  ) ?? false;

const estDuPuits = (
  verificateur: TypeChecker,
  type: Type,
  puits: Puits,
): boolean =>
  typesDe(verificateur, type).some(
    (membre) =>
      declarePar(membre.aliasSymbol, puits.declaration) ||
      declarePar(membre.getSymbol(), puits.declaration) ||
      (membre.flags & TypeFlags.Object &&
        (membre as ObjectType).objectFlags & ObjectFlags.Mapped &&
        membre
          .getProperties()
          .some((propriete) => declarePar(propriete, puits.declaration))),
  );

const estUnMembreLisible = (noeud: Node): boolean =>
  (isPropertyDeclaration(noeud) ||
    isPropertyAssignment(noeud) ||
    isShorthandPropertyAssignment(noeud) ||
    isMethodDeclaration(noeud) ||
    isGetAccessorDeclaration(noeud) ||
    isSetAccessorDeclaration(noeud) ||
    (isParameter(noeud) &&
      isParameterPropertyDeclaration(noeud, noeud.parent))) &&
  !isPrivateIdentifier(noeud.name);

const estUnNomDImportOuDExport = (noeud: Node): boolean =>
  isImportSpecifier(noeud.parent) ||
  isExportSpecifier(noeud.parent) ||
  isImportClause(noeud.parent) ||
  isNamespaceImport(noeud.parent);

const estUnNomSansValeur = (noeud: Expression): boolean =>
  isIdentifier(noeud) &&
  (estUnNomDImportOuDExport(noeud) ||
    (isPropertyAccessExpression(noeud.parent) && noeud.parent.name === noeud));

function nomAppele(noeud: Expression): string | undefined {
  if (isPropertyAccessExpression(noeud)) return noeud.name.text;
  return isIdentifier(noeud) ? noeud.text : undefined;
}

const estLuHorsDUnMembreNomme = (noeud: Expression): boolean => {
  const { parent } = noeud;
  return (
    (isElementAccessExpression(parent) && parent.expression === noeud) ||
    (isCallExpression(parent) && parent.arguments.includes(noeud)) ||
    isSpreadElement(parent) ||
    isSpreadAssignment(parent) ||
    (isForInStatement(parent) && parent.expression === noeud) ||
    (isBinaryExpression(parent) &&
      parent.right === noeud &&
      (parent.operatorToken.kind === SyntaxKind.InKeyword ||
        isObjectLiteralExpression(parent.left) ||
        isArrayLiteralExpression(parent.left))) ||
    (isVariableDeclaration(parent) &&
      parent.initializer === noeud &&
      (isObjectBindingPattern(parent.name) ||
        isArrayBindingPattern(parent.name)))
  );
};

const membresAdmis = (
  puits: Puits,
  fichier: string,
): readonly string[] | undefined =>
  Object.hasOwn(puits.membres, fichier) ? puits.membres[fichier] : undefined;

function defautsDe(programme: Program, fichiers: readonly string[]): string[] {
  const verificateur = programme.getTypeChecker();
  const proprietaire = programme.getSourceFile(
    join(DEPOT, PROPRIETAIRE_DES_ETIQUETTES),
  );
  const moduleDesEtiquettes =
    proprietaire && verificateur.getSymbolAtLocation(proprietaire);
  if (moduleDesEtiquettes === undefined) {
    throw new Error(`${PROPRIETAIRE_DES_ETIQUETTES} absent du programme`);
  }
  const exportes = new Map(
    verificateur
      .getExportsOfModule(moduleDesEtiquettes)
      .map((symbole) => [symbole.name, verificateur.getTypeOfSymbol(symbole)]),
  );
  const etiquettes = new Set(
    ['safeHtml', 'safeCss'].map((nom) => {
      const etiquette = exportes.get(nom);
      if (etiquette === undefined) {
        throw new Error(`${nom} absent de ${PROPRIETAIRE_DES_ETIQUETTES}`);
      }
      return etiquette;
    }),
  );
  const estGarde = (type: Type): boolean =>
    typesDe(verificateur, type).some(
      (membre) =>
        etiquettes.has(membre) ||
        PUITS.some((puits) => estDuPuits(verificateur, membre, puits)),
    );
  const estUnModuleGarde = (type: Type): boolean =>
    ((type.getSymbol()?.flags ?? 0) & SymbolFlags.ValueModule) !== 0 &&
    (type
      .getSymbol()
      ?.declarations?.some(
        (declaration) =>
          isSourceFile(declaration) || isModuleDeclaration(declaration),
      ) ??
      false) &&
    verificateur
      .getPropertiesOfType(type)
      .some((propriete) => estGarde(verificateur.getTypeOfSymbol(propriete)));
  const estHtmlEmis = (html: Expression | undefined): boolean => {
    if (html !== undefined && isIdentifier(html)) {
      const declaration =
        verificateur.getSymbolAtLocation(html)?.valueDeclaration;
      return (
        declaration !== undefined &&
        isVariableDeclaration(declaration) &&
        (getCombinedNodeFlags(declaration) & NodeFlags.Const) !== 0 &&
        estHtmlEmis(declaration.initializer)
      );
    }
    return (
      html !== undefined &&
      isCallExpression(html) &&
      verificateur.getTypeAtLocation(html.expression) ===
        exportes.get('htmlEmis')
    );
  };

  const releves: string[] = [];
  const ecritures = new Map<Puits, number>();

  for (const fichier of fichiers) {
    const source = programme.getSourceFile(join(DEPOT, fichier));
    if (source === undefined) throw new Error(`${fichier} absent du programme`);
    const relever = (noeud: Node, regle: string): void => {
      const { line } = source.getLineAndCharacterOfPosition(noeud.getStart());
      releves.push(`${fichier}:${line + 1} ${regle} : ${noeud.getText()}`);
    };

    const jugerLEcriture = (
      acces: PropertyAccessExpression,
      puits: Puits,
    ): void => {
      if (
        puits.ecriture === undefined ||
        acces.name.text !== puits.ecriture.methode
      ) {
        return;
      }
      ecritures.set(puits, (ecritures.get(puits) ?? 0) + 1);
      const ecriture = acces.parent;
      if (
        !isCallExpression(ecriture) ||
        ecriture.expression !== acces ||
        fichier !== puits.ecriture.fichier ||
        !estHtmlEmis(puits.ecriture.html(ecriture))
      ) {
        relever(acces, `${puits.nom} : écriture HTML hors de htmlEmis`);
      }
    };

    const jugerDansLeProprietaire = (
      noeud: Expression,
      puits: Puits,
      membres: readonly string[],
    ): void => {
      const { parent } = noeud;
      const acces =
        isPropertyAccessExpression(parent) && parent.expression === noeud
          ? parent
          : undefined;
      if (acces !== undefined && !membres.includes(acces.name.text)) {
        relever(acces, `${puits.nom} : membre hors de la liste admise`);
      }
      const nom = nomAppele(noeud);
      if (
        acces === undefined &&
        isCallExpression(parent) &&
        parent.expression === noeud &&
        (nom === undefined || !membres.includes(nom))
      ) {
        relever(noeud, `${puits.nom} : appel hors de la liste admise`);
      }
      if (estLuHorsDUnMembreNomme(noeud)) {
        relever(noeud, `${puits.nom} : accès hors d un membre nommé`);
      }
      const contexte = verificateur.getContextualType(noeud);
      if (
        contexte !== undefined &&
        !estDuPuits(verificateur, contexte, puits)
      ) {
        relever(noeud, `${puits.nom} : élargi hors de son type`);
      }
      if (acces !== undefined) jugerLEcriture(acces, puits);
    };

    const jugerLesPuits = (noeud: Expression, type: Type): void => {
      for (const puits of PUITS) {
        if (!estDuPuits(verificateur, type, puits)) continue;
        const membres = membresAdmis(puits, fichier);
        if (membres !== undefined) {
          jugerDansLeProprietaire(noeud, puits, membres);
        } else if (!requireDUnPaquetTiers(noeud)) {
          relever(noeud, `${puits.nom} hors de son propriétaire`);
        }
      }
    };

    const estUnAccesStatiqueAuModule = (
      noeud: Expression,
      type: Type,
    ): boolean => {
      const { parent } = noeud;
      return (
        estUnModuleGarde(type) &&
        isPropertyAccessExpression(parent) &&
        parent.expression === noeud &&
        type.getProperty(parent.name.text) !== undefined
      );
    };

    const jugerLeMembre = (membre: Node): void => {
      const type = verificateur.getTypeAtLocation(membre);
      for (const puits of PUITS) {
        if (estDuPuits(verificateur, type, puits)) {
          relever(membre, `${puits.nom} : membre lisible par son nom`);
        }
      }
    };

    const livreUneValeurSansType = (type: Type): boolean => {
      const attendu = verificateur.getAwaitedType(type);
      return (
        (type.flags & TypeFlags.Any) !== 0 ||
        (type.isUnionOrIntersection() &&
          type.types.some(livreUneValeurSansType)) ||
        (attendu !== undefined &&
          attendu !== type &&
          livreUneValeurSansType(attendu)) ||
        ((verificateur.isArrayType(type) || verificateur.isTupleType(type)) &&
          verificateur
            .getTypeArguments(type as TypeReference)
            .some(livreUneValeurSansType))
      );
    };

    const rendSansTypeDepuisUnPaquetTiers = (signature: Signature): boolean => {
      const { declaration } = signature;
      const declarant = declaration?.getSourceFile();
      if (
        declarant === undefined ||
        !/\/node_modules\//.test(declarant.fileName) ||
        programme.isSourceFileDefaultLibrary(declarant)
      ) {
        return false;
      }
      const nom = getNameOfDeclaration(declaration)?.getText();
      return (
        livreUneValeurSansType(signature.getReturnType()) &&
        !PUITS.some((puits) => puits.declaration.test(declarant.fileName)) &&
        !SANS_TYPE_ADMIS.some(
          (admis) =>
            admis.declaration.test(declarant.fileName) && admis.nom === nom,
        )
      );
    };

    const estSansTypeDUnPaquetTiers = (type: Type): boolean =>
      (type.isUnion() ? type.types : [type]).some((membre) =>
        membre.getCallSignatures().some(rendSansTypeDepuisUnPaquetTiers),
      );

    const juger = (noeud: Expression): void => {
      const { parent } = noeud;
      if (estUnNomSansValeur(noeud)) return;
      if (
        isCallExpression(noeud) &&
        noeud.expression.kind === SyntaxKind.ImportKeyword
      ) {
        relever(noeud, 'import dynamique');
      }
      const type = verificateur.getTypeAtLocation(noeud);
      const types = typesDe(verificateur, type);
      if (
        !(isDecorator(parent) && parent.expression === noeud) &&
        estSansTypeDUnPaquetTiers(type)
      ) {
        relever(noeud, 'valeur sans type rendue par un paquet tiers');
      }
      if (
        types.some((membre) => etiquettes.has(membre)) &&
        !(isTaggedTemplateExpression(parent) && parent.tag === noeud)
      ) {
        relever(noeud, 'étiquette hors d un gabarit littéral');
      }
      if (
        types.some(estUnModuleGarde) &&
        !estUnAccesStatiqueAuModule(noeud, type)
      ) {
        relever(noeud, 'module gardé hors d un accès statique');
      }
      jugerLesPuits(noeud, type);
    };

    const visiter = (noeud: Node): void => {
      if (isTypeNode(noeud) && !isExpressionWithTypeArguments(noeud)) return;
      if (estUnMembreLisible(noeud)) jugerLeMembre(noeud);
      if (isExpression(noeud)) juger(noeud);
      forEachChild(noeud, visiter);
    };
    visiter(source);
  }

  for (const puits of PUITS) {
    const nombre = ecritures.get(puits) ?? 0;
    if (puits.ecriture && fichiers.includes(puits.ecriture.fichier)) {
      if (nombre !== 1) {
        releves.push(`${puits.nom} : ${nombre} écritures HTML au lieu d une`);
      }
    }
  }
  return releves;
}

const OPTIONS: CompilerOptions = {
  ...parseJsonConfigFileContent(
    readConfigFile(join(DEPOT, 'tsconfig.json'), (chemin) =>
      sys.readFile(chemin),
    ).config,
    sys,
    DEPOT,
  ).options,
  noEmit: true,
  incremental: false,
};

const SOURCES_LUES = new Map<string, SourceFile | undefined>();

function programmeDe(
  racines: readonly string[],
  virtuels: Readonly<Record<string, string>> = {},
): Program {
  const hote = createCompilerHost(OPTIONS, true);
  const textes = new Map(
    Object.entries(virtuels).map(([fichier, texte]) => [
      join(DEPOT, fichier),
      texte,
    ]),
  );
  return createProgram({
    rootNames: [
      join(DEPOT, PROPRIETAIRE_DES_ETIQUETTES),
      ...racines.map((fichier) => join(DEPOT, fichier)),
      ...textes.keys(),
    ],
    options: OPTIONS,
    host: {
      ...hote,
      fileExists: (chemin) => textes.has(chemin) || hote.fileExists(chemin),
      directoryExists: (dossier) =>
        [...textes.keys()].some((chemin) => chemin.startsWith(`${dossier}/`)) ||
        (hote.directoryExists?.(dossier) ?? true),
      readFile: (chemin) => textes.get(chemin) ?? hote.readFile(chemin),
      getSourceFile: (chemin, langage) => {
        const texte = textes.get(chemin);
        if (texte !== undefined) {
          return createSourceFile(chemin, texte, langage, true);
        }
        if (!SOURCES_LUES.has(chemin)) {
          SOURCES_LUES.set(chemin, hote.getSourceFile(chemin, langage));
        }
        return SOURCES_LUES.get(chemin);
      },
    },
  });
}

function muter(
  fichier: string,
  avant: string,
  apres: string,
): Record<string, string> {
  const texte = read(fichier);
  if (texte.split(avant).length !== 2) {
    throw new Error(`${fichier} doit contenir une fois : ${avant}`);
  }
  return { [fichier]: texte.replace(avant, apres) };
}

const H = '../common/domain/texte/html-escape.util';
const EXPEDITEUR = 'src/common/infrastructure/mail/expediteur-smtp.ts';
const IMPRIMERIE = 'src/common/infrastructure/pdf/ImprimeriePdf.ts';

const CONTOURNEMENTS = {
  'un appel de safeHtml': {
    'src/sonde/appel.ts': `import { safeHtml } from '${H}';
export const f = (x: TemplateStringsArray) => safeHtml(x);`,
  },
  'un gabarit fabrique': {
    'src/sonde/fabrique.ts': `import { safeHtml } from '${H}';
const gabaritDe = (t: string) =>
  Object.freeze(Object.assign([t], { raw: Object.freeze([t]) }));
export const signature = (t: string) => safeHtml(gabaritDe(t) as never);`,
  },
  'safeHtml en valeur': {
    'src/sonde/valeur.ts': `import { safeHtml } from '${H}';
export const f = safeHtml;`,
  },
  'safeHtml.call': {
    'src/sonde/call.ts': `import { safeHtml } from '${H}';
export const f = (x: never) => safeHtml.call(null, x);`,
  },
  'Reflect.apply': {
    'src/sonde/apply.ts': `import { safeHtml } from '${H}';
export const f = (x: never) => Reflect.apply(safeHtml, null, [x]);`,
  },
  'un alias appele': {
    'src/sonde/alias.ts': `import { safeHtml as s } from '${H}';
export const f = (x: never) => s(x);`,
  },
  'un espace appele': {
    'src/sonde/espace.ts': `import * as E from '${H}';
export const f = (x: never) => E.safeHtml(x);`,
  },
  'un espace indexe': {
    'src/sonde/indexe.ts': `import * as E from '${H}';
export const f = E['safeHtml'];`,
  },
  'Reflect.get a cle calculee': {
    'src/sonde/reflect.ts': `import * as E from '${H}';
export const f = Reflect.get(E, ['safe', 'Html'].join('')) as unknown;`,
  },
  'les valeurs du module': {
    'src/sonde/valeurs.ts': `import * as E from '${H}';
export const f = Object.values(E);`,
  },
  'un alias reexporte puis appele': {
    'src/sonde/etiquette.ts': `import { safeHtml as etiquette } from '${H}';
export { etiquette };`,
    'src/sonde/emploi.ts': `import { etiquette } from './etiquette';
export const f = (t: string) =>
  etiquette(Object.assign([t], { raw: [t] }) as never);`,
  },
  'un reexport renomme appele': {
    'src/sonde/balise.ts': `export { safeHtml as balise } from '${H}';`,
    'src/sonde/emploi.ts': `import { balise } from './balise';
export const f = (x: never) => balise(x);`,
  },
  'un export par defaut': {
    'src/sonde/defaut.ts': `import { safeHtml } from '${H}';
export default safeHtml;`,
  },
  'un import dynamique': {
    'src/sonde/dynamique.ts': `export const f = (k: string) =>
  import('${H}').then((m) => Reflect.get(m, k) as unknown);`,
  },
  'un require': {
    'src/sonde/require.ts': `const { safeHtml } = require('${H}');
export const f = safeHtml as unknown;`,
  },
  'module.require': {
    'src/sonde/module.ts': `export const f = () => module.require('nodemailer') as unknown;`,
  },
  'un appel de safeCss': {
    'src/sonde/feuille.ts': `import { safeCss } from '${H}';
export const f = (x: never) => safeCss(x);`,
  },
  'un transporteur cree hors du proprietaire': {
    'src/sonde/transporteur.ts': `import { Logger } from '@nestjs/common';
import { createOptionalSmtpTransporter } from '../common/infrastructure/mail/smtp-transporter.util';
export const f = () =>
  createOptionalSmtpTransporter(new Logger('x'), 'x')?.sendMail({ html: '<b>' });`,
  },
  'nodemailer importe hors du proprietaire': {
    'src/sonde/nodemailer.ts': `import { createTransport } from 'nodemailer';
export const f = () => createTransport({}).sendMail({ html: '<b>' });`,
  },
  'une classe de nodemailer etendue': {
    'src/sonde/herite.ts': `import Mail from 'nodemailer/lib/mailer';
export class Envoi extends Mail {}`,
  },
  'puppeteer importe hors du proprietaire': {
    'src/sonde/puppeteer.ts': `import puppeteer from 'puppeteer';
export const f = async () =>
  (await (await puppeteer.launch()).newPage()).setContent('<b>');`,
  },
  'un courriel ouvert par decomposition': muter(
    EXPEDITEUR,
    "from: texteAdmis(courriel.from, 'from'),",
    "...courriel,\n      from: texteAdmis(courriel.from, 'from'),",
  ),
  'un courriel au HTML non emis': muter(
    EXPEDITEUR,
    'html: htmlEmis(courriel.html),',
    'html: courriel.html,',
  ),
  'un courriel a variantes HTML': muter(
    EXPEDITEUR,
    'html: htmlEmis(courriel.html),',
    'html: htmlEmis(courriel.html),\n      alternatives: [],',
  ),
  'un greffon de compilation': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    "if (!this.#transporter) return;\n    Reflect.apply(this.#transporter.use, this.#transporter, ['compile']);",
  ),
  'une seconde ecriture': muter(
    EXPEDITEUR,
    'get actif(): boolean {',
    'brut(html: string) {\n    return this.#transporter?.sendMail({ html });\n  }\n\n  get actif(): boolean {',
  ),
  'un envoi destructure': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    'if (!this.#transporter) return;\n    const { sendMail: brut } = this.#transporter;\n    void brut;',
  ),
  'une page au HTML non emis': muter(
    IMPRIMERIE,
    'page.setContent(document,',
    'page.setContent(String(html),',
  ),
  'une page au document reaffecte': muter(
    IMPRIMERIE,
    'const document = htmlEmis(html);',
    'let document = htmlEmis(html);\n    document = String(html);',
  ),
  'un transporteur elargi par son proprietaire': muter(
    EXPEDITEUR,
    'get actif(): boolean {',
    'fuite(): unknown {\n    return this.#transporter;\n  }\n\n  get actif(): boolean {',
  ),
  'un navigateur lisible par son nom': muter(
    IMPRIMERIE,
    'async onModuleDestroy(): Promise<void> {',
    'get navigateur() {\n    return this.#browserPromise;\n  }\n\n  async onModuleDestroy(): Promise<void> {',
  ),
  'un alias de type de nodemailer': {
    'src/sonde/envoi.ts': `import type { Transporter } from 'nodemailer';
type Envoi = Pick<Transporter, 'sendMail'>;
export const f = (t: Envoi) => t.sendMail({ html: '<b>' });`,
  },
  'une fabrique de transporteur elargie': {
    'src/sonde/fabrique.ts': `import { Logger } from '@nestjs/common';
import { createOptionalSmtpTransporter } from '../common/infrastructure/mail/smtp-transporter.util';
const fabrique: (l: Logger, c: string) => unknown = createOptionalSmtpTransporter;
export const f = () => fabrique(new Logger('x'), 'x');`,
  },
  'un module proprietaire lu par reflexion': {
    'src/sonde/reflexion.ts': `import * as M from '../common/infrastructure/mail/smtp-transporter.util';
export const f = Reflect.get(M, 'createOptionalSmtpTransporter') as unknown;`,
  },
  'une page chargee par adresse': muter(
    IMPRIMERIE,
    'const pdf = await page.pdf({',
    "await page.goto('data:text/html,<b>');\n      const pdf = await page.pdf({",
  ),
  'un require de nodemailer': {
    'src/sonde/require-puits.ts': `export const f = () => require('nodemailer') as unknown;`,
  },
  'un require d un module du depot': {
    'src/sonde/require-local.ts': `export const f = () =>
  require('src/common/domain/texte/html-escape.util') as unknown;`,
  },
  'loadPackage de Nest': {
    'src/sonde/load-package.ts': `import { loadPackage } from '@nestjs/common/utils/load-package.util';
export const f = (): unknown => loadPackage('nodemailer', 'x');`,
  },
  'optionalRequire de Nest': {
    'src/sonde/optional-require.ts': `import { optionalRequire } from '@nestjs/core/helpers/optional-require';
export const f = (): unknown => optionalRequire('nodemailer');`,
  },
  'PlatformTools.load de TypeORM': {
    'src/sonde/platform-tools.ts': `import { PlatformTools } from 'typeorm/platform/PlatformTools';
export const f = (): unknown => PlatformTools.load('nodemailer');`,
  },
  'importOrRequireFile de TypeORM': {
    'src/sonde/import-or-require.ts': `import { importOrRequireFile } from 'typeorm/util/ImportUtils';
export const f = async (): Promise<unknown> => {
  const resultat: unknown = await importOrRequireFile('nodemailer');
  return (resultat as readonly unknown[])[0];
};`,
  },
  'un chargeur tiers dont le retour enveloppe any': {
    'src/sonde/retour-enveloppe.ts': `import { importOrRequireFile } from 'typeorm/util/ImportUtils';
const charger: (nom: string) => Promise<readonly unknown[]> = importOrRequireFile;
export const f = () => charger('nodemailer');`,
  },
  'un retour tiers en union qui enveloppe any': {
    'src/sonde/retour-union.ts': `import type { EntitySubscriberInterface, InsertEvent } from 'typeorm';
export const f = (abonne: EntitySubscriberInterface, evenement: InsertEvent<unknown>) =>
  abonne.beforeInsert?.(evenement) as unknown;`,
  },
  'un retour tiers en union de tableau sans type': {
    'src/sonde/retour-union-tableau.ts': `import { AbstractLogger } from 'typeorm/logger/AbstractLogger';
export class Journal extends AbstractLogger {
  protected writeLog(): void {}
  lire = (): unknown => this.stringifyParams([]);
}`,
  },
  'un chargeur tiers range sous un type': {
    'src/sonde/chargeur-type.ts': `import { loadPackage } from '@nestjs/common/utils/load-package.util';
const charger: (nom: string, contexte: string) => unknown = loadPackage;
export const f = () => charger('nodemailer', 'x');`,
  },
  'un envoi a cle calculee': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    "if (!this.#transporter) return;\n    void Reflect.get(this.#transporter, ['send', 'Mail'].join(''));",
  ),
  'un transporteur etale': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    'if (!this.#transporter) return;\n    void { ...this.#transporter };',
  ),
  'un transporteur etale dans un tableau': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    'if (!this.#transporter) return;\n    void [...this.#transporter];',
  ),
  'un transporteur interroge par in': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    "if (!this.#transporter) return;\n    void ('sendMail' in this.#transporter);",
  ),
  'un transporteur destructure en tableau par affectation': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    'if (!this.#transporter) return;\n    let brut: unknown;\n    [brut] = this.#transporter;\n    void brut;',
  ),
  'un transporteur parcouru': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    'if (!this.#transporter) return;\n    for (const cle in this.#transporter) void cle;',
  ),
  'un transporteur destructure par affectation': muter(
    EXPEDITEUR,
    'if (!this.#transporter) return;',
    'if (!this.#transporter) return;\n    let brut: unknown;\n    ({ sendMail: brut } = this.#transporter);\n    void brut;',
  ),
  'un transporteur sous une cle chaine': muter(
    EXPEDITEUR,
    'get actif(): boolean {',
    "get detail() {\n    return { 'en-voi': this.#transporter };\n  }\n\n  get actif(): boolean {",
  ),
  'un navigateur sous une cle calculee': muter(
    IMPRIMERIE,
    'async onModuleDestroy(): Promise<void> {',
    "get detail() {\n    return { [['navi', 'gateur'].join('')]: this.#browserPromise };\n  }\n\n  async onModuleDestroy(): Promise<void> {",
  ),
  'un transporteur en propriete de parametre': muter(
    EXPEDITEUR,
    "constructor(transporter: Pick<Transporter, 'sendMail'> | null) {",
    "constructor(\n    private readonly brut: Pick<Transporter, 'sendMail'> | null,\n    transporter: Pick<Transporter, 'sendMail'> | null,\n  ) {",
  ),
} satisfies Readonly<Record<string, Record<string, string>>>;

const ETIQUETTE = 'étiquette hors d un gabarit littéral';
const MODULE = 'module gardé hors d un accès statique';
const CHARGEUR = 'chargeur de modules hors de son propriétaire';
const NODEMAILER = 'nodemailer hors de son propriétaire';
const COURRIEL = 'nodemailer : écriture HTML hors de htmlEmis';
const SANS_TYPE = 'valeur sans type rendue par un paquet tiers';
const HORS_D_UN_MEMBRE = 'nodemailer : accès hors d un membre nommé';

const REGLE_ENFREINTE: Readonly<Record<keyof typeof CONTOURNEMENTS, string>> = {
  'un appel de safeHtml': ETIQUETTE,
  'un gabarit fabrique': ETIQUETTE,
  'safeHtml en valeur': ETIQUETTE,
  'safeHtml.call': ETIQUETTE,
  'Reflect.apply': ETIQUETTE,
  'un alias appele': ETIQUETTE,
  'un espace appele': ETIQUETTE,
  'un espace indexe': MODULE,
  'Reflect.get a cle calculee': MODULE,
  'les valeurs du module': MODULE,
  'un alias reexporte puis appele': ETIQUETTE,
  'un reexport renomme appele': ETIQUETTE,
  'un export par defaut': ETIQUETTE,
  'un import dynamique': 'import dynamique',
  'un require': CHARGEUR,
  'module.require': CHARGEUR,
  'un appel de safeCss': ETIQUETTE,
  'un transporteur cree hors du proprietaire': NODEMAILER,
  'nodemailer importe hors du proprietaire': NODEMAILER,
  'une classe de nodemailer etendue': NODEMAILER,
  'puppeteer importe hors du proprietaire':
    'puppeteer hors de son propriétaire',
  'un courriel ouvert par decomposition': COURRIEL,
  'un courriel au HTML non emis': COURRIEL,
  'un courriel a variantes HTML': COURRIEL,
  'un greffon de compilation': 'nodemailer : membre hors de la liste admise',
  'une seconde ecriture': 'nodemailer : 2 écritures HTML au lieu d une',
  'un envoi destructure': HORS_D_UN_MEMBRE,
  'une page au HTML non emis': 'puppeteer : écriture HTML hors de htmlEmis',
  'une page au document reaffecte':
    'puppeteer : écriture HTML hors de htmlEmis',
  'un transporteur elargi par son proprietaire':
    'nodemailer : élargi hors de son type',
  'un navigateur lisible par son nom': 'puppeteer : membre lisible par son nom',
  'un alias de type de nodemailer': NODEMAILER,
  'une fabrique de transporteur elargie': NODEMAILER,
  'un module proprietaire lu par reflexion': MODULE,
  'une page chargee par adresse': 'puppeteer : membre hors de la liste admise',
  'un require de nodemailer': CHARGEUR,
  'un require d un module du depot': CHARGEUR,
  'loadPackage de Nest': SANS_TYPE,
  'optionalRequire de Nest': SANS_TYPE,
  'PlatformTools.load de TypeORM': SANS_TYPE,
  'importOrRequireFile de TypeORM': SANS_TYPE,
  'un chargeur tiers dont le retour enveloppe any': SANS_TYPE,
  'un retour tiers en union qui enveloppe any': SANS_TYPE,
  'un retour tiers en union de tableau sans type': SANS_TYPE,
  'un chargeur tiers range sous un type': SANS_TYPE,
  'un envoi a cle calculee': HORS_D_UN_MEMBRE,
  'un transporteur etale': HORS_D_UN_MEMBRE,
  'un transporteur etale dans un tableau': HORS_D_UN_MEMBRE,
  'un transporteur interroge par in': HORS_D_UN_MEMBRE,
  'un transporteur destructure en tableau par affectation': HORS_D_UN_MEMBRE,
  'un transporteur parcouru': HORS_D_UN_MEMBRE,
  'un transporteur destructure par affectation': HORS_D_UN_MEMBRE,
  'un transporteur sous une cle chaine':
    'nodemailer : membre lisible par son nom',
  'un navigateur sous une cle calculee':
    'puppeteer : membre lisible par son nom',
  'un transporteur en propriete de parametre':
    'nodemailer : membre lisible par son nom',
};

const EMPLOIS_ADMIS: Readonly<Record<string, Record<string, string>>> = {
  'un require de paquet tiers': {
    'src/sonde/require-tiers.ts': `export const f = () => require('dotenv') as unknown;`,
  },
  'l analyse XML admise': {
    'src/sonde/xml.ts': `import { XMLParser } from 'fast-xml-parser';
export const f = (xml: string): unknown => new XMLParser().parse(xml);`,
  },
  'les etiquettes': {
    'src/sonde/etiquettes.ts': `import { safeCss, safeHtml } from '${H}';
export const a = safeHtml\`<p></p>\`;
export const b = safeCss\`p{}\`;`,
  },
  'un alias en etiquette': {
    'src/sonde/alias.ts': `import { safeHtml as s } from '${H}';
export const a = s\`<p></p>\`;`,
  },
  'un espace en etiquette': {
    'src/sonde/espace.ts': `import * as E from '${H}';
export const a = E.safeHtml\`<p>\${E.escapeHtml('x')}</p>\`;`,
  },
  'un reexport': {
    'src/sonde/reexport.ts': `export { safeHtml } from '${H}';`,
  },
  'un reexport local': {
    'src/sonde/local.ts': `import { safeHtml } from '${H}';
export { safeHtml };`,
  },
  'un reexport renomme en etiquette': {
    'src/sonde/balise.ts': `export { safeHtml as balise } from '${H}';`,
    'src/sonde/emploi.ts': `import { balise } from './balise';
export const a = balise\`<p></p>\`;`,
  },
};

describe('Etiquettes et puits — lus par le verificateur de types', () => {
  let defautsDuDepot: string[];

  beforeAll(() => {
    const fichiers = SOURCES.map((fichier) => relative(DEPOT, fichier));
    defautsDuDepot = defautsDe(programmeDe(fichiers), fichiers);
  }, 120_000);

  it.each(Object.entries(CONTOURNEMENTS))('releve %s', (cas, fichiers) => {
    expect(
      defautsDe(programmeDe([], fichiers), Object.keys(fichiers)),
    ).toContainEqual(
      expect.stringContaining(
        REGLE_ENFREINTE[cas as keyof typeof CONTOURNEMENTS],
      ),
    );
  });

  it.each(Object.entries(EMPLOIS_ADMIS))('laisse %s', (_cas, fichiers) => {
    const programme = programmeDe([], fichiers);
    const diagnostics = Object.keys(fichiers).flatMap((fichier) => {
      const source = programme.getSourceFile(join(DEPOT, fichier));
      return [
        ...programme.getSyntacticDiagnostics(source),
        ...programme.getSemanticDiagnostics(source),
      ].map(({ messageText }) =>
        flattenDiagnosticMessageText(messageText, '\n'),
      );
    });

    expect(diagnostics).toEqual([]);
    expect(defautsDe(programme, Object.keys(fichiers))).toEqual([]);
  });

  it('n emploie safeHtml et safeCss que comme etiquette d un gabarit litteral, et n atteint nodemailer et puppeteer que dans leurs proprietaires, dont l unique ecriture HTML passe par htmlEmis', () => {
    expect(defautsDuDepot).toEqual([]);
  });
});

const FEUILLES_DE_STYLE = [
  'src/modules/lead-magnets/infrastructure/toolkit-html/toolkit-html.css.ts',
];

describe('Feuilles de style — seul safeCss emet un contenu admis dans <style>', () => {
  it.each(FEUILLES_DE_STYLE)(
    '%s assemble sa feuille via le tag safeCss, sans gabarit nu',
    (file) => {
      const content = read(file);

      expect(content).toMatch(/\bsafeCss`/);
      expect(content).not.toMatch(/\bsafeHtml`/);
      expect(content).not.toMatch(/return\s+`/);
      expect(content).not.toMatch(/=>\s*`/);
    },
  );
});
