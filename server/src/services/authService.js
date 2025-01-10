import { User } from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

class AuthService {
  async find(query) {
    try {
      return await query.exec();
    } catch (error) {
      throw new Error(`Error in user find operation: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(`Error in user findById operation: ${error.message}`);
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw new Error(`Error in user findByEmail operation: ${error.message}`);
    }
  }

  async create(data) {
    try {
      return await User.create(data);
    } catch (error) {
      throw new Error(`Error in user create operation: ${error.message}`);
    }
  }

  async update(query, updateData, options) {
    try {
      return await User.findOneAndUpdate(query, updateData, options);
    } catch (error) {
      throw new Error(`Error in user update operation: ${error.message}`);
    }
  }

  async delete(query) {
    try {
      return await User.findOneAndDelete(query);
    } catch (error) {
      throw new Error(`Error in user delete operation: ${error.message}`);
    }
  }

  async count(query) {
    try {
      return await User.countDocuments(query);
    } catch (error) {
      throw new Error(`Error in user count operation: ${error.message}`);
    }
  }

  // Helper method to get base query
  getQuery() {
    return User.find();
  }

  // Auth specific methods
  async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(`Error hashing password: ${error.message}`);
    }
  }

  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(`Error comparing passwords: ${error.message}`);
    }
  }

  generateToken(user) {
    try {
      return jwt.sign(
        { 
          id: user._id,
          email: user.email,
          role: user.role,
          company: user.company
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    } catch (error) {
      throw new Error(`Error generating token: ${error.message}`);
    }
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error(`Error verifying token: ${error.message}`);
    }
  }
}

export default new AuthService();
