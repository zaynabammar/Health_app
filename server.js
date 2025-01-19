const User = require('./models/User');
const DiaryEntry = require('./models/DiaryEntry');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const nodemailer = require('nodemailer');

// Connexion à MongoDB local
mongoose.connect('mongodb://localhost:27017/health_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

const users = []; 
const diary_entry = [];

// Sign Up
app.post('/api/register', async (req, res) => {
  const { user_id, name, email, age, password } = req.body;

  try {
    const existingUser = await User.findOne({email});
    if (existingUser) {
      return res.status(400).json({ message: 'user already exist' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 

    const newUser = new User({
      user_id,
      name,
      email,
      age,
      password: hashedPassword,
    });
 
    await newUser.save();

    res.status(201).json({ message: 'user added', user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Sign In 
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
  
   
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
     
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      res.status(200).json({
        message: 'Login successful',
        token: token,
      });
    });


    app.put('/api/user/:user_id', async (req, res) => {
      try {
        const { user_id } = req.params; 
        const { email, password } = req.body; 
    
        if (!email && !password) {
          return res.status(400).json({ message: 'Please provide email or password to update.' });
        }
    
        const updateFields = {};
        if (email) {
          updateFields.email = email;
        }
        if (password) {
          const hashedPassword = await bcrypt.hash(password, 10); 
          updateFields.password = hashedPassword;
        }
    
        const updatedUser = await User.findByIdAndUpdate(user_id, updateFields, { new: true });
    
        if (!updatedUser) {
          return res.status(404).json({ message: 'User not found.' });
        }
    
        res.status(200).json({
          message: 'User information updated successfully.',
          user: updatedUser,
        });
      } catch (error) {
        console.error('Error updating user information:', error);
        res.status(500).json({ message: 'An error occurred while updating user information.', error: error.message });
      }
    });  
  

  // Log Out 
  app.post('/api//logout', (req, res) => {
   
    res.status(200).json({ message: 'Logged out successfully' });
  });
  
 
  const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied, token missing!' });
    }
  
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token!' });
      }
  
      req.user = decoded;  
      next();
    });
  };

  //Request a password reset

 /* 
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Ton adresse email
    pass: process.env.EMAIL_PASS, // Ton mot de passe d'application ou mot de passe normal
  },
  tls: {
    rejectUnauthorized: false, // Permet d'accepter certains certificats (utilisé si nécessaire)
  },
});

// Exemple d'email à envoyer
const mailOptions = {
  from: process.env.EMAIL_USER, // Ton email
  to: 'test@gmail.com', // Email du destinataire
  subject: 'Test Nodemailer',
  text: 'Ceci est un test d\'envoi d\'email.',
};

// Envoie de l'email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log('Erreur lors de l\'envoi:', error);
  } else {
    console.log('Email envoyé:', info.response);
  }
});

  //  Configure the email transporter
/*const transporter = nodemailer.createTransport({
   service: 'gmail',
   host: 'smtp@gmail.com',
   port: 587, 
   secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  socketTimeout: 5000,  
  connectionTimeout: 5000,
  logger: true, 
  debug: true, 
  tls: {
    rejectUnauthorized: false, 
  },
});

app.post('/api/request-password-reset', async (req, res) => {
  try {
    const { email } = req.body;

    // Find User's email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
     //Generate a reset token
     const resetToken = crypto.randomBytes(32).toString('hex');
     user.resetPasswordToken = resetToken;
     user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
     await user.save();

      // Send the reset token via email
    const resetURL = `${req.protocol}://${req.get('host')}/api/reset-password/${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You have requested a password reset. Click this link to reset your password: ${resetURL}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Reset email sent' });
  } catch (error) {
    console.error('Error while requesting reset :', error);
    res.status(500).json({ message: 'Error while requesting reset', error: error.message });
  }
});



// Reset Password
app.post('/api/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    //Find user by valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Token not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Update user password
    user.password = newPassword;
    user.resetPasswordToken = undefined; 
    user.resetPasswordExpires = undefined; 
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password :', error);
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});
    */

  //Diary_entry Post
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; 
    if (!token) {
      return res.status(401).json({ message: 'Non autorisé' });
    }
    try {
      const decoded = jwt.verify(token, 'SECRET');
      req.user = { _id: decoded.userId }; 
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token invalide', error });
    }
  };


  app.post('/api/diary', authenticate, async (req, res) => {
    //console.log("POST /diary_entry hit");
    try {
      const {email, timestamp, mood_scale, sleep_quality_scale, sleep_duration_length, stool_consistency_scale,
        stool_quantity_scale, stool_mucus, stool_blood, stool_urgency, stomach_pain, stomach_bloating,
        stomach_flatulence, food, drink } = req.body;
      
      const user = await User.findOne({ email: email });
        if (!user) {
          return res.status(400).json({ message: 'User not found. Please register the user first.' });
        }

  
      const newDiaryEntry = new DiaryEntry({
        user_id: user._id,
        timestamp,
        mood_scale,
        sleep_quality_scale,
        sleep_duration_length,
        stool_consistency_scale,
        stool_quantity_scale,
        stool_mucus,
        stool_blood,
        stool_urgency,
        stomach_pain,
        stomach_bloating,
        stomach_flatulence,
        food,
        drink,
      });

      await newDiaryEntry.save();
  
      res.status(201).json({
        message: 'Diary entry created successfully',
        data: newDiaryEntry,
      });
    } catch (error) {
      console.error("Error creating diary entry: ", error);  
      res.status(500).json({ 
      message: 'Error creating diary entry', 
      error: error.message, 
      //stack: error.stack 
    });
  }
  });
  
  

  //Diary_Entry Get
  app.get('/api/diary', authenticate, async (req, res) => {
    try {
      const { from, to } = req.query;
  
      
      if (!from || !to) {
        return res.status(400).json({ message: 'Please provide both "from" and "to" date parameters.' });
      }
  
      /*if (!user_id) {
        return res.status(400).json({ message: 'Please provide a "user_id" parameter.' });
      }
  */
    
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const userId = req.user._id;
  
     
      const filter = {
        userId, 
        timestamp: {
          $gte: fromDate, 
          $lte: toDate,   
        },
      };
  
     
      const diaryEntries = await DiaryEntry.find(filter).populate('userId', 'name email');
  
      if (!diaryEntries.length) {
        return res.status(404).json({ message: 'No diary entries found for the specified user and date range.' });
      }
  
     
      res.status(200).json(diaryEntries);
    } catch (error) {
      console.error('Error fetching diary entries by user and date range:', error);
      res.status(500).json({ message: 'An error occurred while fetching diary entries.', error: error.message });
    }
  });
  


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
