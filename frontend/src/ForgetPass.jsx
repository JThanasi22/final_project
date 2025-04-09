// frontend/src/ForgetPass.jsx
import React, { useState } from "react";
import {MDBBtn, MDBCol, MDBContainer, MDBInput, MDBRow, MDBSpinner} from "mdb-react-ui-kit";
import LoginBanner from "./assets/LoginBanner.png";

const ForgetPass = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");


    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Sending...");

        try {
            const res = await fetch("http://localhost:8080/api/users/request-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (res.ok) {
                setStatus("Reset link sent! Check your inbox. You may now close this page.");
            } else {
                setStatus("Could not send reset link.");
            }
        } catch (err) {
            console.error(err);
            setStatus("An error occurred.");
        }
    };

    return (
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

                            <h3 className="fw-bold mb-3 pb-3 custom-heading" style={{ letterSpacing: '5px' }}>Forgot Password</h3>


                            <form onSubmit={handleSubmit} className="w-100">
                                <MDBInput
                                    wrapperClass="mb-4"
                                    label="Email address"
                                    type="email"
                                    size="lg"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required

                                />
                                <MDBBtn
                                    type="submit"
                                    className="mb-4 w-100"
                                    color="dark"
                                    size="lg"
                                    style={{ textTransform: 'none', borderRadius: '25px' }}>
                                    Send Reset Link
                                </MDBBtn>
                            </form>

                            <p className="text-center">{status}</p>
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
    );



};

export default ForgetPass;
