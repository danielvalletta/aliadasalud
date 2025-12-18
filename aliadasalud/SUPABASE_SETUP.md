# Guía de Configuración de Supabase

## 1. Crear Proyecto en Supabase

1. Visita [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda la contraseña de la base de datos (la necesitarás más adelante)

## 2. Obtener Credenciales

1. Ve a `Project Settings` (engranaje en la barra lateral)
2. Selecciona `API` en el menú
3. Copia las siguientes credenciales:
   - **Project URL** (supabaseUrl)
   - **anon public** key (supabaseKey)

## 3. Configurar el Proyecto Angular

Actualiza los archivos de environment:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseKey: 'tu-anon-key-aqui'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  supabaseUrl: 'https://tu-proyecto.supabase.co',
  supabaseKey: 'tu-anon-key-aqui'
};
```

## 4. Crear Tablas en Supabase

Ejemplo de tabla de usuarios:

```sql
-- Crear tabla de perfiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table profiles enable row level security;

-- Crear política para que los usuarios puedan ver su propio perfil
create policy "Los usuarios pueden ver su propio perfil"
  on profiles for select
  using ( auth.uid() = id );

-- Crear política para que los usuarios puedan actualizar su propio perfil
create policy "Los usuarios pueden actualizar su propio perfil"
  on profiles for update
  using ( auth.uid() = id );
```

## 5. Ejemplo de Uso en Componente

```typescript
import { Component, OnInit } from '@angular/core';
import { SupabaseService } from './core/services/supabase.service';

@Component({
  selector: 'app-ejemplo',
  template: `
    <div class="p-4">
      <button (click)="cargarDatos()" class="px-4 py-2 bg-blue-500 text-white rounded">
        Cargar Datos
      </button>

      <div *ngFor="let item of datos" class="mt-4 p-4 border rounded">
        {{ item | json }}
      </div>
    </div>
  `
})
export class EjemploComponent implements OnInit {
  datos: any[] = [];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.verificarUsuario();
  }

  async verificarUsuario() {
    const user = await this.supabase.getCurrentUser();
    console.log('Usuario actual:', user);
  }

  async cargarDatos() {
    try {
      this.datos = await this.supabase.getData('tu_tabla');
      console.log('Datos cargados:', this.datos);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }

  async crearRegistro() {
    try {
      const nuevo = await this.supabase.insertData('tu_tabla', {
        nombre: 'Ejemplo',
        descripcion: 'Descripción de ejemplo'
      });
      console.log('Registro creado:', nuevo);
    } catch (error) {
      console.error('Error al crear registro:', error);
    }
  }
}
```

## 6. Habilitar Autenticación

En el dashboard de Supabase:

1. Ve a `Authentication` > `Providers`
2. Habilita los proveedores que necesites:
   - Email
   - Google
   - GitHub
   - etc.

## 7. Storage (Almacenamiento de Archivos)

Para subir archivos:

```typescript
async subirArchivo(file: File) {
  const fileName = `${Date.now()}_${file.name}`;
  const { data, error } = await this.supabase.client.storage
    .from('bucket-name')
    .upload(fileName, file);

  if (error) throw error;
  return data;
}

async obtenerUrlPublica(path: string) {
  const { data } = this.supabase.client.storage
    .from('bucket-name')
    .getPublicUrl(path);

  return data.publicUrl;
}
```

## 8. Real-time Subscriptions

Para escuchar cambios en tiempo real:

```typescript
ngOnInit() {
  // Suscribirse a cambios en una tabla
  this.supabase.subscribeToTable('tu_tabla', (payload) => {
    console.log('Cambio detectado:', payload);

    if (payload.eventType === 'INSERT') {
      this.datos.push(payload.new);
    } else if (payload.eventType === 'UPDATE') {
      const index = this.datos.findIndex(d => d.id === payload.new.id);
      if (index !== -1) {
        this.datos[index] = payload.new;
      }
    } else if (payload.eventType === 'DELETE') {
      this.datos = this.datos.filter(d => d.id !== payload.old.id);
    }
  });
}
```

## Recursos Adicionales

- [Documentación oficial de Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Ejemplos de Supabase](https://github.com/supabase/supabase/tree/master/examples)
