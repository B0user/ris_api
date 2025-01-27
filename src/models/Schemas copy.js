const { model, Schema, ObjectId } = require('mongoose');

// const patientSchema = new Schema({
//     iin: {
//         type: String,
//         required: true
//     },
//     firstName: {
//         type: String,
//         required: true
//     },
//     lastName: {
//         type: String,
//         required: true
//     },
//     dateOfBirth: {
//         type: Date,
//         required: true
//     },
//     gender: {
//         type: String,
//         required: true
//     },
//     contactNumber: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true
//     },
//     address: {
//         type: String,
//         required: true
//     }
// });

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    userStatus: {
        type: Boolean,
        default: true
    },
    refreshToken: String
});

const doctorSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    specialization: {
        type: String,
        required: true
    },
    contactNumber: {
        type: String,
        required: true
    }
});

const patientInfoSchema = new Schema({
    iin: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    dob: String
});

const studyInfoSchema = new Schema({
    date: String,
    modality: String,
    body_part: String
});

const medicalRecordSchema = new Schema({
    recordType: String,
    recordData: Schema.Types.Mixed // can store different types of data
});

const questionnaireSchema = new Schema({
    question: String,
    answer: String
});

const reportSchema = new Schema({
    description: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const instanceSchema = new Schema({
    dcm_instance_id: String,
    path: String
})

const seriesSchema = new Schema({
    dcm_series_id: String,
    instances: [instanceSchema]
})

const studySchema = new Schema({
    dcm_study_id: String,
    series: [seriesSchema],
    patient_info: patientInfoSchema,
    study_info: studyInfoSchema,
    med_records: [medicalRecordSchema],
    questionnaire: [questionnaireSchema],
    status: {
        type: String,
        enum: ['new', 'finished'],
        default: 'new'
    },
    report: reportSchema
});

studySchema.pre('save', function(next) {
    if (this.report) {
        this.report.updated_at = Date.now();
    }
    next();
});


const User = model('User', userSchema);
const Study = model('Study', studySchema);
const Doctor = User.discriminator('Doctor', doctorSchema);

module.exports = { Doctor, User, Study};