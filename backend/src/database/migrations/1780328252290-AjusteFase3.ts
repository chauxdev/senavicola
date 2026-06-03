import { MigrationInterface, QueryRunner } from "typeorm";

export class AjusteFase31780328252290 implements MigrationInterface {
    name = 'AjusteFase31780328252290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "galpon" DROP CONSTRAINT "fk_galpon_unidad_medida"`);
        await queryRunner.query(`ALTER TABLE "produccion_huevo" DROP COLUMN "tipo_huevoId"`);
        await queryRunner.query(`ALTER TABLE "produccion_huevo" ADD "tipo_huevoId" uuid NOT NULL`);
        await queryRunner.query(
            `ALTER TABLE "permiso" ALTER COLUMN "nombre" TYPE character varying(255)`
        );
        await queryRunner.query(`ALTER TABLE "galpon" ADD CONSTRAINT "FK_6d43ffdc710f856c2554bf80dc7" FOREIGN KEY ("id_unidad_medida") REFERENCES "unidad_medida"("id_unidad_medida") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "produccion_huevo" ADD CONSTRAINT "FK_1f65551335f2fbeff52c3c570bf" FOREIGN KEY ("tipo_huevoId") REFERENCES "tipo_huevo"("id_tipo") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "produccion_huevo" DROP CONSTRAINT "FK_1f65551335f2fbeff52c3c570bf"`);
        await queryRunner.query(`ALTER TABLE "galpon" DROP CONSTRAINT "FK_6d43ffdc710f856c2554bf80dc7"`);
        await queryRunner.query(
            `ALTER TABLE "permiso" ALTER COLUMN "nombre" TYPE character varying(100)`
        );
        await queryRunner.query(`ALTER TABLE "produccion_huevo" DROP COLUMN "tipo_huevoId"`);
        await queryRunner.query(`ALTER TABLE "produccion_huevo" ADD "tipo_huevoId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "galpon" ADD CONSTRAINT "fk_galpon_unidad_medida" FOREIGN KEY ("id_unidad_medida") REFERENCES "unidad_medida"("id_unidad_medida") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
