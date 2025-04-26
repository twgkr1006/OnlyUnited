const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/login', login)

router.get('/me', authMiddleware, (req, res) => {
    res.json({
        message: 'Token Authentication Successful. ',
        user: req.user,
    });
});

module.exports = router;