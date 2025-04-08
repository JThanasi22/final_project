import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState("");
    const [status, setStatus] = useState("");
    const token = new URLSearchParams(window.location.search).get("token");

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Submitting...");

        try {
            const res = await fetch("http://localhost:8080/api/users/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });

            if (res.ok) {
                setStatus("Password successfully reset. You may now log in.");
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
        <div>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <button type="submit">Reset Password</button>
            </form>

            <p>{status}</p>

            {/* 🚀 Back to login button */}
            <button onClick={() => navigate("/login")} style={{ marginTop: "1rem" }}>
                Go to Login
            </button>
        </div>
    );
};

export default ResetPassword;
