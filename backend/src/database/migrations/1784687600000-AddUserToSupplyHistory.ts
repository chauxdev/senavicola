import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserToSupplyHistory1784687600000 implements MigrationInterface {
    name = 'AddUserToSupplyHistory1784687600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historial_insumo" ADD "usuario" character varying(255) NOT NULL DEFAULT 'Sistema'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historial_insumo" DROP COLUMN "usuario"`);
    }
}
