import React, { useEffect, useState } from "react";

const LINKEDIN_CLIENT_ID = "86pqid7d2v8yh1";

function Login() {
    const [userData, setUserData] = useState({});
    const [accessToken, setAccessToken] = useState(localStorage.getItem("linkedInAccessToken") || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const codeParam = urlParams.get("code");

        if (codeParam && !accessToken) {
            const getAccessToken = async () => {
                setLoading(true);
                try {
                    const response = await fetch(`http://localhost:4000/linkedin/getAccessToken?code=${codeParam}`, {
                        method: "GET"
                    });
                    const data = await response.json();

                    if (data.access_token) {
                        localStorage.setItem("linkedInAccessToken", data.access_token);
                        setAccessToken(data.access_token);
                        window.history.replaceState({}, document.title, "/");
                    } else {
                        setError("Error fetching access token: " + JSON.stringify(data));
                    }
                } catch (error) {
                    setError("Error fetching access token: " + error.message);
                } finally {
                    setLoading(false);
                }
            };
            getAccessToken();
        }
    }, [accessToken]);

    const getUserData = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const response = await fetch("http://localhost:4000/linkedin/getUserData", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            });
            const data = await response.json();
            setUserData(data);
        } catch (error) {
            setError("Error fetching user data: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loginWithLinkedIn = () => {
        const redirectUri = "http://localhost:3000"; 
        const scope = "openid profile email";
        const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        window.location.href = authUrl;
    };

    const logout = () => {
        localStorage.removeItem("linkedInAccessToken");
        setAccessToken("");
        setUserData({});
    };

    return (
        <div>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {loading ? (
                <p>Loading...</p>
            ) : accessToken ? (
                <>
                    <h1>We have the access token</h1>
                    <button onClick={logout}>Log out</button>
                    <h3>Get User Data from LinkedIn API</h3>
                    <button onClick={getUserData}>Get Data</button>
                    {userData.localizedFirstName && userData.localizedLastName && (
                        <h4>Hey there, {userData.localizedFirstName} {userData.localizedLastName}</h4>
                    )}
                </>
            ) : (
                <>
                    <h3>User is not logged in</h3>
                    <button onClick={loginWithLinkedIn}>Login with LinkedIn</button>
                </>
            )}
        </div>
    );
}

export default Login;
