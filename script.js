
        // Mock backend simulation
        class OTPService {
            constructor() {
                this.otps = new Map();
                this.attempts = new Map();
                this.maxAttempts = 3;
                this.otpExpiry = 5 * 60 * 1000; // 5 minutes
            }

            generateOTP() {
                return Math.floor(100000 + Math.random() * 900000).toString();
            }

            async sendOTP(contact, method) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                const otp = this.generateOTP();
                const key = `${contact}-${method}`;
                
                this.otps.set(key, {
                    code: otp,
                    timestamp: Date.now(),
                    verified: false
                });

                this.attempts.set(key, 0);

                // Simulate sending (in real app, this would call email/SMS service)
                console.log(`OTP sent to ${contact} via ${method}: ${otp}`);
                
                return {
                    success: true,
                    message: `OTP sent successfully via ${method}`
                };
            }

            async verifyOTP(contact, method, inputOtp) {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 800));

                const key = `${contact}-${method}`;
                const storedData = this.otps.get(key);
                const attempts = this.attempts.get(key) || 0;

                if (!storedData) {
                    return { success: false, message: 'OTP not found or expired' };
                }

                if (attempts >= this.maxAttempts) {
                    return { success: false, message: 'Maximum attempts exceeded' };
                }

                if (Date.now() - storedData.timestamp > this.otpExpiry) {
                    this.otps.delete(key);
                    return { success: false, message: 'OTP expired' };
                }

                this.attempts.set(key, attempts + 1);

                if (storedData.code === inputOtp) {
                    storedData.verified = true;
                    return { success: true, message: 'OTP verified successfully' };
                } else {
                    return { 
                        success: false, 
                        message: `Invalid OTP. ${this.maxAttempts - attempts - 1} attempts remaining` 
                    };
                }
            }
        }

        // Initialize service
        const otpService = new OTPService();
        let currentMethod = 'email';
        let currentContact = '';
        let resendTimer;
        let countdown = 60;

        // DOM elements
        const steps = document.querySelectorAll('.step');
        const methodBtns = document.querySelectorAll('.method-btn');
        const contactInput = document.getElementById('contact');
        const contactLabel = document.getElementById('contactLabel');
        const sendOtpBtn = document.getElementById('sendOtpBtn');
        const backBtn = document.getElementById('backBtn');
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        const resendBtn = document.getElementById('resendBtn');
        const otpInputs = document.querySelectorAll('.otp-input');
        const messageDiv = document.getElementById('message');
        const sentToSpan = document.getElementById('sentTo');
        const timerElement = document.getElementById('timer');
        const countdownSpan = document.getElementById('countdown');

        // Method selection
        methodBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                methodBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMethod = btn.dataset.method;
                
                if (currentMethod === 'email') {
                    contactLabel.textContent = 'Email Address';
                    contactInput.type = 'email';
                    contactInput.placeholder = 'Enter your email address';
                } else {
                    contactLabel.textContent = 'Phone Number';
                    contactInput.type = 'tel';
                    contactInput.placeholder = 'Enter your phone number';
                }
            });
        });

        // Send OTP
        sendOtpBtn.addEventListener('click', async () => {
            const contact = contactInput.value.trim();
            
            if (!contact) {
                showMessage('Please enter your contact information', 'error');
                return;
            }

            if (currentMethod === 'email' && !isValidEmail(contact)) {
                showMessage('Please enter a valid email address', 'error');
                return;
            }

            if (currentMethod === 'sms' && !isValidPhone(contact)) {
                showMessage('Please enter a valid phone number', 'error');
                return;
            }

            setLoading(sendOtpBtn, true);
            
            try {
                const result = await otpService.sendOTP(contact, currentMethod);
                
                if (result.success) {
                    currentContact = contact;
                    sentToSpan.textContent = contact;
                    showStep(2);
                    startResendTimer();
                    otpInputs[0].focus();
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (error) {
                showMessage('Failed to send OTP. Please try again.', 'error');
            }
            
            setLoading(sendOtpBtn, false);
        });

        // OTP input handling
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }

                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }

                checkOTPComplete();
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = e.clipboardData.getData('text').replace(/\D/g, '');
                
                if (paste.length === 6) {
                    otpInputs.forEach((inp, i) => {
                        inp.value = paste[i] || '';
                    });
                    checkOTPComplete();
                }
            });
        });

        // Verify OTP
        verifyOtpBtn.addEventListener('click', async () => {
            const otp = Array.from(otpInputs).map(input => input.value).join('');
            
            if (otp.length !== 6) {
                showMessage('Please enter complete OTP', 'error');
                return;
            }

            setLoading(verifyOtpBtn, true);
            
            try {
                const result = await otpService.verifyOTP(currentContact, currentMethod, otp);
                
                if (result.success) {
                    showStep(3);
                } else {
                    showMessage(result.message, 'error');
                    // Clear OTP inputs on error
                    otpInputs.forEach(input => input.value = '');
                    otpInputs[0].focus();
                }
            } catch (error) {
                showMessage('Verification failed. Please try again.', 'error');
            }
            
            setLoading(verifyOtpBtn, false);
        });

        // Back button
        backBtn.addEventListener('click', () => {
            showStep(1);
            clearMessage();
            clearResendTimer();
            otpInputs.forEach(input => input.value = '');
        });

        // Resend OTP
        resendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (resendBtn.classList.contains('disabled')) return;

            setLoading(resendBtn, true);
            
            try {
                const result = await otpService.sendOTP(currentContact, currentMethod);
                
                if (result.success) {
                    showMessage('OTP resent successfully', 'success');
                    startResendTimer();
                    otpInputs.forEach(input => input.value = '');
                    otpInputs[0].focus();
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (error) {
                showMessage('Failed to resend OTP', 'error');
            }
            
            setLoading(resendBtn, false);
        });

        // Utility functions
        function showStep(stepNumber) {
            steps.forEach(step => step.classList.remove('active'));
            document.getElementById(`step${stepNumber}`).classList.add('active');
        }

        function showMessage(message, type) {
            messageDiv.innerHTML = `<div class="${type}">${message}</div>`;
        }

        function clearMessage() {
            messageDiv.innerHTML = '';
        }

        function setLoading(button, loading) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }

        function isValidPhone(phone) {
            return /^[\+]?[1-9][\d]{3,14}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
        }

        function checkOTPComplete() {
            const otp = Array.from(otpInputs).map(input => input.value).join('');
            verifyOtpBtn.disabled = otp.length !== 6;
        }

        function startResendTimer() {
            countdown = 60;
            resendBtn.classList.add('disabled');
            timerElement.style.display = 'block';
            
            resendTimer = setInterval(() => {
                countdown--;
                countdownSpan.textContent = countdown;
                
                if (countdown <= 0) {
                    clearResendTimer();
                    resendBtn.classList.remove('disabled');
                    timerElement.style.display = 'none';
                }
            }, 1000);
        }

        function clearResendTimer() {
            if (resendTimer) {
                clearInterval(resendTimer);
                resendTimer = null;
            }
        }

        // Initialize
        checkOTPComplete();
