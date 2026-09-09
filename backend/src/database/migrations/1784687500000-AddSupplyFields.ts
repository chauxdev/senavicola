import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupplyFields1784687500000 implements MigrationInterface {
    name = 'AddSupplyFields1784687500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insumo" ADD "stock_minimo" numeric(10,2) NOT NULL DEFAULT 0.00`);
        await queryRunner.query(`ALTER TABLE "insumo" ADD "proveedor" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "insumo" ADD "precio_unitario" numeric(10,2) NOT NULL DEFAULT 0.00`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insumo" DROP COLUMN "precio_unitario"`);
        await queryRunner.query(`ALTER TABLE "insumo" DROP COLUMN "proveedor"`);
        await queryRunner.query(`ALTER TABLE "insumo" DROP COLUMN "stock_minimo"`);
    }
}
