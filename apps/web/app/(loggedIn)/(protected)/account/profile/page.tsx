"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/authContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
    const supabase = createClient();
    const { user } = useAuth();
    const [profile, setProfile] = useState({ name: "", email: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user?.id) return;
        async function loadProfile() {
            const { data } = await supabase.from("users").select("name, email").eq("id", user?.id).single();
            if (data) setProfile(data);
        }
        loadProfile();
    }, [user?.id]);

    async function saveProfile() {
        setSaving(true);
        await supabase.from("users").update({ name: profile.name }).eq("id", user?.id);
        setSaving(false);
    }

    return (
        <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-semibold">Profile</h1>
            {/*<Input*/}
            {/*    label="Full Name"*/}
            {/*    value={profile.name}*/}
            {/*    onChange={(e) => setProfile({ ...profile, name: e.target.value })}*/}
            {/*/>*/}
            {/*<Input label="Email" value={profile.email} disabled />*/}
            {/*<Button onClick={saveProfile} disabled={saving}>*/}
            {/*    {saving ? "Saving..." : "Save Changes"}*/}
            {/*</Button>*/}
        </div>
    );
}