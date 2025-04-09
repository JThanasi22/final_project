import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MDBBtn,
    MDBCol,
    MDBContainer, MDBInput,
    MDBModal,
    MDBModalBody,
    MDBModalContent,
    MDBModalDialog,
    MDBRow,
    MDBSpinner
} from "mdb-react-ui-kit";
import LoginBanner from "./assets/LoginBanner.png";

const UserSettings = () => {
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({});
    const [status, setStatus] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            try {
                const res = await fetch("http://localhost:8080/api/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                    setFormData(data);
                } else {
                    setStatus("Failed to fetch user data.");
                }
            } catch (err) {
                console.error(err);
                setStatus("An error occurred.");
            }
        };

        fetchUserData();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            const res = await fetch("http://localhost:8080/api/users/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setStatus("✅ User information updated successfully.");
                setModalOpen(true);

                setTimeout(() => {
                    const role = userData.role;
                    if (role === 'a') navigate('/Admindashboard');
                    else if (role === 'c') navigate('/dashboard');
                    else if (role === 'p') navigate('/photograph_dashboard');
                    else if (role === 's') navigate('/salesman_dashboard');
                    else if (role === 'e') navigate('/editor_dashboard');
                    else navigate('/dashboard');
                }, 2000);

            } else {
                setStatus("❌ Failed to update user information.");
            }
        } catch (err) {
            console.error(err);
            setStatus("⚠️ An error occurred while updating.");
        }
    };

    if (!userData) return <div style={{ padding: '25px' }}>Loading user data...</div>;

    return (
        <>
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

                                <h3 className="fw-bold mb-3 pb-3 custom-heading" style={{ letterSpacing: '5px' }}>User Settings</h3>

                                <form onSubmit={handleSubmit} className="w-100">
                                    <MDBInput
                                        type="text"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        wrapperClass="mb-4"
                                        size="lg"
                                    />
                                    <MDBInput
                                        type="text"
                                        name="surname"
                                        value={formData.surname || ''}
                                        onChange={handleChange}
                                        wrapperClass="mb-3"
                                        size="lg"
                                    />
                                    <MDBInput
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        wrapperClass="mb-3"
                                        size="lg"
                                        disabled={true}
                                    />
                                    <MDBInput
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phone || ''}
                                        onChange={handleChange}
                                        wrapperClass="mb-3"
                                        size="lg"
                                    />

                                    <MDBBtn
                                        type="submit"
                                        className="mb-4 w-100"
                                        color="dark"
                                        size="lg"
                                        style={{ textTransform: 'none', borderRadius: '25px' }}
                                    >
                                        Save
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

            <MDBModal show={modalOpen} setShow={setModalOpen} tabIndex='-1'>
                <MDBModalDialog centered>
                    <MDBModalContent>
                        <MDBModalBody className="text-center py-4">
                            Your settings were saved! Redirecting
                        </MDBModalBody>
                    </MDBModalContent>
                </MDBModalDialog>
            </MDBModal>
        </>
    );
};

export default UserSettings;
