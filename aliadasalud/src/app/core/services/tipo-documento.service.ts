import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { TipoDocumento } from '../models/tipo-documento.model';

@Injectable({
  providedIn: 'root'
})
export class TipoDocumentoService {
  private supabaseService = inject(SupabaseService);

  getTiposDocumento(): Observable<TipoDocumento[]> {
    return from(
      this.supabaseService.client
        .from('tipos_documento')
        .select('*')
        .order('nombre', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as TipoDocumento[];
      }),
      catchError(error => {
        console.error('Error al obtener tipos de documento:', error);
        throw error;
      })
    );
  }

  getTipoDocumentoById(id: number): Observable<TipoDocumento> {
    return this.supabaseService.getById<TipoDocumento>('tipos_documento', id.toString());
  }
}
