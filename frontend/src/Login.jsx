import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginBanner from './assets/LoginBanner.png';
import {
    MDBBtn,
    MDBContainer,
    MDBRow,
    MDBCol,
    MDBInput,
    MDBSpinner,
    MDBModal,
    MDBModalDialog,
    MDBModalContent,
    MDBModalBody
} from 'mdb-react-ui-kit';
import './Login.css';
import { v4 as uuidv4 } from 'uuid';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [code, setCode] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [awaitingCode, setAwaitingCode] = useState(false);
    const [disabledInputs, setDisabledInputs] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [rememberDevice, setRememberDevice] = useState(false);

    const [deviceId, setDeviceId] = useState(() => {
        let id = localStorage.getItem("deviceId");
        if (!id) {
            id = uuidv4();
            localStorage.setItem("deviceId", id);
        }
        return id;
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, []);

    useEffect(() => {
        let interval;
        if (awaitingCode && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer <= 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [awaitingCode, resendTimer]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);

        try {
            const response = await fetch("http://localhost:8080/api/users/login", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, deviceId })
            });

            if (response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const data = await response.json();
                    const token = data.token;

                    localStorage.setItem("token", token);
                    const decoded = jwtDecode(token);
                    const role = decoded.role;

                    if (role === 'a') navigate('/Admindashboard');
                    else if (role === 'c') navigate('/dashboard');
                    else if (role === 'm') navigate('/manager_dashboard');
                    else if (role === 'p') navigate('/photograph_dashboard');
                    else if (role === 's') navigate('/salesman_dashboard');
                    else if (role === 'e') navigate('/editor_dashboard');
                    return;
                } else {
                    // No token yet: start 2FA
                    alert("2FA code sent to your email");
                    setAwaitingCode(true);
                    setDisabledInputs(true);
                    setResendTimer(60);
                    setCanResend(false);
                }
            } else {
                alert('Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Something went wrong.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleVerifyCode = async () => {
        setIsVerifying(true);
        try {
            const response = await fetch("http://localhost:8080/api/users/verify-2fa", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, code, deviceId, remember: rememberDevice })
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.token;

                localStorage.setItem('token', token);
                if (rememberDevice) {
                    localStorage.setItem("remember_2fa", "true");
                }

                const decoded = jwtDecode(token);
                const role = decoded.role;

                if (role === 'a') navigate('/Admindashboard');
                else if (role === 'c') navigate('/dashboard');
                else if (role === 'm') navigate('/manager_dashboard');
                else if (role === 'p') navigate('/photograph_dashboard');
                else if (role === 's') navigate('/salesman_dashboard');
                else if (role === 'e') navigate('/editor_dashboard');
            } else {
                alert('Invalid or expired code');
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert('Something went wrong.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendCode = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/users/login", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, deviceId })
            });

            if (response.ok) {
                alert("New 2FA code sent.");
                setResendTimer(60);
                setCanResend(false);
            } else {
                alert("Couldn't resend code. Try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Error resending code.");
        }
    };

    const handleForgotPasswordClick = () => {
        navigate('/forget-pass');
    };

    return (
        <>
            <MDBModal show={isLoggingIn || isVerifying} setShow={() => {}} staticBackdrop tabIndex='-1'>
                <MDBModalDialog centered>
                    <MDBModalContent>
                        <MDBModalBody className="text-center py-4">
                            <MDBSpinner className="me-2" color="dark" />
                            {isVerifying ? 'Verifying...' : 'Processing...'}
                        </MDBModalBody>
                    </MDBModalContent>
                </MDBModalDialog>
            </MDBModal>

            <MDBContainer fluid>
                <MDBRow>
                    <MDBCol sm="6" className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
                        <div className="w-75">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold mb-3" style={{ fontSize: '2.7rem', color: '#161819' }}>
                                    Your Studio, Your Vision
                                </h2>
                                <p className="lead" style={{ color: '#161819', fontSize: '1.1rem' }}>
                                    Simplify Studio Management, Workflow and Clients.
                                </p>

                                <h3 className="fw-bold mb-3 pb-3 custom-heading" style={{ letterSpacing: '5px' }}>Log in</h3>

                                <form onSubmit={handleSubmit} className="w-100">
                                    <MDBInput
                                        wrapperClass="mb-4"
                                        label="Email address"
                                        id="email"
                                        type="email"
                                        size="lg"
                                        onChange={handleChange}
                                        value={formData.email}
                                        disabled={disabledInputs}
                                    />
                                    <MDBInput
                                        wrapperClass="mb-3"
                                        label="Password"
                                        id="password"
                                        type="password"
                                        size="lg"
                                        onChange={handleChange}
                                        value={formData.password}
                                        disabled={disabledInputs}
                                    />

                                    {!awaitingCode && (
                                        <>
                                            <p className="small mb-1 text-end">
                                                <span
                                                    onClick={handleForgotPasswordClick}
                                                    className="link-info"
                                                    style={{ color: '#0077b6', textDecoration: 'none', cursor: 'pointer' }}
                                                >
                                                    Forgot password?
                                                </span>
                                            </p>

                                            <MDBBtn
                                                type="submit"
                                                className="mb-4 w-100"
                                                color="dark"
                                                size="lg"
                                                disabled={isLoggingIn}
                                                style={{ textTransform: 'none', borderRadius: '25px' }}
                                            >
                                                {isLoggingIn ? <><MDBSpinner size="sm" className="me-2" />Logging in...</> : 'Log in'}
                                            </MDBBtn>
                                        </>
                                    )}
                                </form>

                                {awaitingCode && (
                                    <>
                                        <MDBInput
                                            wrapperClass="mb-3"
                                            label="Enter 2FA Code"
                                            id="code"
                                            color="dark"
                                            type="text"
                                            size="lg"
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                        />
                                        <MDBBtn
                                            onClick={handleVerifyCode}
                                            className="mb-3 w-100"
                                            color="success"
                                            size="lg"
                                            disabled={isVerifying}
                                            style={{ textTransform: 'none', borderRadius: '25px' }}
                                        >
                                            {isVerifying ? <><MDBSpinner size="sm" className="me-2" />Verifying...</> : 'Verify Code'}
                                        </MDBBtn>

                                        <MDBBtn
                                            outline
                                            color="dark"
                                            size="sm"
                                            className="w-100"
                                            disabled={!canResend}
                                            onClick={handleResendCode}
                                        >
                                            {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                                        </MDBBtn>
                                    </>
                                )}

                                <p className="text-center mt-3">
                                    Don't have an account?{' '}
                                    <a href="/signup" className="link-info" style={{ textDecoration: 'none', fontWeight: 'normal' }}>
                                        Sign up
                                    </a>
                                </p>
                            </div>
                        </div>
                    </MDBCol>

                    <MDBCol sm="6" className="d-none d-sm-block px-0">
                        <img
                            src={LoginBanner}
                            alt="Login visual"
                            className="w-100"
                            style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                    </MDBCol>
                </MDBRow>
            </MDBContainer>
        </>
    );
}

export default Login;
