import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MDBBtn,
    MDBCol,
    MDBContainer,
    MDBInput,
    MDBModal,
    MDBModalBody,
    MDBModalContent,
    MDBModalDialog,
    MDBRow
} from "mdb-react-ui-kit";
import Layout from './components/Layout';
import './dash.css';

const UserSettings = () => {
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({});
    const [status, setStatus] = useState("");
    const [calendarStatus, setCalendarStatus] = useState("");
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

        // ✅ Check for Google Calendar connection success
        const params = new URLSearchParams(window.location.search);
        if (params.get("calendar") === "success") {
            setCalendarStatus("✅ Google Calendar connected successfully.");
        }
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

    const handleConnectGoogle = () => {
        window.location.href = "http://localhost:8080/google/auth";
    };

    if (!userData) return <Layout><div style={{ padding: '25px' }}>Loading user data...</div></Layout>;

    return (
        <Layout>
            <MDBContainer fluid className="settings-container">
                <MDBRow>
                    <MDBCol sm="12" className="d-flex align-items-center justify-content-center">
                        <div className="w-75">
                            <div className="text-center mb-4">
                                <h3 className="fw-bold mb-3 pb-3 custom-heading">User Settings</h3>

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

                                {/* ✅ Google Calendar Connect Button */}
                                <MDBBtn
                                    className="w-100 mb-2"
                                    color="info"
                                    size="lg"
                                    style={{ textTransform: 'none', borderRadius: '25px' }}
                                    onClick={handleConnectGoogle}
                                >
                                    Connect to Google Calendar
                                </MDBBtn>

                                {/* ✅ Calendar connection success message */}
                                {calendarStatus && (
                                    <p className="text-success text-center mt-2">{calendarStatus}</p>
                                )}

                                {/* Save status */}
                                <p className="text-center">{status}</p>
                            </div>
                        </div>
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
        </Layout>
    );
};

export default UserSettings;
