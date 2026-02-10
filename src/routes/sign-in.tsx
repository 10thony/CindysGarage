import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn 
          routing="path" 
          path="/sign-in"
          afterSignInUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}
