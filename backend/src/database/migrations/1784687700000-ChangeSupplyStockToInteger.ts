import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSupplyStockToInteger1784687700000 implements MigrationInterface {
    name = 'ChangeSupplyStockToInteger1784687700000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "cantidad" TYPE integer USING "cantidad"::integer`);
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "stock_minimo" TYPE integer USING "stock_minimo"::integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "cantidad" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "insumo" ALTER COLUMN "stock_minimo" TYPE numeric(10,2)`);
    }
}
