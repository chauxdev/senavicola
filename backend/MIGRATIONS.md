## Paso 1: Instalar TypeORM
## El 'pg' indica el motor de bd, en este caso postgres
npm install @nestjs/typeorm typeorm pg

## Paso 2: Crear data-source.ts para que el CLI de TypeORM pueda conectarse a la db, saber dónde guardar las migraciones y encontrar todas las entitys, se ubicó en el directorio src/config/data-source.ts

## Paso 3: Crear entitys

## Paso 4: En nuestro package.json establecemos los scripts que vamos a utilizar para generar y ejecutar migraciones

## Paso 5: Generamos la migración
npm run migration:generate -- "Directorio donde vamos a guardar la migración y nombre, ejemplo (database/migrations/CreateUsersTable)"

## Paso 6: Ejecutamos todas las migraciones que no hayan sido ejecutadas
npm run migration:run