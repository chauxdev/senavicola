import { MigrationInterface, QueryRunner } from "typeorm";

export class IncreasePasswordLength1780332423593 implements MigrationInterface {
    name = 'IncreasePasswordLength1780332423593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuario" ALTER COLUMN "password" TYPE character varying(300)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuario" ALTER COLUMN "password" TYPE character varying(255)`);
    }

}
