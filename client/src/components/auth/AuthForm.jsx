import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useAuth } from '../../contexts/AuthContext'

export function AuthForm({ type = 'login' }) {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let success;
      if (type === 'login') {
        success = await login(formData.email, formData.password)
      } else {
        success = await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          company: { name: formData.company }
        })
      }

      if (success) {
        navigate('/dashboard')
      } else {
        setError('Authentication failed. Please check your credentials.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-gray-800 border-gray-700">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center text-white">
          {type === 'login' ? 'Login' : 'Create an Account'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'register' && (
            <>
              <Input
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </>
          )}
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
          />
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (type === 'login' ? 'Login' : 'Register')}
          </Button>
          
          <div className="text-center text-sm text-gray-400">
            {type === 'login' ? (
              <p>
                Don't have an account?{' '}
                <a href="/register" className="text-blue-400 hover:underline">
                  Register
                </a>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <a href="/login" className="text-blue-400 hover:underline">
                  Login
                </a>
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}