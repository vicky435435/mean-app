import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { FormControl } from '@angular/forms';
import {
  ProductActions,
  selectAllProducts,
  selectProductsLoading,
  selectProductsError,
  selectProductsTotal
} from '../../store/product.store';
import { Product } from '../../models';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  products$      = this.store.select(selectAllProducts);
  loading$       = this.store.select(selectProductsLoading);
  error$         = this.store.select(selectProductsError);
  total$         = this.store.select(selectProductsTotal);

  searchControl  = new FormControl('');
  showModal      = false;
  showDeleteModal= false;
  editMode       = false;

  formData: Partial<Product> = this.emptyForm();
  productToDelete: Product | null = null;

  private destroy$ = new Subject<void>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(ProductActions.loadProducts({}));

    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(search => {
      this.store.dispatch(ProductActions.loadProducts({ search: search || '' }));
    });
  }

  openCreate(): void {
    this.editMode = false;
    this.formData = this.emptyForm();
    this.showModal = true;
  }

  openEdit(product: Product): void {
    this.editMode = true;
    this.formData = { ...product };
    this.showModal = true;
  }

  confirmDelete(product: Product): void {
    this.productToDelete = product;
    this.showDeleteModal = true;
  }

  deleteProduct(): void {
    if (this.productToDelete?._id) {
      this.store.dispatch(ProductActions.deleteProduct({ id: this.productToDelete._id }));
    }
    this.showDeleteModal = false;
    this.productToDelete = null;
  }

  onSubmit(): void {
    if (!this.formData.name || this.formData.price === undefined) return;

    if (this.editMode && this.formData._id) {
      const { _id, ...updates } = this.formData;
      this.store.dispatch(ProductActions.updateProduct({ id: _id, product: updates }));
    } else {
      const { _id, ...newProduct } = this.formData;
      this.store.dispatch(ProductActions.createProduct({ product: newProduct as Omit<Product, '_id'> }));
    }
    this.closeModal();
  }

  closeModal(): void {
    this.showModal = false;
    this.formData = this.emptyForm();
  }

  clearError(): void {
    this.store.dispatch(ProductActions.clearError());
  }

  trackById(_: number, p: Product): string {
    return p._id || '';
  }

  private emptyForm(): Partial<Product> {
    return { name: '', price: 0, description: '', category: '', stock: 0 };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
