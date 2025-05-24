import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM expense_categories ORDER BY name"
    );
    return NextResponse.json({ categories: rows });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to fetch categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, color, description } = body;

    if (!name || !color) {
      return NextResponse.json(
        { error: "Name and color are required" },
        { status: 400 }
      );
    }

    const {
      rows: [newCategory],
    } = await pool.query(
      `INSERT INTO expense_categories (id, name, color, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [randomUUID(), name, color, description || null]
    );

    return NextResponse.json(newCategory);
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to create category: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}
