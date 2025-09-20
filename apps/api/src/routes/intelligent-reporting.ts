// Shim para `routes/intelligent-reporting`
import express from 'express';
const router = express.Router();

// Endpoints mínimos para no romper import
router.get('/', (req, res) => res.json({ message: 'intelligent-reporting placeholder' }));

export default router;
