const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');

router.post('/', studyController.addOneStudyWithReport);
// router.get('/', studyController.getAllStudies);
// router.get('/instances/:dcm_instance_id/file', studyController.streamDownloadDicomInstance);
// router.put('/:id', studyController.updateOneStudy);
// router.get('/:id', studyController.getOneStudy);


    
module.exports = router;