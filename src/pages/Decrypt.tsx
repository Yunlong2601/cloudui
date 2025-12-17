import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Lock, Unlock, Download, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { decryptPackage } from "@/lib/crypto";

type DecryptionState = "idle" | "file-selected" | "decrypting" | "success" | "error";

export default function Decrypt() {
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null);
  const [decryptionCode, setDecryptionCode] = useState("");
  const [state, setState] = useState<DecryptionState>("idle");
  const [decryptedBlob, setDecryptedBlob] = useState<Blob | null>(null);
  const [decryptedFileName, setDecryptedFileName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".encrypted")) {
        toast.error("Please select a .encrypted file");
        return;
      }
      setEncryptedFile(file);
      setState("file-selected");
      setDecryptedBlob(null);
      setDecryptedFileName("");
      setErrorMessage("");
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (!file.name.endsWith(".encrypted")) {
        toast.error("Please drop a .encrypted file");
        return;
      }
      setEncryptedFile(file);
      setState("file-selected");
      setDecryptedBlob(null);
      setDecryptedFileName("");
      setErrorMessage("");
    }
  }, []);

  const handleDecrypt = useCallback(async () => {
    if (!encryptedFile || !decryptionCode) {
      toast.error("Please select a file and enter the decryption code");
      return;
    }

    setState("decrypting");
    setErrorMessage("");

    try {
      const { file, metadata } = await decryptPackage(encryptedFile, decryptionCode);
      setDecryptedBlob(file);
      setDecryptedFileName(metadata.fileName);
      setState("success");
      toast.success("File decrypted successfully!");
    } catch (error) {
      setState("error");
      setErrorMessage("Invalid decryption code or corrupted file");
      toast.error("Decryption failed. Check your code and try again.");
    }
  }, [encryptedFile, decryptionCode]);

  const handleDownload = useCallback(() => {
    if (!decryptedBlob || !decryptedFileName) return;

    const url = URL.createObjectURL(decryptedBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = decryptedFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`${decryptedFileName} downloaded!`);
  }, [decryptedBlob, decryptedFileName]);

  const handleReset = useCallback(() => {
    setEncryptedFile(null);
    setDecryptionCode("");
    setState("idle");
    setDecryptedBlob(null);
    setDecryptedFileName("");
    setErrorMessage("");
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Decrypt File</h1>
          <p className="text-muted-foreground">
            Upload an encrypted file and enter your decryption code to unlock it
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Step 1: Select Encrypted File
            </CardTitle>
            <CardDescription>
              Upload the .encrypted file you received
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                encryptedFile ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              data-testid="dropzone-encrypted-file"
            >
              {encryptedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium" data-testid="text-selected-filename">{encryptedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(encryptedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    data-testid="button-clear-file"
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">Drag & drop your encrypted file here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                  <Input
                    type="file"
                    accept=".encrypted"
                    onChange={handleFileSelect}
                    className="max-w-xs mx-auto"
                    data-testid="input-encrypted-file"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Step 2: Enter Decryption Code
            </CardTitle>
            <CardDescription>
              Enter the 6-digit code that was sent to your email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="decryption-code">Decryption Code</Label>
              <Input
                id="decryption-code"
                type="text"
                placeholder="Enter 6-digit code"
                value={decryptionCode}
                onChange={(e) => setDecryptionCode(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={state === "decrypting" || state === "success"}
                data-testid="input-decryption-code"
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                <span data-testid="text-error-message">{errorMessage}</span>
              </div>
            )}

            <Button
              onClick={handleDecrypt}
              disabled={!encryptedFile || decryptionCode.length !== 6 || state === "decrypting" || state === "success"}
              className="w-full"
              data-testid="button-decrypt"
            >
              {state === "decrypting" ? (
                <>Decrypting...</>
              ) : (
                <>
                  <Unlock className="w-4 h-4 mr-2" />
                  Decrypt File
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {state === "success" && decryptedBlob && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                Decryption Successful
              </CardTitle>
              <CardDescription>
                Your file has been decrypted and is ready to download
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium" data-testid="text-decrypted-filename">{decryptedFileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Ready to download
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleDownload}
                  className="flex-1"
                  data-testid="button-download-decrypted"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download File
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  data-testid="button-decrypt-another"
                >
                  Decrypt Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
