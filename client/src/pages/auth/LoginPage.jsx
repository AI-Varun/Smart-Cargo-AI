import { AuthForm } from '../../components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <AuthForm type="login" />
    </div>
  )
}