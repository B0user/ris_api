const { Study, Report } = require('../models/Schemas');
const { report } = require('../routes/pacs');
const { uploadDicomToPACS } = require('../utils/pacsUtils');
// Adjust the path if needed
const axios = require('axios');

const PACS_SERVER_URL = "https://html.ris.hippokrat.kz";

const createMWLStudy = async (req, res) => {
    try {
        const { modality, patient_info, study_info } = req.body;

        const newStudy = new Study({
            modality,
            patient_info,
            study_info,
            status: 'MWL_PENDING',
        });

        await newStudy.save();
        res.status(201).json({ message: 'MWL Study created', study: newStudy });
    } catch (error) {
        console.error('Error creating MWL Study:', error.message);
        res.status(500).json({ error: 'Failed to create MWL Study' });
    }
};

const updateStudyStatus = async (req, res) => {
    try {
        const { dcm_study_id, status } = req.body;

        const updatedStudy = await Study.findOneAndUpdate(
            { dcm_study_id },
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!updatedStudy) {
            return res.status(404).json({ error: 'Study not found' });
        }

        res.status(200).json({ message: 'Study status updated', study: updatedStudy });
    } catch (error) {
        console.error('Error updating Study status:', error.message);
        res.status(500).json({ error: 'Failed to update Study status' });
    }
};

const uploadStudyToPACS = async (req, res) => {
    try {
        const { dcm_study_id, pacs_target } = req.body;
        console.log(`Received request to upload study to PACS. Study ID: ${dcm_study_id}, PACS Target: ${pacs_target}`);

        // Find the study in the database
        const study = await Study.findOne({ dcm_study_id });
        if (!study) {
            console.error(`Study with ID ${dcm_study_id} not found.`);
            return res.status(404).json({ error: 'Study not found' });
        }
        console.log(`Found study: ${study}`);

        // Check if the study is already uploaded to the PACS
        if (study.status === 'COMPLETED' && study.pacs_target === pacs_target) {
            console.log(`Study already uploaded to PACS. Study ID: ${dcm_study_id}`);
            return res.status(200).json({ message: 'Study already uploaded to PACS', study });
        }

        console.log(`Uploading study instances to PACS. Study ID: ${dcm_study_id}`);
        // Upload each DICOM instance in the study
        for (const series of study.series) {
            console.log(`Processing series: ${series.dcm_series_id}`);
            for (const instance of series.instances) {
                console.log(`Processing instance: ${instance.dcm_instance_id}`);
                const dicomData = await fetchDICOM(instance.path); // Replace with actual DICOM fetching logic
                console.log(`Fetched DICOM data for instance: ${instance.dcm_instance_id}`);
                await uploadDicomToPACS(dicomData); // Replace with actual PACS uploading logic
                console.log(`Uploaded instance ${instance.dcm_instance_id} to PACS`);
            }
        }

        // Update study status and PACS target
        study.status = 'COMPLETED';
        study.pacs_target = pacs_target;
        await study.save();
        console.log(`Study status updated to COMPLETED. Study ID: ${dcm_study_id}`);

        console.log(`Creating report for study ID: ${dcm_study_id}`);
        await createReport({
            patient_info: study.patient_info,
            study_info: study.study_info,
            pacs_tree: {
                study_instance_uid: study.dcm_study_id,
                series: study.series.map((series) => ({
                    series_instance_uid: series.dcm_series_id,
                    instances: series.instances.map((instance) => instance.dcm_instance_id),
                })),
            },
        });

        console.log(`Study uploaded to PACS and report created successfully. Study ID: ${dcm_study_id}`);
        res.status(200).json({ message: 'Study uploaded to PACS and report created if needed', study });
    } catch (error) {
        console.error('Error uploading Study to PACS:', error.message);
        res.status(500).json({ error: 'Failed to upload Study to PACS' });
    }
};

