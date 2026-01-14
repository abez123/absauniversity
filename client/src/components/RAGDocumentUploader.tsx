import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface RAGDocumentUploaderProps {
  courseId: number;
}

export function RAGDocumentUploader({ courseId }: RAGDocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  // Queries
  const documentsQuery = trpc.ragDocuments.getByCourse.useQuery({ courseId });

  // Mutations
  const uploadMutation = trpc.ragDocuments.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded and processed successfully");
      setFile(null);
      setTitle("");
      setUploading(false);
      documentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload document");
      setUploading(false);
    },
  });

  const deleteMutation = trpc.ragDocuments.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted successfully");
      documentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete document");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!title) {
        // Auto-fill title from filename
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const uploadFileMutation = trpc.storage.upload.useMutation();

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setUploading(true);

    try {
      // Read file as base64
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix (e.g., "data:text/plain;base64,")
          const base64 = result.includes(",") ? result.split(",")[1] : result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to storage
      const uploadResult = await uploadFileMutation.mutateAsync({
        fileName: file.name,
        fileData,
        contentType: file.type || "text/plain",
      });

      // Then, process the document through RAG
      await uploadMutation.mutateAsync({
        courseId,
        title: title.trim(),
        fileUrl: uploadResult.url,
        mimeType: file.type || "text/plain",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return;
    }

    deleteMutation.mutate({
      id,
      courseId,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>RAG Documents</CardTitle>
        <CardDescription>
          Upload documents for AI context retrieval. Documents will be processed and indexed for semantic search.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Form */}
        <div className="space-y-4 border rounded-lg p-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Document File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: TXT, PDF, DOCX
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="document-title">Document Title</Label>
            <Input
              id="document-title"
              type="text"
              placeholder="Enter document title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !title.trim() || uploading}
            className="w-full gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload & Process Document
              </>
            )}
          </Button>
        </div>

        {/* Documents List */}
        <div className="space-y-2">
          <h3 className="font-semibold">Uploaded Documents</h3>
          {documentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : documentsQuery.data && documentsQuery.data.length > 0 ? (
            <div className="space-y-2">
              {documentsQuery.data.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.mimeType || "Unknown type"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No documents uploaded yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
