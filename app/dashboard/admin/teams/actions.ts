// app/dashboard/admin/teams/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { TeamFormSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function upsertTeam(prevState: unknown, formData: FormData) {
  const cookieStore = cookies(); // NEW WAY
  const supabase = createClient(await cookieStore); // NEW WAY
  const validatedFields = TeamFormSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    season: formData.get("season"),
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid form data. Please check your inputs.",
      fields: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { id, name, season } = validatedFields.data;

  const { data, error } = await supabase.from("teams").upsert({ id, name, season }).select().single();

  if (error) {
    return { error: `Failed to save team: ${error.message}` };
  }

  revalidatePath("/dashboard/admin/teams");
  return { success: `Team "${data.name}" saved successfully.`, team: data };
}

export async function deleteTeam(teamId: string) {
  const cookieStore = cookies(); // NEW WAY
  const supabase = createClient(await cookieStore); // NEW WAY
  const { error } = await supabase.from("teams").delete().eq("id", teamId);

  if (error) {
    return { error: `Failed to delete team: ${error.message}` };
  }

  revalidatePath("/dashboard/admin/teams");
  return { success: "Team deleted successfully." };
}
