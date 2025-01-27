const axios = require('axios');
const { Report } = require('../models/Schemas');


const createReport = async ({ patient_info, study_info, pacs_tree }) => {
    try {
        console.log('Creating report with the following data:');
        console.log(`Patient Info: ${JSON.stringify(patient_info)}`);
        console.log(`Study Info: ${JSON.stringify(study_info)}`);
        console.log(`PACS Tree: ${JSON.stringify(pacs_tree)}`);

        // Parse questionnaire if it's a string
        if (typeof patient_info.questionnaire === 'string') {
            try {
                patient_info.questionnaire = JSON.parse(patient_info.questionnaire);
                console.log('Parsed questionnaire:', patient_info.questionnaire);
            } catch (error) {
                console.error('Failed to parse questionnaire:', error.message);
                throw new Error('Invalid JSON in questionnaire');
            }
        }

        const newReport = new Report({
            important_information: {
                patient: patient_info,
                med_records: [], // Initialize as empty, can be updated later
                questionnaire: patient_info.questionnaire || [], // Default to an empty array
            },
            study: {
                study_date: study_info.date,
                modality: study_info.modality,
                pacs_tree,
            },
            description: {
                text: null, // Placeholder for doctor notes
                doctor_information: null, // Placeholder for doctor assignment
                templates_used: [],
                attachments: [],
            },
            status: 'N/A',
        });

        await newReport.save();
        console.log('Report created successfully:', newReport);
    } catch (error) {
        console.error('Failed to create report:', error.message);
        throw new Error('Report creation failed');
    }
};



const getAllReports = async (req, res) => {
    try {
        const reports = await Report.find();
        res.status(200).json(reports);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while retrieving reports' });
    }
};

const getOneReport = async (req, res) => {
    const { id } = req.params;

    try {
        const report = await Report.findById(id);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ error: 'An error occurred while retrieving the Report' });
    }
};

const updateOneReport = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const report = await Report.findByIdAndUpdate(id, updates, { new: true });

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.status(200).json(report);
    } catch (err) {
        // console.error(err);
        res.status(500).json({ error: 'An error occurred while updating the Report' });
    }
};

const deleteOneReport = async (req, res) => {
    const { id } = req.params;

    try {
        const report = await Report.findByIdAndDelete(id);

        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.status(200).json(report);

    } catch (err) {
        // console.error(err);
        res.status(500).json({ error: 'An error occurred while deleting the Report' });
    }
}

module.exports = {
    createReport,
    getAllReports,
    updateOneReport,
    getOneReport,
    deleteOneReport
};
