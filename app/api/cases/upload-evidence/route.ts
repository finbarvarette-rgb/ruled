import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ hasEvidence: false });

  const { data } = await getSupabase()
    .from("case_evidence")
    .select("id")
    .eq("case_id", caseId)
    .limit(1);

  return NextResponse.json({ hasEvidence: (data?.length ?? 0) > 0 });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const caseId = formData.get("caseId") as string | null;
    const files = formData.getAll("files") as File[];

    if (!caseId || files.length === 0) {
      return NextResponse.json(
        { error: "Missing caseId or files" },
        { status: 400 }
      );
    }

    // Use authenticated client when possible
    let storageClient = getSupabase();
    try {
      const serverClient = await createClient();
      const { data: { user } } = await serverClient.auth.getUser();
      if (user) storageClient = serverClient;
    } catch { /* fall back to anon */ }

    // Count existing evidence for sequential exhibit labelling
    const { data: existing } = await getSupabase()
      .from("case_evidence")
      .select("exhibit_label")
      .eq("case_id", caseId);

    const startIndex = existing?.length ?? 0;
    const results: { id: string; exhibitLabel: string; fileUrl: string; fileName: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const exhibitLabel = String.fromCharCode(65 + startIndex + i); // A, B, C…
      const storagePath = `${caseId}/${exhibitLabel}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      const bytes = await file.arrayBuffer();

      const { error: storageError } = await storageClient
        .storage
        .from("evidence")
        .upload(storagePath, bytes, {
          contentType: file.type,
          upsert: true,
        });

      if (storageError) {
        console.error("Storage upload error:", storageError);
        continue;
      }

      const { data: { publicUrl } } = storageClient
        .storage
        .from("evidence")
        .getPublicUrl(storagePath);

      const { data: inserted, error: dbError } = await getSupabase()
        .from("case_evidence")
        .insert({
          case_id: caseId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: file.type,
          exhibit_label: exhibitLabel,
        })
        .select("id, exhibit_label, file_url")
        .single();

      if (dbError) {
        console.error("DB insert error:", dbError);
        continue;
      }

      results.push({
        id: inserted.id,
        exhibitLabel: inserted.exhibit_label,
        fileUrl: inserted.file_url,
        fileName: file.name,
      });
    }

    return NextResponse.json({ uploaded: results });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
