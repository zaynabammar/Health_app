const User = require('./models/User');
const DiaryEntry = require('./models/DiaryEntry');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
  const { user_id, name, email, password } = req.body;

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
  


  //Diary_entry Post
  app.post('/api/diary', async (req, res) => {
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
  app.get('/api/diary', async (req, res) => {
    try {
      const { from, to, user_id } = req.query;
  
      
      if (!from || !to) {
        return res.status(400).json({ message: 'Please provide both "from" and "to" date parameters.' });
      }
  
      if (!user_id) {
        return res.status(400).json({ message: 'Please provide a "user_id" parameter.' });
      }
  
    
      const fromDate = new Date(from);
      const toDate = new Date(to);
  
     
      const filter = {
        user_id, 
        timestamp: {
          $gte: fromDate, 
          $lte: toDate,   
        },
      };
  
     
      const diaryEntries = await DiaryEntry.find(filter).populate('user_id', 'name email');
  
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
