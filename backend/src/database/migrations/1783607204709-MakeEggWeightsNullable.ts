import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeEggWeightsNullable1783607204709 implements MigrationInterface {
    name = 'MakeEggWeightsNullable1783607204709'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tipo_huevo" ALTER COLUMN "peso_min" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tipo_huevo" ALTER COLUMN "peso_max" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tipo_huevo" ALTER COLUMN "peso_max" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tipo_huevo" ALTER COLUMN "peso_min" SET NOT NULL`);
    }

}
