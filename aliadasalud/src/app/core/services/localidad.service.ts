import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import {
  Provincia,
  Localidad,
  LocalidadCompleta,
  BusquedaLocalidadParams
} from '../models/localidad.model';

@Injectable({
  providedIn: 'root'
})
export class LocalidadService {
  private supabaseService = inject(SupabaseService);

  getProvincias(): Observable<Provincia[]> {
    return from(
      this.supabaseService.client
        .from('provincia')
        .select('*')
        .order('nombre', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Provincia[];
      }),
      catchError(error => {
        console.error('Error al obtener provincias:', error);
        throw error;
      })
    );
  }
  getProvinciaById(id: number): Observable<Provincia> {
    return this.supabaseService.getById<Provincia>('provincia', id.toString());
  }

  getLocalidadesByProvincia(provinciaId: number, limit?: number): Observable<Localidad[]> {
    let query = this.supabaseService.client
      .from('localidad')
      .select('*')
      .eq('provincia_id', provinciaId)
      .order('nombre', { ascending: true });

    if (limit) {
      query = query.limit(limit);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Localidad[];
      }),
      catchError(error => {
        console.error('Error al obtener localidades por provincia:', error);
        throw error;
      })
    );
  }

  buscarLocalidades(texto: string, provinciaId?: number, limit: number = 50): Observable<Localidad[]> {
    let query = this.supabaseService.client
      .from('localidad')
      .select('*')
      .ilike('nombre', `%${texto}%`)
      .order('nombre', { ascending: true })
      .limit(limit);

    if (provinciaId) {
      query = query.eq('provincia_id', provinciaId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Localidad[];
      }),
      catchError(error => {
        console.error('Error al buscar localidades:', error);
        throw error;
      })
    );
  }

  getLocalidadesCompletas(params: BusquedaLocalidadParams = {}): Observable<LocalidadCompleta[]> {
    let query = this.supabaseService.client
      .from('v_local_pcia_cp')
      .select('*')
      .order('localidad', { ascending: true });

    if (params.texto) {
      query = query.ilike('localidad', `%${params.texto}%`);
    }

    if (params.provinciaId) {
      // Nota: La vista usa el nombre de provincia, no el ID
      // Para filtrar por provincia específica, usar buscarLocalidades()
    }

    if (params.codigoPostal) {
      query = query.eq('codigopostal', params.codigoPostal);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    } else {
      query = query.limit(50); // Límite por defecto
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as LocalidadCompleta[];
      }),
      catchError(error => {
        console.error('Error al obtener localidades completas:', error);
        throw error;
      })
    );
  }

  buscarLocalidadesCompletas(texto: string, limit: number = 20): Observable<LocalidadCompleta[]> {
    const esCodigoPostal = /^\d+$/.test(texto);

    let query = this.supabaseService.client
      .from('v_local_pcia_cp')
      .select('*')
      .order('localidad', { ascending: true })
      .limit(limit);

    if (esCodigoPostal) {
      query = query.ilike('codigopostal', `${texto}%`);
    } else {
      query = query.ilike('localidad', `%${texto}%`);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as LocalidadCompleta[];
      }),
      catchError(error => {
        console.error('Error al buscar localidades completas:', error);
        throw error;
      })
    );
  }

  getLocalidadCompletaById(id: number): Observable<LocalidadCompleta | null> {
    return from(
      this.supabaseService.client
        .from('v_local_pcia_cp')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return null;
        return data as LocalidadCompleta;
      }),
      catchError(() => of(null))
    );
  }

  getLocalidadesByCodigoPostal(codigoPostal: string): Observable<Localidad[]> {
    return from(
      this.supabaseService.client
        .from('localidad')
        .select('*')
        .eq('codigopostal', codigoPostal)
        .order('nombre', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Localidad[];
      }),
      catchError(error => {
        console.error('Error al buscar por código postal:', error);
        throw error;
      })
    );
  }

  getLocalidadById(id: number): Observable<Localidad> {
    return this.supabaseService.getById<Localidad>('localidad', id.toString());
  }

  validarCodigoPostal(codigoPostal: string): Observable<boolean> {
    return from(
      this.supabaseService.client
        .from('localidad')
        .select('id', { count: 'exact', head: true })
        .eq('codigopostal', codigoPostal)
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return (count ?? 0) > 0;
      }),
      catchError(error => {
        console.error('Error al validar código postal:', error);
        return [false];
      })
    );
  }

  getCountLocalidadesByProvincia(provinciaId: number): Observable<number> {
    return from(
      this.supabaseService.client
        .from('localidad')
        .select('id', { count: 'exact', head: true })
        .eq('provincia_id', provinciaId)
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return count ?? 0;
      }),
      catchError(error => {
        console.error('Error al contar localidades:', error);
        return [0];
      })
    );
  }
}
