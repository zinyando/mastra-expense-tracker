import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to generate a unique filename
const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split(".").pop();
  return `expense-${timestamp}.${extension}`;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const filename = generateUniqueFilename(file.name);
    const bytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(bytes);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(`public/${filename}`, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error("Failed to upload file to storage");
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("receipts").getPublicUrl(`public/${filename}`);

    return NextResponse.json({
      url: publicUrl,
      path: `public/${filename}`,
      message: "File uploaded successfully to Supabase Storage",
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}
