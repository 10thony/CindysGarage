import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUp 
          routing="path" 
          path="/sign-up"
          afterSignUpUrl="/"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  )
}
