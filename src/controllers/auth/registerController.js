const {Doctor} = require('../../models/Schemas');
const bcrypt = require('bcrypt');

const createNewDoctorRecord = async (req, res) => {
    const { user, pwd, name } = req.body;
    if (!user || !pwd || !name) return res.status(400).json({ 'message': 'Username, password and Name are required.' });

    // check for duplicate usernames in the db
    const duplicate = await Doctor.findOne({ username: user }).exec();
    if (duplicate) return res.sendStatus(409); //Conflict 

    try {
        //encrypt the password
        const hashedPwd = await bcrypt.hash(pwd, 10);

        //create and store the new user
        const result = await Doctor.create({
            "name":name,
            "username": user,
            "password": hashedPwd
        });

        res.status(201).json({ 'success': `New user ${user} created!` });
    } catch (err) {
        res.status(500).json({ 'message': err.message });
    }
}

module.exports = { createNewDoctorRecord };