const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/UserModel');
require('dotenv').config();

const signup = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        // Generate confirmation token
        const confirmationToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Send confirmation email
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Account Confirmation',
            text: `Thank you for signing up! Please confirm your account by clicking the following link: ${process.env.BASE_URL}/confirm/${confirmationToken}`,
            html: `<p>Thank you for signing up! Please confirm your account by clicking the following link: <a href="${process.env.BASE_URL}/confirm/${confirmationToken}">Confirm Account</a></p>`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Confirmation email sent successfully');

        res.status(201).json({ message: 'User registered successfully. Please check your email for confirmation.' });
    } catch (error) {
        console.error('Error during signup:', error.message);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Generated token:', token); // Log token for debugging
        res.json({ token });
    } catch (error) {
        console.error('Error during login:', error.message);
        res.status(500).json({ error: 'Failed to login' });
    }
};

const confirmAccount = async (req, res) => {
    const { token } = req.params;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        // Update user to mark as confirmed
        user.isConfirmed = true;
        await user.save();

        res.status(200).json({ message: 'Account confirmed successfully' });
    } catch (error) {
        console.error('Error confirming account:', error.message);
        res.status(500).json({ error: 'Failed to confirm account' });
    }
};

const getProfile = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {   
        console.error('Error fetching profile:', error.message);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

module.exports = { signup, login, confirmAccount, getProfile };
