// frontend/src/ForgetPass.jsx
import React, { useState } from "react";

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
                setStatus("Reset link sent! Check your inbox.");
            } else {
                setStatus("Could not send reset link.");
            }
        } catch (err) {
            console.error(err);
            setStatus("An error occurred.");
        }
    };

    return (
        <div className="container">
            <h2>Forgot Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit">Send Reset Link</button>
            </form>
            <p>{status}</p>
        </div>
    );
};

export default ForgetPass;
