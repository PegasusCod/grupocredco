<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'ver dashboard',

            'ver proyectos',
            'crear proyectos',
            'editar proyectos',
            'eliminar proyectos',

            'ver almacenes',
            'crear almacenes',
            'editar almacenes',
            'eliminar almacenes',

            'ver trabajadores',
            'crear trabajadores',
            'editar trabajadores',
            'eliminar trabajadores',

            'ver cargos laborales',
            'crear cargos laborales',
            'editar cargos laborales',
            'eliminar cargos laborales',

            'ver categorias epp',
            'crear categorias epp',
            'editar categorias epp',
            'eliminar categorias epp',

            'ver tallas',
            'crear tallas',
            'editar tallas',
            'eliminar tallas',

            'ver epp items',
            'crear epp items',
            'editar epp items',
            'eliminar epp items',

            'ver epp skus',
            'crear epp skus',
            'editar epp skus',
            'eliminar epp skus',

            'ver stock',
            'ver kardex',

            'ver ingresos',
            'crear ingresos',
            'editar ingresos',
            'confirmar ingresos',
            'anular ingresos',

            'ver entregas',
            'crear entregas',
            'editar entregas',
            'confirmar entregas',
            'anular entregas',

            'ver custodias',
            'cerrar custodias',

            'ver incidencias',
            'crear incidencias',
            'editar incidencias',
            'cerrar incidencias',

            'ver transferencias',
            'crear transferencias',
            'editar transferencias',
            'confirmar transferencias',
            'anular transferencias',

            'ver disposicion final',
            'crear disposicion final',
            'editar disposicion final',
            'confirmar disposicion final',
            'anular disposicion final',

            'ver ajustes inventario',
            'crear ajustes inventario',
            'editar ajustes inventario',
            'confirmar ajustes inventario',
            'anular ajustes inventario',

            'ver reportes',
            'exportar reportes',

            'ver usuarios',
            'crear usuarios',
            'editar usuarios',
            'eliminar usuarios',

            'ver roles',
            'crear roles',
            'editar roles',
            'eliminar roles',

            'ver permisos',
            'asignar roles',
            'asignar permisos',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $superAdmin = Role::firstOrCreate([
            'name' => 'Super Admin',
            'guard_name' => 'web',
        ]);

        $administrador = Role::firstOrCreate([
            'name' => 'Administrador',
            'guard_name' => 'web',
        ]);

        $almacenero = Role::firstOrCreate([
            'name' => 'Almacenero',
            'guard_name' => 'web',
        ]);

        $supervisor = Role::firstOrCreate([
            'name' => 'Supervisor',
            'guard_name' => 'web',
        ]);

        $superAdmin->syncPermissions(Permission::all());

        $administrador->syncPermissions([
            'ver dashboard',

            'ver proyectos',
            'crear proyectos',
            'editar proyectos',
            'eliminar proyectos',

            'ver almacenes',
            'crear almacenes',
            'editar almacenes',
            'eliminar almacenes',

            'ver trabajadores',
            'crear trabajadores',
            'editar trabajadores',
            'eliminar trabajadores',

            'ver cargos laborales',
            'crear cargos laborales',
            'editar cargos laborales',
            'eliminar cargos laborales',

            'ver categorias epp',
            'crear categorias epp',
            'editar categorias epp',
            'eliminar categorias epp',

            'ver tallas',
            'crear tallas',
            'editar tallas',
            'eliminar tallas',

            'ver epp items',
            'crear epp items',
            'editar epp items',
            'eliminar epp items',

            'ver epp skus',
            'crear epp skus',
            'editar epp skus',
            'eliminar epp skus',

            'ver stock',
            'ver kardex',

            'ver ingresos',
            'crear ingresos',
            'editar ingresos',
            'confirmar ingresos',
            'anular ingresos',

            'ver entregas',
            'crear entregas',
            'editar entregas',
            'confirmar entregas',
            'anular entregas',

            'ver custodias',
            'cerrar custodias',

            'ver incidencias',
            'crear incidencias',
            'editar incidencias',
            'cerrar incidencias',

            'ver transferencias',
            'crear transferencias',
            'editar transferencias',
            'confirmar transferencias',
            'anular transferencias',

            'ver disposicion final',
            'crear disposicion final',
            'editar disposicion final',
            'confirmar disposicion final',
            'anular disposicion final',

            'ver ajustes inventario',
            'crear ajustes inventario',
            'editar ajustes inventario',
            'confirmar ajustes inventario',
            'anular ajustes inventario',

            'ver reportes',
            'exportar reportes',

            'ver usuarios',
            'crear usuarios',
            'editar usuarios',
        ]);

        $almacenero->syncPermissions([
            'ver dashboard',

            'ver almacenes',
            'ver trabajadores',
            'ver categorias epp',
            'ver tallas',
            'ver epp items',
            'ver epp skus',
            'ver stock',
            'ver kardex',

            'ver ingresos',
            'crear ingresos',
            'editar ingresos',

            'ver entregas',
            'crear entregas',
            'editar entregas',

            'ver custodias',

            'ver incidencias',
            'crear incidencias',
            'editar incidencias',

            'ver transferencias',
            'crear transferencias',
            'editar transferencias',

            'ver disposicion final',
            'crear disposicion final',
            'editar disposicion final',

            'ver ajustes inventario',
            'crear ajustes inventario',
            'editar ajustes inventario',

            'ver reportes',
        ]);

        $supervisor->syncPermissions([
            'ver dashboard',
            'ver proyectos',
            'ver almacenes',
            'ver trabajadores',
            'ver cargos laborales',
            'ver categorias epp',
            'ver tallas',
            'ver epp items',
            'ver epp skus',
            'ver stock',
            'ver kardex',
            'ver ingresos',
            'ver entregas',
            'ver custodias',
            'ver incidencias',
            'ver transferencias',
            'ver disposicion final',
            'ver ajustes inventario',
            'ver reportes',
        ]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}