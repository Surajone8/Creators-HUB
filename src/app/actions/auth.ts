"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string | null;
  success?: boolean;
  message?: string | null;
}

/**
 * Signs in user with email & password
 */
export async function signInAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Signs up new user with email, password, and metadata (display name, timezone)
 */
export async function signUpAction(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;
  const timezone = (formData.get("timezone") as string) || "UTC";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split("@")[0],
        preferred_timezone: timezone,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is enabled on Supabase, the user session will not be immediately active
  if (data.user && !data.session) {
    return {
      success: true,
      message: "Registration successful! Please check your email to confirm your account.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Signs out current user
 */
export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Retrieves current user and profile
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    user,
    profile: profile || {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0],
      preferred_timezone: user.user_metadata?.preferred_timezone || "UTC",
    },
  };
}
