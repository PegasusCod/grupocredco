import { cn } from "@/lib/utils"
import { Button } from "@/Components/ui/button"
import { Card, CardContent } from "@/Components/ui/card"
import { Input } from "@/Components/ui/input"
import { Label } from "@/Components/ui/label"
import { useForm, Link } from "@inertiajs/react"

export function SignupForm({ className, ...props }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: "", // Laravel Breeze suele pedir nombre
        email: "",
        password: "",
        password_confirmation: "",
    })

    const submit = (e) => {
        e.preventDefault()
        post(route("register"), {
            onFinish: () => reset("password", "password_confirmation"),
        })
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="overflow-hidden">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form onSubmit={submit} className="p-6 md:p-8">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col items-center text-center">
                                <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
                                <p className="text-balance text-muted-foreground">
                                    Ingresa tu correo para crear tu cuenta
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nombre completo*</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData("name", e.target.value)} required />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Correo*</Label>
                                <Input id="email" type="email" value={data.email} onChange={(e) => setData("email", e.target.value)} placeholder="m@example.com" required />
                                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Contraseña*</Label>
                                    <Input id="password" type="password" value={data.password} onChange={(e) => setData("password", e.target.value)} required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">Confirmar contraseña*</Label>
                                    <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={(e) => setData("password_confirmation", e.target.value)} required />
                                </div>
                            </div>
                            {(errors.password || errors.password_confirmation) && (
                                <p className="text-sm text-red-600">{errors.password || errors.password_confirmation}</p>
                            )}
                            <Button type="submit" className="w-full" disabled={processing}>
                                Registrarse
                            </Button>
                            <div className="text-center text-sm">
                                ¿Ya tienes una cuenta?{" "}
                                <Link href={route("login")} className="underline">
                                    Iniciar sesión
                                </Link>
                            </div>
                        </div>
                    </form>
                    <div className="relative hidden bg-muted md:block">
                        <img
                            src="images/image1.jpg" 
                            alt="Image"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}