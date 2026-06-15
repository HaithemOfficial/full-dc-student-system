const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, resetPassword } = require('../controllers/userController');
const { protect, founderOnly } = require('../middleware/auth');
const wrap = require('../middleware/asyncHandler');

router.use(protect);

// Any authenticated user can fetch the minimal user list (needed for task assignment)
const User = require('../models/User');
router.get('/assignable', wrap(async (req, res) => {
  const users = await User.find({ isActive: true }, '_id name role');
  res.json(users);
}));

router.use(founderOnly);
router.get('/', wrap(getUsers));
router.post('/', wrap(createUser));
router.put('/:id', wrap(updateUser));
router.delete('/:id', wrap(deleteUser));
router.put('/:id/reset-password', wrap(resetPassword));

module.exports = router;
