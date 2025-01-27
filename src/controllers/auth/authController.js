const { User } = require('../../models/Schemas');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const handleLogin = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });

    const foundUser = await User.findOne({ username: user }).exec();
    if (!foundUser) return res.sendStatus(401); //Unauthorized 
    // evaluate password 
    const match = await bcrypt.compare(pwd, foundUser.password);
    if (match) {
        // create JWTs
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "username": foundUser.username,
                    "fullname": foundUser.name
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '10m' }
        );
        const refreshToken = jwt.sign(
            { "username": foundUser.username, "fullname": foundUser.name },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '10d' }
        );
        // Saving refreshToken with current user
        foundUser.refreshToken = refreshToken;
        await foundUser.save();

        // Creates Secure Cookie with refresh token
        res.cookie('jwt', refreshToken, { httpOnly: true, secure: true, sameSite: true, maxAge: 24 * 60 * 60 * 1000 });
        // Send authorization roles and access token to user
        res.json({accessToken });

    } else {
        res.sendStatus(401);
    }
}

module.exports = { handleLogin };