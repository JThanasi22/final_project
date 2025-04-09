import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    MDBModal,
    MDBModalDialog,
    MDBModalContent,
    MDBModalBody,
    MDBBtn, MDBRow, MDBCol, MDBInput, MDBContainer,
} from "mdb-react-ui-kit";
import LoginBanner from "./assets/LoginBanner.png";

const ResetPassword = () => {
    const [email, setEmail] = useState(() =>
        new URLSearchParams(window.location.search).get("email") || ""
    );
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [status, setStatus] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [codeVerified, setCodeVerified] = useState(false);
    const navigate = useNavigate();

    const handleVerifyCode = async () => {
        setStatus("Verifying code...");
        try {
            const res = await fetch("http://localhost:8080/api/users/verify-reset-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            if (res.ok) {
                setCodeVerified(true);
                setStatus("Code verified. You can now set a new password.");
            } else {
                const error = await res.text();
                setStatus("Invalid or expired code: " + error);
            }
        } catch (err) {
            console.error(err);
            setStatus("Something went wrong while verifying code.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Submitting new password...");

        try {
            const res = await fetch("http://localhost:8080/api/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code, newPassword }),
            });

            if (res.ok) {
                setStatus("Password reset successful. You will be redirected shortly.");
                setModalOpen(true);

                setTimeout(() => {
                    navigate("/login");
                }, 2000);
            } else {
                const error = await res.text();
                setStatus("Failed: " + error);
            }
        } catch (err) {
            console.error(err);
            setStatus("Something went wrong.");
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

                            <h3 className="fw-bold mb-3 pb-3 custom-heading" style={{ letterSpacing: '5px' }}>Reset Password</h3>

                            <form onSubmit={codeVerified ? handleSubmit : (e) => e.preventDefault()} className="w-100">
                                <MDBInput
                                    wrapperClass="mb-3"
                                    label="Reset Code"
                                    type="text"
                                    size="lg"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                />
                                {!codeVerified && (
                                    <MDBBtn
                                        type="button"
                                        className="mb-4 w-100"
                                        color="dark"
                                        size="lg"
                                        onClick={handleVerifyCode}
                                        style={{ textTransform: 'none', borderRadius: '25px' }}
                                    >
                                        Verify Code
                                    </MDBBtn>
                                )}

                                {codeVerified && (
                                    <>
                                        <MDBInput
                                            wrapperClass="mb-4"
                                            label="New Password"
                                            type="password"
                                            size="lg"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <MDBBtn
                                            type="submit"
                                            className="mb-4 w-100"
                                            color="dark"
                                            size="lg"
                                            style={{ textTransform: 'none', borderRadius: '25px' }}
                                        >
                                            Reset Pass
                                        </MDBBtn>
                                    </>
                                )}
                            </form>

                            <p className="text-center">{status}</p>
                        </div>

                        <MDBModal show={modalOpen} setShow={setModalOpen} tabIndex="-1">
                            <MDBModalDialog centered>
                                <MDBModalContent>
                                    <MDBModalBody className="text-center py-4">
                                        ✅ Password successfully reset!
                                    </MDBModalBody>
                                </MDBModalContent>
                            </MDBModalDialog>
                        </MDBModal>
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

export default ResetPassword;