const addOneStudyWithReport = async (req, res) => {
    try {
        let { patient_info, study_info, med_records, questionnaire, doctor_info } = req.body;

        // console.log(questionnaire);
        console.log('Received Questionnaire:', questionnaire);

        try {
            if (typeof patient_info === 'string') {
                patient_info = JSON.parse(patient_info);
            }
            if (typeof study_info === 'string') {
                study_info = JSON.parse(study_info);
            }
            if (typeof med_records === 'string') {
                med_records = JSON.parse(med_records);
            }
            
            
            if (typeof questionnaire === 'string') {
                try {
                  questionnaire = JSON.parse(questionnaire);
                } catch (err) {
                  console.error('Error parsing questionnaire JSON:', err.message);
                  return res.status(400).json({ error: 'Invalid questionnaire JSON' });
                }
              }
              
              // Ensure the questionnaire is an array of objects with `question` and `answer` fields
              if (!Array.isArray(questionnaire) || !questionnaire.every(q => typeof q === 'object' && q.question && 'answer' in q)) {
                console.error('Invalid questionnaire format:', questionnaire);
                return res.status(400).json({ error: 'Questionnaire must be an array of objects with "question" and "answer" fields.' });
              }
              
              
            
            if (patient_info.gender === 'f') {
                patient_info.gender = 'female';
            } else if (patient_info.gender === 'm') {
                patient_info.gender = 'male';
            }          
            if (typeof doctor_info === 'string') {
                doctor_info = JSON.parse(doctor_info);
            }
        } catch (parseError) {
            console.error('Error parsing JSON inputs:', parseError.message);
            return res.status(400).json({ error: 'Invalid JSON in request body' });
        }

        // Validate input data
        if (!req.files || !req.files.dcm_files || !patient_info || !study_info) {
            console.log("Request validation failed. Missing required fields.");
            return res.status(400).json({ error: 'Incomplete request body' });
        }

        // console.log('Received request to add a study with report.');
        // console.log(`Patient Info: ${JSON.stringify(patient_info)}`);
        // console.log(`Study Info: ${JSON.stringify(study_info)}`);
        // console.log(`Number of DICOM files: ${req.files.dcm_files.length}`);

        console.log('-------START UPLOAD DICOM FILES--------');
        const dcmFiles = req.files.dcm_files;

        // Initialize data for the new study and report
        let pacsTree = {
            study_instance_uid: null,
            series: [],
        };

        // Loop through DICOM files and upload them to PACS
        for (const [index, dicomFile] of dcmFiles.entries()) {
            console.log(`Uploading DICOM file ${index + 1}/${dcmFiles.length} to PACS.`);

            const dicomUploadResponse = await axios.post(`${PACS_SERVER_URL}/instances`, dicomFile.data, {
                headers: {
                    'Content-Type': 'application/dicom',
                    'Authorization': 'Basic ' + Buffer.from('alice:alicePassword').toString('base64'),
                },
            });

            // console.log(`PACS upload response: ${dicomUploadResponse.data.Status}`);
            if (dicomUploadResponse.status !== 200) {
                console.error(`Failed to upload DICOM file ${index + 1}: ${dicomUploadResponse.statusText}`);
                return res.status(dicomUploadResponse.status).json({ error: dicomUploadResponse.statusText });
            }

            const {
                ParentStudy: dcm_study_id,
                ParentSeries: dcm_series_id,
                ID: dcm_instance_id,
                ParentPatient: patient_id,
                Path: path,
            } = dicomUploadResponse.data;

            // console.log(`DICOM Metadata: Study ID=${dcm_study_id}, Series ID=${dcm_series_id}, Instance ID=${dcm_instance_id}`);

            if (!pacsTree.study_instance_uid) {
                pacsTree.study_instance_uid = dcm_study_id;
                // console.log(`Set study_instance_uid: ${dcm_study_id}`);
            }

            let series = pacsTree.series.find(s => s.series_instance_uid === dcm_series_id);
            if (!series) {
                series = {
                    series_instance_uid: dcm_series_id,
                    instances: [],
                };
                pacsTree.series.push(series);
                // console.log(`Added new series: ${dcm_series_id}`);
            }

            series.instances.push(dcm_instance_id);
            // console.log(`Added instance to series ${dcm_series_id}: ${dcm_instance_id}`);

            // Update or create the study in the database
            let foundStudy = await Study.findOne({ dcm_study_id });
            if (foundStudy) {
                // console.log(`Study found in database: ${dcm_study_id}`);
                let foundSeries = foundStudy.series.find(series => series.dcm_series_id === dcm_series_id);

                if (foundSeries) {
                    // console.log(`Series found in study: ${dcm_series_id}`);
                    if (!foundSeries.instances.some(instance => instance.dcm_instance_id === dcm_instance_id)) {
                        foundSeries.instances.push({ dcm_instance_id, path });
                        // console.log(`Added instance to existing series: ${dcm_instance_id}`);
                    }
                } else {
                    foundStudy.series.push({
                        dcm_series_id,
                        instances: [{ dcm_instance_id, path }],
                    });
                    // console.log(`Added new series with instance to study: ${dcm_series_id}`);
                }

                await foundStudy.save();
                // console.log(`Study updated successfully: ${dcm_study_id}`);
            } else {
                // console.log(`Creating new study: ${dcm_study_id}`);
                const { modality } = study_info; // Extract modality from study_info

                if (!modality) {
                    throw new Error('Modality is missing in the provided study_info');
                }

                newStudy = new Study({
                    dcm_study_id,
                    modality, // Ensure modality is included
                    patient_info,
                    study_info,
                    series: [{
                        dcm_series_id,
                        instances: [{ dcm_instance_id, path }],
                    }],
                    mwl_status: 'IN_PROGRESS',
                });

                await newStudy.save();
                // console.log(`New study created: ${dcm_study_id}`);
            }
        }
        
        console.log('-------END UPLOAD DICOM FILES--------');
        // Create a new report document
        // console.log('Creating new report document...');

        console.log(patient_info);


        const reportData = {
            important_information: {
                patient: patient_info,
                med_records,
                questionnaire,
            },
            study: {
                study_date: study_info.date,
                modality: study_info.modality,
                pacs_tree: pacsTree,
                status: 'new',
            },
            description: {
                text: '',
                doctor_information: doctor_info,
                templates_used: [],
                attachments: [],
            },
            status: 'N/A',
        };

        // console.log(reportData);
        const newReport = new Report(reportData);

        const result_report = await newReport.save();
        console.log('Report created successfully.');
        // console.log(`Report ID: ${newReport._id}`);
        // console.log(result_report);

        res.status(201).json({ message: 'Study and report created successfully', report: newReport });
    } catch (err) {
        console.error('Error occurred:', err.message);
        console.error(err.stack);
        res.status(500).json({ error: 'An error occurred while creating the study and report' });
    }
};





module.exports = {
    createMWLStudy,
    updateStudyStatus,
    uploadStudyToPACS,
    addOneStudyWithReport
};