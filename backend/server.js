const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const LINKEDIN_CLIENT_ID = "86pqid7d2v8yh1"; 
const LINKEDIN_CLIENT_SECRET = "WPL_AP1.NC1D8hDfyoIyJ2Uq.h6LcLQ=="; 
const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get("/linkedin/getAccessToken", async (req, res) => {
    try {
        const code = req.query.code;
        console.log("LinkedIn Authorization Code:", code);

        const params = new URLSearchParams({
            grant_type: "authorization_code",
            code: code,
            redirect_uri: "http://localhost:3000", 
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET,
        });

        const response = await fetch(`https://www.linkedin.com/oauth/v2/accessToken`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params,
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error fetching LinkedIn access token:", errorData);
            return res.status(response.status).json({ 
                error: "Failed to fetch access token", 
                details: errorData,
             });
        }

        const data = await response.json();
        console.log("LinkedIn Access Token Data:", data);
        res.json(data);
    } catch (error) {
        console.error("Error in /linkedin/getAccessToken:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.get("/linkedin/getUserData", async (req, res) => {
    try {
        const accessToken = req.get("Authorization").replace("Bearer ", "");

        const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        if (!profileResponse.ok) {
            const errorData = await profileResponse.json();
            console.error("Error fetching LinkedIn user data:", errorData);
            return res.status(profileResponse.status).json({ error: "Failed to fetch user data", details: errorData });
        }

        const profileData = await profileResponse.json();
        console.log("LinkedIn User Data:", profileData);
        
        const emailResponse = await fetch("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });

        if (!emailResponse.ok) {
            const errorData = await emailResponse.json();
            console.error("Error fetching LinkedIn user email:", errorData);
            return res.status(emailResponse.status).json({ error: "Failed to fetch user email", details: errorData });
        }

        const emailData = await emailResponse.json();
        console.log("LinkedIn User Email Data:", emailData);

        // Combine data if needed
        res.json({ profile: profileData, email: emailData.elements[0]["handle~"].emailAddress });

    } catch (error) {
        console.error("Error in /linkedin/getUserData:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(4000, function () {
    console.log("Server running on port 4000");
});
