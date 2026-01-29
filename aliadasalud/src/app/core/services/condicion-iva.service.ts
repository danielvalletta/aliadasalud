import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { CondicionIva } from '../models/condicion-iva.model';

@Injectable({
  providedIn: 'root'
})
export class CondicionIvaService {
  private supabaseService = inject(SupabaseService);

  getCondicionesIva(): Observable<CondicionIva[]> {
    return from(
      this.supabaseService.client
        .from('condiciones_iva')
        .select('*')
        .order('nombre', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as CondicionIva[];
      }),
      catchError(error => {
        console.error('Error al obtener condiciones IVA:', error);
        throw error;
      })
    );
  }
  getCondicionIvaById(id: number): Observable<CondicionIva> {
    return this.supabaseService.getById<CondicionIva>('condiciones_iva', id.toString());
  }

  getCondicionIvaByCodigo(codigo: string): Observable<CondicionIva> {
    return from(
      this.supabaseService.client
        .from('condiciones_iva')
        .select('*')
        .eq('codigo', codigo)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as CondicionIva;
      }),
      catchError(error => {
        console.error('Error al obtener condición IVA por código:', error);
        throw error;
      })
    );
  }
}
