const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/', reportController.createReport);
router.get('/', reportController.getAllReports);
router.put('/:id', reportController.updateOneReport);
router.get('/:id', reportController.getOneReport);


    
module.exports = router;