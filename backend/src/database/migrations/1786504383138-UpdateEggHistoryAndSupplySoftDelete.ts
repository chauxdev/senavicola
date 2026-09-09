import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEggHistoryAndSupplySoftDelete1786504383138 implements MigrationInterface {
    name = 'UpdateEggHistoryAndSupplySoftDelete1786504383138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "stock_minimo" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "precio_unitario" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "insumo" DROP COLUMN "fecha_eliminacion"`);
        await queryRunner.query(`ALTER TABLE "insumo" ADD "fecha_eliminacion" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insumo" DROP COLUMN "fecha_eliminacion"`);
        await queryRunner.query(`ALTER TABLE "insumo" ADD "fecha_eliminacion" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "precio_unitario" SET DEFAULT 0.00`);
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "stock_minimo" SET DEFAULT 0.00`);
    }

}
