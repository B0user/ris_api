const express = require('express');
const router = express.Router();
const registerController = require('../controllers/auth/registerController');

router.post('/', registerController.createNewDoctorRecord);

module.exports = router;