# Aliadasalud

Este proyecto fue generado con [Angular CLI](https://github.com/angular/angular-cli) version 21.0.3.

## Stack Tecnológico

- **Angular 21** - Framework principal
- **PrimeNG 21** - Librería de componentes UI
- **Tailwind CSS 3** - Framework de utilidades CSS
- **PrimeIcons** - Sistema de iconos
- **TypeScript 5.9** - Lenguaje de programación
- **Supabase** - Backend as a Service (BaaS)

## Configuración de Supabase

Este proyecto utiliza Supabase como backend. Para configurarlo:

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Obtén tus credenciales desde: `Project Settings > API`
4. Copia el archivo `.env.example` y renómbralo a `.env` (no se incluye en git)
5. Actualiza los archivos de environment con tus credenciales:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY'
};
```

### Uso del servicio Supabase

El proyecto incluye un servicio de Supabase pre-configurado en `src/app/core/services/supabase.service.ts` con los siguientes métodos:

```typescript
// Inyectar el servicio en tu componente
constructor(private supabase: SupabaseService) {}

// Autenticación
await this.supabase.signIn(email, password);
await this.supabase.signUp(email, password);
await this.supabase.signOut();
await this.supabase.getCurrentUser();

// CRUD Operations
await this.supabase.getData('tabla');
await this.supabase.insertData('tabla', datos);
await this.supabase.updateData('tabla', id, datos);
await this.supabase.deleteData('tabla', id);

// Real-time subscriptions
this.supabase.subscribeToTable('tabla', (payload) => {
  console.log('Cambio detectado:', payload);
});
```

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
