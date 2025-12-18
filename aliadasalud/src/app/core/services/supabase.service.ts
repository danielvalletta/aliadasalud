import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get client() {
    return this.supabase;
  }

  getData<T>(table: string, columns: string = '*'): Observable<T[]> {
    return from(
      this.supabase
        .from(table)
        .select(columns)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as T[];
      })
    );
  }

  getById<T>(table: string, id: string, columns: string = '*'): Observable<T> {
    return from(
      this.supabase
        .from(table)
        .select(columns)
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as T;
      })
    );
  }

  getByFilter<T>(
    table: string,
    column: string,
    value: any,
    columns: string = '*'
  ): Observable<T[]> {
    return from(
      this.supabase
        .from(table)
        .select(columns)
        .eq(column, value)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as T[];
      })
    );
  }

  insertData<T>(table: string, data: Partial<T> | Partial<T>[]): Observable<T[]> {
    return from(
      this.supabase
        .from(table)
        .insert(data)
        .select()
    ).pipe(
      map(({ data: result, error }) => {
        if (error) throw error;
        return result as T[];
      })
    );
  }

  updateData<T>(table: string, id: string, data: Partial<T>): Observable<T[]> {
    return from(
      this.supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
    ).pipe(
      map(({ data: result, error }) => {
        if (error) throw error;
        return result as T[];
      })
    );
  }

  updateByFilter<T>(
    table: string,
    column: string,
    value: any,
    data: Partial<T>
  ): Observable<T[]> {
    return from(
      this.supabase
        .from(table)
        .update(data)
        .eq(column, value)
        .select()
    ).pipe(
      map(({ data: result, error }) => {
        if (error) throw error;
        return result as T[];
      })
    );
  }

  deleteData(table: string, id: string): Observable<boolean> {
    return from(
      this.supabase
        .from(table)
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      })
    );
  }

  deleteByFilter(table: string, column: string, value: any): Observable<boolean> {
    return from(
      this.supabase
        .from(table)
        .delete()
        .eq(column, value)
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      })
    );
  }

  subscribeToTable(table: string, callback: (payload: any) => void) {
    return this.supabase
      .channel(`public:${table}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        callback
      )
      .subscribe();
  }

  subscribeToTableWithFilter(
    table: string,
    filter: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel(`public:${table}:${filter}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table, filter },
        callback
      )
      .subscribe();
  }

  unsubscribe(channel: any) {
    return this.supabase.removeChannel(channel);
  }

  uploadFile(bucket: string, path: string, file: File): Observable<any> {
    return from(
      this.supabase.storage
        .from(bucket)
        .upload(path, file)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  downloadFile(bucket: string, path: string): Observable<Blob> {
    return from(
      this.supabase.storage
        .from(bucket)
        .download(path)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  deleteFile(bucket: string, path: string): Observable<boolean> {
    return from(
      this.supabase.storage
        .from(bucket)
        .remove([path])
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return true;
      })
    );
  }

  listFiles(bucket: string, folder: string = ''): Observable<any[]> {
    return from(
      this.supabase.storage
        .from(bucket)
        .list(folder)
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      })
    );
  }
}
