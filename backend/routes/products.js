const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Validation Helper ────────────────────────────────────────────────────────
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ success: false, errors: errors.array() });
  }
  return null;
};

// ─── GET /api/products ────────────────────────────────────────────────────────
// Retrieve all products with optional pagination & search
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category) {
      filter.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GET /api/products/:id 
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid product ID')],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─── POST /api/products 
router.post(
  '/',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
    body('description').optional().trim().isLength({ max: 500 }),
    body('category').optional().trim(),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const product = await Product.create(req.body);
      res.status(201).json({ success: true, data: product, message: 'Product created successfully' });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: 'Product with this name already exists' });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─── PUT /api/products/:id.
router.put(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid product ID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('price').optional().isFloat({ min: 0 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('stock').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const product = await Product.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new: true, runValidators: true }
      );

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({ success: true, data: product, message: 'Product updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// ─── DELETE /api/products/:id ─────────────────────────────────────────────────
router.delete(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid product ID')],
  async (req, res) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const product = await Product.findByIdAndDelete(req.params.id);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.json({ success: true, message: 'Product deleted successfully', data: { id: req.params.id } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
