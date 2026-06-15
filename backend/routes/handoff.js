const express = require('express');
const router = express.Router();
const { submitHandoff } = require('../controllers/handoffController');
const wrap = require('../middleware/asyncHandler');

router.post('/', wrap(submitHandoff));

module.exports = router;
