import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateBarnAndHistory1783975126820 implements MigrationInterface {
    name = 'UpdateBarnAndHistory1783975126820'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP CONSTRAINT "FK_14818b91ed9cc21835604facbfc"`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP CONSTRAINT "FK_f26a1f4015dee43f03d9bb2f59a"`);
        await queryRunner.query(`UPDATE "galpon" SET "area" = COALESCE("area", "longitud", 0)`);
        await queryRunner.query(`ALTER TABLE "galpon" DROP COLUMN "longitud"`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD "fecha" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD "descripcion" character varying(255) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD "usuario" character varying(255) NOT NULL DEFAULT 'Sistema'`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD "nombre_elemento" character varying(255) NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD "raza_nombre" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "galpon" ALTER COLUMN "area" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD CONSTRAINT "FK_14818b91ed9cc21835604facbfc" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD CONSTRAINT "FK_f26a1f4015dee43f03d9bb2f59a" FOREIGN KEY ("id_galpon") REFERENCES "galpon"("id_galpon") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP CONSTRAINT "FK_f26a1f4015dee43f03d9bb2f59a"`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP CONSTRAINT "FK_14818b91ed9cc21835604facbfc"`);
        await queryRunner.query(`ALTER TABLE "galpon" ALTER COLUMN "area" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP COLUMN "raza_nombre"`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP COLUMN "nombre_elemento"`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP COLUMN "usuario"`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP COLUMN "descripcion"`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" DROP COLUMN "fecha"`);
        await queryRunner.query(`ALTER TABLE "galpon" ADD "longitud" numeric NOT NULL`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD CONSTRAINT "FK_f26a1f4015dee43f03d9bb2f59a" FOREIGN KEY ("id_galpon") REFERENCES "galpon"("id_galpon") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "historial_asignacion_lote" ADD CONSTRAINT "FK_14818b91ed9cc21835604facbfc" FOREIGN KEY ("id_lote") REFERENCES "lote"("id_lote") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
