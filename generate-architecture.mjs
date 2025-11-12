// generate-architecture.mjs
import fs from 'fs';
import path from 'path';

const __dirname = process.cwd();

const modules = [
  'projects',
  'courses',
  'services',
  'contacts',
  'redirects',
  'users',
];

const baseDirs = [
  'domain',
  'application',
  'infrastructure',
  'interfaces',
  'infrastructure/entities',
];

function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created: ${dir}`);
  }
}

function createFile(filePath, content = '') {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`✏️  Created file: ${filePath}`);
  }
}

function createModuleStructure(moduleName) {
  const modulePath = path.join(__dirname, 'src', 'modules', moduleName);
  createDirIfNotExists(modulePath);

  for (const subDir of baseDirs) {
    const subPath = path.join(modulePath, subDir);
    createDirIfNotExists(subPath);
  }

  // Module file
  createFile(
    path.join(modulePath, `${capitalize(moduleName)}.module.ts`),
    `import { Module } from "@nestjs/common";\nimport { TypeOrmModule } from "@nestjs/typeorm";\nimport { ${capitalize(moduleName)}Entity } from "./infrastructure/entities/${capitalize(moduleName)}.entity";\nimport { ${capitalize(
      moduleName,
    )}RepositoryTypeORM } from "./infrastructure/${capitalize(
      moduleName,
    )}RepositoryTypeORM";\nimport { ${capitalize(
      moduleName,
    )}Controller } from "./interfaces/${capitalize(
      moduleName,
    )}Controller";\nimport {${moduleName.toUpperCase()}_REPOSITORY} from "./domain/Token";\nimport { Create${capitalize(
      moduleName,
    )}UseCase } from "./application/Create${capitalize(
      moduleName,
    )}UseCase";\n\nconst ${moduleName.toUpperCase()}_USE_CASES = [Create${capitalize(
      moduleName,
    )}UseCase];\n\n@Module({\n  imports: [TypeOrmModule.forFeature([${capitalize(moduleName)}Entity])],\n  controllers: [${capitalize(moduleName)}Controller],\n  providers: [\n    ...${moduleName.toUpperCase()}_USE_CASES,\n    {\n      provide: ${moduleName.toUpperCase()}_REPOSITORY,\n      useClass: ${capitalize(moduleName)}RepositoryTypeORM,\n    },\n  ],\nexports: [${moduleName.toUpperCase()}_REPOSITORY],\n})\nexport class ${capitalize(moduleName)}Module {}\n`,
  );

  // Domain files
  createFile(
    path.join(modulePath, 'domain', `${capitalize(moduleName)}.ts`),
    `export class ${capitalize(moduleName)} {\n  id: string;\n}\n`,
  );
  createFile(
    path.join(modulePath, 'domain', `Token.ts`),
    `export const ${moduleName.toUpperCase()}_REPOSITORY = Symbol('${moduleName.toUpperCase()}_REPOSITORY');\n`,
  );
  createFile(
    path.join(modulePath, 'domain', `I${capitalize(moduleName)}Repository.ts`),
    `import { ${capitalize(moduleName)} } from "./${capitalize(moduleName)}";\n\n
  
    export interface I${capitalize(
      moduleName,
    )}Repository {\n  findAll(): Promise<${capitalize(moduleName)}[]>;\n  create(data: ${capitalize(moduleName)}): Promise<${capitalize(moduleName)}>;\n}\n`,
  );

  // Application files
  createFile(
    path.join(
      modulePath,
      'application',
      `Create${capitalize(moduleName)}UseCase.ts`,
    ),
    `import { I${capitalize(moduleName)}Repository } from "../domain/I${capitalize(
      moduleName,
    )}Repository";\n\nexport class Create${capitalize(
      moduleName,
    )}UseCase {\n  constructor(private repo: I${capitalize(
      moduleName,
    )}Repository) {}\n  async execute(data: any) {\n    return this.repo.create(data);\n  }\n}\n`,
  );

  // Infrastructure files
  createFile(
    path.join(
      modulePath,
      'infrastructure',
      `${capitalize(moduleName)}RepositoryTypeORM.ts`,
    ),
    `import { Repository } from "typeorm";\nimport { ${capitalize(
      moduleName,
    )}Entity } from "./entities/${capitalize(
      moduleName,
    )}Entity";\nimport { I${capitalize(moduleName)}Repository } from "../domain/I${capitalize(
      moduleName,
    )}Repository";\n\nexport class ${capitalize(
      moduleName,
    )}RepositoryTypeORM implements I${capitalize(
      moduleName,
    )}Repository {\n  constructor(private readonly repo: Repository<${capitalize(
      moduleName,
    )}Entity>) {}\n  async findAll() { return this.repo.find(); }\n  async create(data: any) { return this.repo.save(data); }\n}\n`,
  );

  // Interfaces files
  createFile(
    path.join(
      modulePath,
      'interfaces',
      `${capitalize(moduleName)}Controller.ts`,
    ),
    `import { Controller, Get, Post, Body } from "@nestjs/common";\nimport { Create${capitalize(
      moduleName,
    )}UseCase } from "../application/Create${capitalize(
      moduleName,
    )}UseCase";\n\n@Controller("${moduleName}")\nexport class ${capitalize(
      moduleName,
    )}Controller {\n  constructor(private readonly createUseCase: Create${capitalize(
      moduleName,
    )}UseCase) {}\n\n  @Get()\n  findAll() { return []; }\n\n  @Post()\n  create(@Body() dto: any) { return this.createUseCase.execute(dto); }\n}\n`,
  );

  //Entities files for TypeORM infrastructure
  createFile(
    path.join(
      modulePath,
      'infrastructure',
      'entities',
      `${capitalize(moduleName)}.entity.ts`,
    ),
    `import {\nColumn,\nCreateDateColumn,\nEntity,\nPrimaryGeneratedColumn,\n} from 'typeorm';\n\n@Entity({ name: '${moduleName.toLowerCase()}' })\nexport class ${capitalize(moduleName)}Entity {\n\n@PrimaryGeneratedColumn('uuid')\n\nid: string;\n\n@CreateDateColumn({ name: 'created_at' })\n\ncreatedAt: Date;\n\n@Column({\nname: 'updated_at',\ntype: 'timestamp',\ndefault: () => 'CURRENT_TIMESTAMP',\n})\n\nupdatedAt: Date;\n\n@Column({ name: 'updated_or_created_by', type: 'int', nullable: true })\nupdatedOrCreatedBy: number | null;\n\n}\n`,
  );
}

function capitalize(str) {
  return (
    str.charAt(0).toUpperCase() +
    str.slice(1).replace(/-./g, (x) => x[1].toUpperCase())
  );
}

console.log('🚀 Generating Hexagonal Architecture...');
modules.forEach(createModuleStructure);
console.log('✅ Done!');
