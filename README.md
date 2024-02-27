# Gmail Inbox Management with ChatGPT

This Express App is designed to monitor your Gmail inbox for incoming emails, analyze their content, and automatically respond to them using OpenAI's ChatGPT language model.

## Features
- **Email Monitoring:**  The app will receive notification upon receiving new emails into your GMAIL Inbox.
- **Email Analysis:**  Upon receiving an email, the app analyzes its content to understand the context and intent.
- **Auto-Response:** Based on the analysis, the app generates a response using ChatGPT to reply to the sender.
- **Calendly:** You can add your [Calendly Event](https://calendly.com/) link to add into reply of positive mails to create meeting with sender.

## Installation

**Prerequisites**
Before running your Express app, ensure you have the following prerequisites set up:

1. **Google Cloud Platform (GCP)**: Create a project on Google Cloud Platform and set it as the default project for your environment.
2. **Node.js and npm**: Install Node.js and npm on your system. You can download and install them from the official [Node.js](https://nodejs.org/en) website.
3. **Ngrok**: Install Ngrok to create a secure tunnel to expose your local server to the internet. You can download Ngrok from the official [Ngrok](https://ngrok.com/) website.
4. **Calendly**: (Optional) Create [Calendly Event](https://calendly.com/), If you want to create appointment meeting with senders.

**Development**

1. Start ngrok Tunneling
    - Ngrok is a tool that creates a secure tunnel to your localhost environment. Run ngrok to expose port 3000 of your local server to the internet.

    ```
        ngrok http 3000
    ```
    
2. Clone Repo
    - Clone this repo and create new file named **`.env`**
    ```
        git clone https://github.com/makzz09/gmail-management.git
    ```

3. Enable Gmail API and Pub/Sub
    - In the Google Cloud Console, enable the Gmail API and Pub/Sub API for your project.
    - Create Topic for PUB/SUB, add Topic name into .env file ex. `projects/<your_project_id>/topics/<your_topic_name>`
    - Create New Subscription for topic with Delivery type as `Push`.
    - Add Endpoint URL as `https://<your_ngrok_app_url>/notification`
    - Now Go to Topic that we've created add new Principle Rule with role of `Pub/Sub Publisher` for principle `gmail-api-push@system.gserviceaccount.com`.

4. Create OAuth 2.0 Client
    - In the Google Cloud Console, create an OAuth 2.0 Client available under API and Service > Credentials.
    - Create new Web Application and add redirect URI as `https://<your_ngrok_app_url>/auth/callback`.
    - Update Client_id, Client_secret and Redirect_uri in .env file.

5. Start Express App
    - Before starting app make sure to add all variables to **`.env`** file that are available in `.env.example`.
    
    ```
        npm install
        npm start
    ```
