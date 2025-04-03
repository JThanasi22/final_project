import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
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

import LoginBanner from '/src/assets/LoginBanner.png';
import './Login.css';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // 🔐 Redirect to dashboard if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true); // Start loading

        try {
            const response = await fetch('/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.token);
                navigate('/dashboard');
            } else {
                alert('Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Something went wrong.');
        } finally {
            setIsLoggingIn(false); // Stop loading
        }
    };

    return (
        <>
            {/* Logging in modal */}
            <MDBModal show={isLoggingIn} setShow={() => {}} staticBackdrop tabIndex='-1'>
                <MDBModalDialog centered>
                    <MDBModalContent>
                        <MDBModalBody className="text-center py-4">
                            <MDBSpinner className="me-2" color="dark" />
                            Logging in...
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
                            </div>

                            <h3
                                className="fw-bold mb-3 pb-3 text-center"
                                style={{ letterSpacing: '1px', fontSize: '1.8rem' }}
                            >
                                ---------------Log in---------------
                            </h3>

                            <form onSubmit={handleSubmit} className="w-100">
                                <MDBInput
                                    wrapperClass="mb-4"
                                    label="Email address"
                                    id="email"
                                    type="email"
                                    size="lg"
                                    onChange={handleChange}
                                    value={formData.email}
                                />
                                <MDBInput
                                    wrapperClass="mb-3"
                                    label="Password"
                                    id="password"
                                    type="password"
                                    size="lg"
                                    onChange={handleChange}
                                    value={formData.password}
                                />

                                <p className="small mb-1 text-end">
                                    <a className="link-info" href="#" style={{ color: '#0077b6', textDecoration: 'none' }}>
                                        Forgot password?
                                    </a>
                                </p>

                                <MDBBtn
                                    type="submit"
                                    className="mb-4 w-100"
                                    color="dark"
                                    size="lg"
                                    disabled={isLoggingIn}
                                    style={{ textTransform: 'none', borderRadius: '25px' }}
                                >
                                    {isLoggingIn ? (
                                        <>
                                            <MDBSpinner size="sm" className="me-2" />
                                            Logging in...
                                        </>
                                    ) : (
                                        'Log in'
                                    )}
                                </MDBBtn>
                            </form>

                            <p className="text-center">
                                Don't have an account?{' '}
                                <a href="/signup" className="link-info" style={{ textDecoration: 'none', fontWeight: 'normal' }}>
                                    Sign up
                                </a>
                            </p>
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
