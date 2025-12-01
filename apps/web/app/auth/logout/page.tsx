'use client'
import {useAuth} from "@/hooks/authContext";
import {useEffect} from "react";

export default function LogoutPage() {
    const {signOut} = useAuth()
    useEffect(() => {
        console.log('hello')
        // signOut()
    },[])
    return (
        <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                Logging Out...
            </div>
        </div>
    )
}
