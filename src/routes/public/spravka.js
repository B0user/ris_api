const express = require('express');
const router = express.Router();
const spravkaController = require('../../controllers/spravkaController');

router.get('/:id', spravkaController.getSpravka);

module.exports = router;