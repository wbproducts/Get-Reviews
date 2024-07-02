const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mailchimp = require('@mailchimp/mailchimp_marketing');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

app.use(cors());
app.use(bodyParser.json());

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX
});

const listId = process.env.MAILCHIMP_LIST_ID;

app.post('/submit-review', async (req, res) => {
  const { firstName, lastName, email, review, rating } = req.body;

  console.log('Received review submission:', { firstName, lastName, email, review, rating });

  if (!firstName || !lastName || !email || !review || !rating) {
    console.error('Bad Request: Missing required fields');
    return res.status(400).send('Bad Request: Missing required fields');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: 'Your Coupon Code',
    text: 'Thank you for your review! Here is your coupon code: ABC123'
  };

  try {
    console.log('Sending email...');
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    console.log('Adding subscriber to Mailchimp list...');
    await mailchimp.lists.addListMember(listId, {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName
      }
    });
    console.log('Subscriber added to Mailchimp list');

    res.status(200).send('Review submitted successfully');
  } catch (error) {
    if (error.response && error.response.body) {
      console.error('Mailchimp API Error:', error.response.body.detail);
    } else {
      console.error('Error during review submission:', error.message);
    }
    res.status(500).send('Error submitting review');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
