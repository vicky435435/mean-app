import { createReducer, createAction, props, on, createSelector, createFeatureSelector } from '@ngrx/store';
import { createEffect, Actions, ofType } from '@ngrx/effects';
import { Injectable } from '@angular/core';
import { switchMap, map, catchError, of } from 'rxjs';
import { Product } from '../models';
import { ProductService } from '../services/product.service';


export const ProductActions = {
  loadProducts:        createAction('[Products] Load',          props<{ page?: number; search?: string }>()),
  loadProductsSuccess: createAction('[Products] Load Success',  props<{ products: Product[]; total: number; pages: number }>()),
  loadProductsFailure: createAction('[Products] Load Failure',  props<{ error: string }>()),

  createProduct:        createAction('[Products] Create',         props<{ product: Omit<Product, '_id'> }>()),
  createProductSuccess: createAction('[Products] Create Success', props<{ product: Product }>()),
  createProductFailure: createAction('[Products] Create Failure', props<{ error: string }>()),

  updateProduct:        createAction('[Products] Update',         props<{ id: string; product: Partial<Product> }>()),
  updateProductSuccess: createAction('[Products] Update Success', props<{ product: Product }>()),
  updateProductFailure: createAction('[Products] Update Failure', props<{ error: string }>()),

  deleteProduct:        createAction('[Products] Delete',         props<{ id: string }>()),
  deleteProductSuccess: createAction('[Products] Delete Success', props<{ id: string }>()),
  deleteProductFailure: createAction('[Products] Delete Failure', props<{ error: string }>()),

  setSelectedProduct: createAction('[Products] Set Selected', props<{ product: Product | null }>()),
  clearError:         createAction('[Products] Clear Error'),
};


export interface ProductState {
  products:        Product[];
  selectedProduct: Product | null;
  loading:         boolean;
  error:           string | null;
  total:           number;
  pages:           number;
}

const initialState: ProductState = {
  products: [], selectedProduct: null,
  loading: false, error: null, total: 0, pages: 0,
};


export const productReducer = createReducer(
  initialState,
  on(ProductActions.loadProducts,        s => ({ ...s, loading: true, error: null })),
  on(ProductActions.loadProductsSuccess, (s, { products, total, pages }) => ({ ...s, loading: false, products, total, pages })),
  on(ProductActions.loadProductsFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(ProductActions.createProduct,        s => ({ ...s, loading: true })),
  on(ProductActions.createProductSuccess, (s, { product }) => ({ ...s, loading: false, products: [product, ...s.products], total: s.total + 1 })),
  on(ProductActions.createProductFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(ProductActions.updateProduct,        s => ({ ...s, loading: true })),
  on(ProductActions.updateProductSuccess, (s, { product }) => ({
    ...s, loading: false,
    products: s.products.map(p => p._id === product._id ? product : p),
    selectedProduct: product,
  })),
  on(ProductActions.updateProductFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(ProductActions.deleteProduct,        s => ({ ...s, loading: true })),
  on(ProductActions.deleteProductSuccess, (s, { id }) => ({ ...s, loading: false, products: s.products.filter(p => p._id !== id), total: s.total - 1 })),
  on(ProductActions.deleteProductFailure, (s, { error }) => ({ ...s, loading: false, error })),

  on(ProductActions.setSelectedProduct, (s, { product }) => ({ ...s, selectedProduct: product })),
  on(ProductActions.clearError,         s => ({ ...s, error: null })),
);

// ─── Selectors
const selectFeature       = createFeatureSelector<ProductState>('products');
export const selectAllProducts      = createSelector(selectFeature, s => s.products);
export const selectProductsLoading  = createSelector(selectFeature, s => s.loading);
export const selectProductsError    = createSelector(selectFeature, s => s.error);
export const selectSelectedProduct  = createSelector(selectFeature, s => s.selectedProduct);
export const selectProductsTotal    = createSelector(selectFeature, s => s.total);

// ─── Effects 
@Injectable()
export class ProductEffects {
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.loadProducts),
      switchMap(({ page, search }) =>
        this.svc.getAll(page || 1, 10, search || '').pipe(
          map(res => ProductActions.loadProductsSuccess({ products: res.data, total: res.pagination.total, pages: res.pagination.pages })),
          catchError(err => of(ProductActions.loadProductsFailure({ error: err.error?.message || 'Failed to load' })))
        )
      )
    )
  );

  create$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.createProduct),
      switchMap(({ product }) =>
        this.svc.create(product).pipe(
          map(res => ProductActions.createProductSuccess({ product: res.data! })),
          catchError(err => of(ProductActions.createProductFailure({ error: err.error?.message || 'Failed to create' })))
        )
      )
    )
  );

  update$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.updateProduct),
      switchMap(({ id, product }) =>
        this.svc.update(id, product).pipe(
          map(res => ProductActions.updateProductSuccess({ product: res.data! })),
          catchError(err => of(ProductActions.updateProductFailure({ error: err.error?.message || 'Failed to update' })))
        )
      )
    )
  );

  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProductActions.deleteProduct),
      switchMap(({ id }) =>
        this.svc.delete(id).pipe(
          map(() => ProductActions.deleteProductSuccess({ id })),
          catchError(err => of(ProductActions.deleteProductFailure({ error: err.error?.message || 'Failed to delete' })))
        )
      )
    )
  );

  constructor(private actions$: Actions, private svc: ProductService) {}
}
