import { Router } from 'express';
import { signup, login, verifyOtp, forgotPassword, resetPassword, validatePasswordStrength } from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/password-strength', validatePasswordStrength);

export default router;
