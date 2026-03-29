import { Head } from "@inertiajs/react"
import { SignupForm } from "@/Components/signup-form"

export default function Register() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-slate-50">
            <Head title="Register" />
            <div className="w-full max-w-sm md:max-w-3xl">
                <SignupForm />
            </div>
        </div>
    )
}