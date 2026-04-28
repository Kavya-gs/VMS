import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Too many login attempts, please try again later."
    }
})

export const otpRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Too many OTP verification attempts, please try again later."
    }
})

export const forgotPasswordRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Too many password reset attempts, Try later."
    }
})

export const registerRateLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many registration attempts, Try later."
    }
})