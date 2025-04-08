import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ConfirmReset = () => {
    const token = new URLSearchParams(window.location.search).get("token");
    const [status, setStatus] = useState("Confirming...");
    const navigate = useNavigate();

    useEffect(() => {
        const confirm = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/users/confirm-reset", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                if (res.ok) {
                    setStatus("Confirmed! Redirecting...");
                    setTimeout(() => {
                        navigate(`/reset-password?token=${token}`);
                    }, 2000);
                } else {
                    const err = await res.text();
                    setStatus("Failed to confirm token: " + err);
                }
            } catch (err) {
                setStatus("An error occurred.");
            }
        };

        if (token) confirm();
        else setStatus("No token found.");
    }, [token, navigate]);

    return <div>{status}</div>;
};

export default ConfirmReset;
