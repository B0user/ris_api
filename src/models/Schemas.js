const { model, Schema, ObjectId } = require('mongoose');

// Sub-schemas for reuse
const sub_sub_PACSTreeSchema = new Schema({
    study_instance_uid: { type: String, required: true },
    series: [
        {
            series_instance_uid: { type: String, required: true },
            instances: [{ type: String, required: true }],
        },
    ],
});

const sub_MedicalRecordSchema = new Schema({
    recordType: { type: String, required: true },
    recordData: Schema.Types.Mixed, // Can store various types of data (e.g., JSON, Strings)
});

const sub_QuestionnaireSchema = new Schema({
    question: { type: String, required: true },
    answer: { type: String },
});

const sub_PatientSchema = new Schema({
    iin: { type: String },
    fullname: { type: String },
    gender: { type: String, enum: ['male', 'female', 'other']},
    dob: { type: Date },
    contact_info: {
        phone: { type: String },
        email: { type: String },
    },
    address: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const image_StudySchema = new Schema({
    study_date: { type: Date, required: true },
    modality: { type: String, required: true },
    body_part: { type: String }, // or parts ???
    pacs_tree: sub_sub_PACSTreeSchema,
    status: { type: String, enum: ['new', 'finished'], default: 'new' }, // for MWL in the future
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});


// Main Schemas
const ReportSchema = new Schema({
    important_information: {
        patient: sub_PatientSchema,
        med_records: [sub_MedicalRecordSchema],
        questionnaire: [sub_QuestionnaireSchema],
    },
    study: image_StudySchema,
    description: {
        text: { type: String, default: null},
        doctor_information: {
            // id: { type: ObjectId, ref: 'Doctor'},
            fullname: { type: String, default: null },
        },
        // For possible future text-editor functionality
        templates_used: [String],
        attachments: [
            {
                file_name: { type: String },
                file_url: { type: String },
            },
        ],
    },

    status: { type: String, enum: ['N/A', 'draft', 'finalized', 'QA'], default: 'N/A' },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

const instanceSchema = new Schema({
    dcm_instance_id: String,
    path: String,
});

const seriesSchema = new Schema({
    dcm_series_id: String,
    instances: [instanceSchema],
});

const StudySchema = new Schema({
    dcm_study_id: { type: String, required: true, unique: true },
    modality: { type: String, required: true },
    patient_info: {
        name: String,
        id: String,
        birthDate: Date,
        gender: String,
    },
    study_info: {
        description: String,
        date: Date,
        time: String,
        referringPhysician: String,
    },
    series: [seriesSchema],
    mwl_status: { type: String, enum: ['MWL_PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'MWL_PENDING' },
    pacs_target: { type: String }, // Which PACS this study is routed to
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

// User and Doctor Schemas
const UserSchema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    userStatus: { type: Boolean, default: true },

    doctor_information: {
        fullname: { type: String, required: true },
        specialization: { type: String },
        contactNumber: { type: String },
    },

    refreshToken: String,
});


// Models
const Report = model('Report', ReportSchema);
const User = model('User', UserSchema);
const Study = model('Study', StudySchema);

module.exports = { Report, User, Study };
