import { Head } from "@inertiajs/react"
import { LoginForm } from "@/Components/login-form"

export default function Login({ status, canResetPassword }) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Head title="Inicio de Sesion" />
      <div className="w-full max-w-sm md:max-w-3xl">
        <LoginForm status={status} canResetPassword={canResetPassword} />
      </div>
    </div>
  )
}
