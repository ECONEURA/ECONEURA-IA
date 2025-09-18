// Auto shim for oncall
import express from 'express';
const router = express.Router();
router.get('/', (req, res) => res.json({ message: 'oncall placeholder' }));
export default router;
