const axios = require('axios');

const PACS_SERVER_URL = 'https://html.ris.hippokrat.kz'; // Replace with your PACS server URL
const PACS_AUTH = 'Basic ' + Buffer.from('alice:alicePassword').toString('base64'); // Replace with your PACS credentials

/**
 * Upload a DICOM file to the PACS server.
 * @param {Buffer} dicomData - The binary data of the DICOM file.
 * @returns {Object} - The response from the PACS server.
 */
const uploadDicomToPACS = async (dicomData) => {
    try {
        console.log('Uploading DICOM file to PACS server...');
        const response = await axios.post(`${PACS_SERVER_URL}/instances`, dicomData, {
            headers: {
                'Content-Type': 'application/dicom',
                Authorization: PACS_AUTH,
            },
        });

        if (response.status === 200) {
            console.log('DICOM file uploaded successfully:', response.data);
            return response.data;
        } else {
            throw new Error(`PACS server responded with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Failed to upload DICOM file to PACS:', error.message);
        throw error;
    }
};


module.exports = { uploadDicomToPACS };