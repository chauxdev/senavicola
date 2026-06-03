import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSoftDeletes1774534320000 implements MigrationInterface {
    name = 'AddSoftDeletes1774534320000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuario" ADD "fecha_eliminacion" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "lote" ADD "fecha_eliminacion" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "inventario_huevo" ADD "fecha_eliminacion" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventario_huevo" DROP COLUMN "fecha_eliminacion"`);
        await queryRunner.query(`ALTER TABLE "lote" DROP COLUMN "fecha_eliminacion"`);
        await queryRunner.query(`ALTER TABLE "usuario" DROP COLUMN "fecha_eliminacion"`);
    }

}
