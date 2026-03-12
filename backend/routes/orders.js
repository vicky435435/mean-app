const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(protect);


const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  return null;
};


const calculateTotal = async (productItems) => {
  let total = 0;
  const enrichedItems = [];

  for (const item of productItems) {
    const product = await Product.findById(item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);

    const qty = item.quantity || 1;
    total += product.price * qty;
    enrichedItems.push({
      productId: item.productId,
      quantity: qty,
      priceAtOrder: product.price,
    });
  }

  return { total: parseFloat(total.toFixed(2)), enrichedItems };
};

// ─── GET /api/orders 
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('productIds.productId', 'name price category')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/orders/:id 
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid order ID')],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const order = await Order.findById(req.params.id).populate(
        'productIds.productId',
        'name price description category'
      );

      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Ensure the requesting user owns this order
      if (order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      res.json({ success: true, data: order });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─── POST /api/orders 
router.post(
  '/',
  [
    body('productIds')
      .isArray({ min: 1 })
      .withMessage('At least one product is required'),
    body('productIds.*.productId')
      .isMongoId()
      .withMessage('Each productId must be a valid Mongo ID'),
    body('productIds.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('shippingAddress').optional().trim().isLength({ max: 200 }),
    body('notes').optional().trim().isLength({ max: 300 }),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { productIds, shippingAddress, notes } = req.body;
      const { total, enrichedItems } = await calculateTotal(productIds);

      const order = await Order.create({
        userId: req.user.id,
        productIds: enrichedItems,
        totalAmount: total,
        shippingAddress,
        notes,
      });

      await order.populate('productIds.productId', 'name price category');

      res.status(201).json({
        success: true,
        data: order,
        message: 'Order created successfully',
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─── PUT /api/orders/:id 
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
      .withMessage('Invalid status value'),
    body('shippingAddress').optional().trim().isLength({ max: 200 }),
    body('notes').optional().trim().isLength({ max: 300 }),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Prevent modifying a delivered or cancelled order
      if (['delivered', 'cancelled'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot update an order with status "${order.status}"`,
        });
      }

      const { status, shippingAddress, notes, productIds } = req.body;
      if (status) order.status = status;
      if (shippingAddress !== undefined) order.shippingAddress = shippingAddress;
      if (notes !== undefined) order.notes = notes;

      // Recalculate if products change
      if (productIds && Array.isArray(productIds)) {
        const { total, enrichedItems } = await calculateTotal(productIds);
        order.productIds = enrichedItems;
        order.totalAmount = total;
      }

      await order.save();
      await order.populate('productIds.productId', 'name price category');

      res.json({ success: true, data: order, message: 'Order updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─── DELETE /api/orders/:id 
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid order ID')],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (order.userId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      if (order.status === 'shipped' || order.status === 'delivered') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete a shipped or delivered order',
        });
      }

      await Order.findByIdAndDelete(req.params.id);
      res.json({ success: true, message: 'Order deleted successfully', data: { id: req.params.id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
