import { Component, OnInit } from '@angular/core';
import { OrderService } from '../../services/order-weather.service';
import { ProductService } from '../../services/product.service';
import { Order, Product, OrderStatus } from '../../models';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  availableProducts: Product[] = [];
  selectedItems: { productId: string; quantity: number }[] = [];

  loading = false;
  errorMsg = '';
  successMsg = '';

  showCreateModal = false;
  showDetailModal = false;
  showDeleteModal = false;

  shippingAddress = '';
  orderNotes = '';
  estimatedTotal = 0;

  selectedOrder: Order | null = null;
  isEditing = false;
  newStatus: OrderStatus = 'pending';
  orderToDelete: Order | null = null;

  constructor(
    private orderService: OrderService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.orderService.getAll().subscribe({
      next: (res) => { this.orders = (res.data as Order[]) || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCreateModal(): void {
    this.productService.getAll(1, 50).subscribe({
      next: (res) => { this.availableProducts = res.data; }
    });
    this.selectedItems = [];
    this.shippingAddress = '';
    this.orderNotes = '';
    this.estimatedTotal = 0;
    this.showCreateModal = true;
  }

  isSelected(id: string): boolean {
    return this.selectedItems.some(i => i.productId === id);
  }

  getQty(id: string): number {
    return this.selectedItems.find(i => i.productId === id)?.quantity || 1;
  }

  toggleProduct(product: Product): void {
    const idx = this.selectedItems.findIndex(i => i.productId === product._id);
    if (idx > -1) {
      this.selectedItems.splice(idx, 1);
    } else {
      this.selectedItems.push({ productId: product._id!, quantity: 1 });
    }
    this.recalcTotal();
  }

  changeQty(id: string, delta: number): void {
    const item = this.selectedItems.find(i => i.productId === id);
    if (item) {
      item.quantity = Math.max(1, item.quantity + delta);
      this.recalcTotal();
    }
  }

  recalcTotal(): void {
    this.estimatedTotal = this.selectedItems.reduce((sum, si) => {
      const p = this.availableProducts.find(p => p._id === si.productId);
      return sum + (p ? p.price * si.quantity : 0);
    }, 0);
  }

  createOrder(): void {
    this.loading = true;
    this.orderService.create({
      productIds: this.selectedItems,
      shippingAddress: this.shippingAddress,
      notes: this.orderNotes
    }).subscribe({
      next: () => {
        this.showSuccess('Order placed successfully!');
        this.showCreateModal = false;
        this.loading = false;
        this.loadOrders();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to create order';
        this.loading = false;
      }
    });
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
    this.isEditing = false;
    this.showDetailModal = true;
  }

  editOrder(order: Order): void {
    this.selectedOrder = order;
    this.newStatus = order.status;
    this.isEditing = true;
    this.showDetailModal = true;
  }

  updateStatus(): void {
    if (!this.selectedOrder?._id) return;
    this.orderService.update(this.selectedOrder._id, { status: this.newStatus }).subscribe({
      next: () => {
        this.showSuccess('Order updated!');
        this.showDetailModal = false;
        this.loadOrders();
      },
      error: (err) => { this.errorMsg = err.error?.message || 'Update failed'; }
    });
  }

  confirmDelete(order: Order): void {
    this.orderToDelete = order;
    this.showDeleteModal = true;
  }

  deleteOrder(): void {
    if (!this.orderToDelete?._id) return;
    this.orderService.delete(this.orderToDelete._id).subscribe({
      next: () => {
        this.showSuccess('Order deleted');
        this.showDeleteModal = false;
        this.orderToDelete = null;
        this.loadOrders();
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Delete failed';
        this.showDeleteModal = false;
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg = msg;
    setTimeout(() => { this.successMsg = ''; }, 3000);
  }
}
