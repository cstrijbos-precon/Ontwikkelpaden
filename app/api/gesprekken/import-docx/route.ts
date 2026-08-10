import { auth } from "@/auth";
import { herkenBestandstype } from "@/lib/bestandstype";
import { parseGesprekDocx } from "@/lib/parse-gesprek-docx";
import { parseGesprekPdf } from "@/lib/parse-gesprek-pdf";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Geen bestand ontvangen" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "Bestand is te groot" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const type = herkenBestandstype(buffer);

    if (!type) {
      return Response.json(
        { error: "Alleen Word (.docx) of PDF wordt ondersteund." },
        { status: 400 },
      );
    }

    const result =
      type === "pdf"
        ? await parseGesprekPdf(buffer)
        : await parseGesprekDocx(buffer);
    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Kon het document niet verwerken";
    return Response.json({ error: message }, { status: 400 });
  }
}
