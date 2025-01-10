import authService from '../services/authService.js';

class AuthController {
  async register(request, reply) {
    try {
      const { email, password, name, company } = request.body;

      // Validate required fields
      if (!email || !password || !name || !company?.name) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Missing required fields: email, password, name, and company name are required'
        });
      }

      // Check if user already exists
      const existingUser = await authService.findByEmail(email);
      if (existingUser) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'User with this email already exists'
        });
      }

      // Create user data
      const userData = {
        email,
        password,
        name,
        company,
        role: 'viewer',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Create user
      const user = await authService.create(userData);

      // Generate token
      const token = authService.generateToken(user);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return reply.code(201).send({
        statusCode: 201,
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred during registration'
      });
    }
  }

  async login(request, reply) {
    try {
      const { email, password } = request.body;

      // Validate required fields
      if (!email || !password) {
        return reply.code(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Email and password are required'
        });
      }

      // Find user by email
      const user = await authService.findByEmail(email);
      if (!user) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isValidPassword = await authService.comparePassword(password, user.password);
      if (!isValidPassword) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = authService.generateToken(user);

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      return reply.send({
        statusCode: 200,
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred during login'
      });
    }
  }

  async getProfile(request, reply) {
    try {
      const userId = request.user.id;
      const user = await authService.findById(userId);
      
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return reply.send({
        statusCode: 200,
        data: userResponse
      });
    } catch (error) {
      console.error('Get profile error:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred while fetching profile'
      });
    }
  }

  async updateProfile(request, reply) {
    try {
      const userId = request.user.id;
      const { name, company } = request.body;

      const updates = {
        ...(name && { name }),
        ...(company?.name && { company }),
        updatedAt: new Date()
      };

      const user = await authService.findByIdAndUpdate(userId, updates);
      
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      const userResponse = user.toObject();
      delete userResponse.password;

      return reply.send({
        statusCode: 200,
        data: userResponse
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred while updating profile'
      });
    }
  }

  async changePassword(request, reply) {
    try {
      const userId = request.user.id;
      const { currentPassword, newPassword } = request.body;

      const user = await authService.findById(userId);
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found'
        });
      }

      const isValidPassword = await authService.comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return reply.code(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Current password is incorrect'
        });
      }

      const hashedPassword = await authService.hashPassword(newPassword);
      await authService.findByIdAndUpdate(userId, {
        password: hashedPassword,
        updatedAt: new Date()
      });

      return reply.send({
        statusCode: 200,
        message: 'Password updated successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return reply.code(500).send({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'An error occurred while changing password'
      });
    }
  }
}

export default new AuthController();
