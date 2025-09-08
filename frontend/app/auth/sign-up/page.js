'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUpSchema } from '@/lib/schema'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSignUpMutation } from '@/app/hooks/use-Auth'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'   // ✅ using Switch for 2FA toggle

const SignUp = () => {
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      is2FAEnabled: false,   // ✅ default false
    },
  })

  const { mutate, isPending } = useSignUpMutation()

  const handleOnSubmit = (data) => {
    mutate(data, {
      onSuccess: (res) => {
        toast.success(res.email_status, {
          description:
            "Please check the email to verify your account. If you don't see the email, check your spam folder.",
        })
        form.reset()
        router.push("/auth/sign-in")
      },
      onError: (error) => {
        toast.error(error?.data?.message || "Something went wrong")
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 p-4">
      <Card className="max-w-md w-full shadow-xl gap-4 text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
        </CardHeader>
        <CardDescription className="text-sm text-muted-foreground">
          Create your account to continue
        </CardDescription>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleOnSubmit)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password again"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ✅ 2FA Toggle */}
              <FormField
                control={form.control}
                name="is2FAEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <FormLabel className="text-sm font-medium">
                      Enable Two-Factor Authentication
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-blue-600"
                disabled={isPending}
              >
                {isPending ? "Signing Up..." : "Sign Up"}
              </Button>
            </form>
          </Form>

          <CardFooter className="flex justify-center mt-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="/auth/sign-in" className="text-primary underline">
                  Sign In
                </a>
              </p>
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  )
}

export default SignUp
