const { Client } = require('pg');

const client = new Client({
  user: 'aprendiz',
  host: 'localhost',
  database: 'senavicoladb',
  password: '3145650',
  port: 5432,
});

async function main() {
  await client.connect();
  console.log('Connected to database');

  // 1. Add nombre column to permiso table
  console.log('--- Adding nombre column to permiso ---');
  await client.query(`
    ALTER TABLE permiso ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);
  `);
  // Update existing permission
  await client.query(`UPDATE permiso SET nombre = 'USUARIOS_CREAR' WHERE id_permiso = 1;`);

  // 2. Rename existing roles to match new naming convention
  console.log('--- Renaming roles ---');
  await client.query(`UPDATE rol SET nombre = 'ADMINISTRADOR' WHERE nombre = 'admin';`);
  await client.query(`UPDATE rol SET nombre = 'OPERARIO' WHERE nombre = 'aprendiz';`);
  await client.query(`UPDATE rol SET nombre = 'VISITANTE' WHERE nombre = 'visitante';`);

  // 3. Add area and id_unidad_medida to galpon
  console.log('--- Adding area and unit to galpon ---');
  await client.query(`ALTER TABLE galpon ADD COLUMN IF NOT EXISTS area DECIMAL;`);
  await client.query(`ALTER TABLE galpon ADD COLUMN IF NOT EXISTS id_unidad_medida UUID;`);
  // Add FK constraint if not exists
  try {
    await client.query(`
      ALTER TABLE galpon ADD CONSTRAINT fk_galpon_unidad_medida 
      FOREIGN KEY (id_unidad_medida) REFERENCES unidad_medida(id_unidad_medida) ON DELETE SET NULL;
    `);
  } catch (e) {
    console.log('FK constraint may already exist, skipping:', e.message);
  }

  // 4. Insert all permissions following MODULO_ACCION pattern
  console.log('--- Inserting permissions ---');
  const modules = ['GALPONES', 'LOTES', 'RAZAS', 'CATEGORIAS', 'INSUMOS', 'HUEVOS', 'REPORTES', 'USUARIOS', 'ROLES', 'CONFIGURACION', 'UNIDADES_MEDIDA'];
  const actions = ['VER', 'CREAR', 'EDITAR', 'ELIMINAR'];
  const descriptions = {
    'GALPONES': 'galpones', 'LOTES': 'lotes', 'RAZAS': 'razas',
    'CATEGORIAS': 'categorías', 'INSUMOS': 'insumos', 'HUEVOS': 'huevos',
    'REPORTES': 'reportes', 'USUARIOS': 'usuarios', 'ROLES': 'roles',
    'CONFIGURACION': 'configuración', 'UNIDADES_MEDIDA': 'unidades de medida',
  };
  const actionDescs = { 'VER': 'Ver', 'CREAR': 'Crear', 'EDITAR': 'Editar', 'ELIMINAR': 'Eliminar' };

  let code = 1000;
  for (const mod of modules) {
    for (const act of actions) {
      const nombre = `${mod}_${act}`;
      const descripcion = `${actionDescs[act]} ${descriptions[mod]}`;
      code++;
      try {
        await client.query(
          `INSERT INTO permiso (codigo, nombre, descripcion) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [code, nombre, descripcion]
        );
      } catch (e) {
        // Try update if insert fails
        const existing = await client.query(`SELECT id_permiso FROM permiso WHERE nombre = $1`, [nombre]);
        if (existing.rows.length === 0) {
          await client.query(
            `INSERT INTO permiso (codigo, nombre, descripcion) VALUES ($1, $2, $3)`,
            [code, nombre, descripcion]
          );
        }
      }
    }
  }

  // 5. Assign ALL permissions to ADMINISTRADOR
  console.log('--- Assigning permissions to ADMINISTRADOR ---');
  const adminRole = await client.query(`SELECT id_rol FROM rol WHERE nombre = 'ADMINISTRADOR'`);
  if (adminRole.rows.length > 0) {
    const adminRolId = adminRole.rows[0].id_rol;
    const allPerms = await client.query(`SELECT id_permiso FROM permiso`);
    for (const perm of allPerms.rows) {
      try {
        await client.query(
          `INSERT INTO rol_permiso (id_rol, id_permiso) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [adminRolId, perm.id_permiso]
        );
      } catch (e) {
        // Skip duplicates
      }
    }
  }

  // 6. Assign operational permissions to OPERARIO
  console.log('--- Assigning permissions to OPERARIO ---');
  const operarioRole = await client.query(`SELECT id_rol FROM rol WHERE nombre = 'OPERARIO'`);
  if (operarioRole.rows.length > 0) {
    const operRolId = operarioRole.rows[0].id_rol;
    const opModules = ['GALPONES', 'LOTES', 'RAZAS', 'CATEGORIAS', 'INSUMOS', 'HUEVOS', 'REPORTES', 'UNIDADES_MEDIDA'];
    const opActions = ['VER', 'CREAR', 'EDITAR'];
    const viewOnlyModules = ['USUARIOS', 'ROLES', 'CONFIGURACION'];

    for (const mod of opModules) {
      for (const act of opActions) {
        const nombre = `${mod}_${act}`;
        const perm = await client.query(`SELECT id_permiso FROM permiso WHERE nombre = $1`, [nombre]);
        if (perm.rows.length > 0) {
          try {
            await client.query(
              `INSERT INTO rol_permiso (id_rol, id_permiso) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [operRolId, perm.rows[0].id_permiso]
            );
          } catch (e) { /* skip */ }
        }
      }
    }
    for (const mod of viewOnlyModules) {
      const nombre = `${mod}_VER`;
      const perm = await client.query(`SELECT id_permiso FROM permiso WHERE nombre = $1`, [nombre]);
      if (perm.rows.length > 0) {
        try {
          await client.query(
            `INSERT INTO rol_permiso (id_rol, id_permiso) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [operRolId, perm.rows[0].id_permiso]
          );
        } catch (e) { /* skip */ }
      }
    }
  }

  // 7. Assign only VER permissions to VISITANTE
  console.log('--- Assigning VER permissions to VISITANTE ---');
  const visitanteRole = await client.query(`SELECT id_rol FROM rol WHERE nombre = 'VISITANTE'`);
  if (visitanteRole.rows.length > 0) {
    const visRolId = visitanteRole.rows[0].id_rol;
    for (const mod of modules) {
      const nombre = `${mod}_VER`;
      const perm = await client.query(`SELECT id_permiso FROM permiso WHERE nombre = $1`, [nombre]);
      if (perm.rows.length > 0) {
        try {
          await client.query(
            `INSERT INTO rol_permiso (id_rol, id_permiso) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [visRolId, perm.rows[0].id_permiso]
          );
        } catch (e) { /* skip */ }
      }
    }
  }

  // Verify
  console.log('\n--- VERIFICATION ---');
  const roles = await client.query('SELECT * FROM rol ORDER BY id_rol');
  console.log('Roles:', roles.rows);

  const perms = await client.query('SELECT id_permiso, nombre FROM permiso ORDER BY id_permiso');
  console.log('Total permissions:', perms.rows.length);

  const rpCount = await client.query('SELECT r.nombre, COUNT(rp.*) as permisos FROM rol r LEFT JOIN rol_permiso rp ON r.id_rol = rp.id_rol GROUP BY r.nombre');
  console.log('Permissions per role:', rpCount.rows);

  await client.end();
  console.log('\nMigration complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
