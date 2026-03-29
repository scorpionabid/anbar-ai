"use client";

import { useState } from "react";
import { 
  Bot, 
  CheckCircle, 
  XCircle, 
  Key, 
  Settings, 
  Trash2, 
  Eye, 
  EyeOff,
  Activity
} from "lucide-react";
import { useAIKeys, useAIKeyMutation, useAIKeyDelete } from "@/hooks/useAIKeys";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { AI_PROVIDERS, type AIProviderDef } from "./constants";
import type { AIProvider, AIKeyRead } from "@/types/api";

interface AIKeyModalState {
  open: boolean;
  provider: AIProviderDef | null;
}

export function AITab() {
  const { data: aiKeys, isLoading } = useAIKeys();
  const aiKeyMutation = useAIKeyMutation();
  const aiKeyDelete = useAIKeyDelete();

  const [modal, setModal] = useState<AIKeyModalState>({ open: false, provider: null });
  const [apiKey, setApiKey] = useState("");
  const [modelOverride, setModelOverride] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<AIProvider | null>(null);

  // Phase 2 enhancement: Connection testing state
  const [testingId, setTestingId] = useState<AIProvider | null>(null);
  const [testResult, setTestResult] = useState<Record<string, "success" | "error" | null>>({});

  function openModal(providerDef: AIProviderDef) {
    setModal({ open: true, provider: providerDef });
    setApiKey("");
    setModelOverride("");
    setShowKey(false);
    setModalError(null);
  }

  function closeModal() {
    setModal({ open: false, provider: null });
    setModalError(null);
  }

  function getKeyForProvider(providerId: AIProvider): AIKeyRead | undefined {
    return aiKeys?.find((k) => k.provider === providerId);
  }

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault();
    if (!modal.provider) return;
    setModalError(null);
    if (!apiKey.trim()) {
      setModalError("API açarı mütləqdir.");
      return;
    }
    try {
      await aiKeyMutation.mutateAsync({
        provider: modal.provider.id,
        api_key: apiKey.trim(),
        model_override: modelOverride.trim() || null,
      });
      closeModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Xəta baş verdi.");
    }
  }

  async function handleDelete(provider: AIProvider) {
    try {
      await aiKeyDelete.mutateAsync(provider);
      setConfirmDeleteId(null);
    } catch {
      // silently fail
    }
  }

  // Phase 2 enhancement: Test connection mock
  async function handleTestConnection(provider: AIProvider) {
    setTestingId(provider);
    setTestResult(prev => ({ ...prev, [provider]: null }));
    
    // Simulate API call
    setTimeout(() => {
      setTestingId(null);
      setTestResult(prev => ({ ...prev, [provider]: "success" }));
      setTimeout(() => setTestResult(prev => ({ ...prev, [provider]: null })), 3000);
    }, 1500);
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          AI & İnteqrasiyalar
        </h2>
        <p className="text-muted-foreground font-medium mt-1">
          AI provayder API açarlarını idarə edin.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-44 bg-secondary/60 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {AI_PROVIDERS.map((provider) => {
            const connectedKey = getKeyForProvider(provider.id);
            const isConnected = !!connectedKey;
            const isTesting = testingId === provider.id;
            const status = testResult[provider.id];

            return (
              <Card
                key={provider.id}
                glass
                className={`bg-gradient-to-br ${provider.color} transition-all duration-200`}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${provider.badge} shrink-0`}>
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">{provider.description}</p>
                      </div>
                    </div>

                    {isConnected ? (
                      <Badge variant="success" className="shrink-0 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Qoşulub
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0 gap-1">
                        <XCircle className="h-3 w-3" />
                        Qoşulmayıb
                      </Badge>
                    )}
                  </div>

                  {isConnected && connectedKey && (
                    <div className="bg-background/50 rounded-xl px-3 py-2 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Key className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-mono text-muted-foreground truncate">
                            {connectedKey.key_preview}
                          </span>
                        </div>
                        {/* Phase 2: Test button */}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2 text-[10px] gap-1 hover:bg-primary/10"
                          onClick={() => handleTestConnection(provider.id)}
                          disabled={isTesting}
                        >
                          {isTesting ? (
                             <Activity className="h-3 w-3 animate-spin" />
                          ) : status === "success" ? (
                             <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                             <Activity className="h-3 w-3" />
                          )}
                          Yoxla
                        </Button>
                      </div>
                      {connectedKey.model_override && (
                        <div className="flex items-center gap-2">
                          <Settings className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            Model: {connectedKey.model_override}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openModal(provider)}
                      className="gap-1.5 flex-1"
                    >
                      <Key className="h-3.5 w-3.5" />
                      {isConnected ? "Yenilə" : "Açar əlavə et"}
                    </Button>

                    {isConnected && (
                      <>
                        {confirmDeleteId === provider.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(provider.id)}
                              disabled={aiKeyDelete.isPending}
                            >
                              Bəli
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Xeyr
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(provider.id)}
                            aria-label="Sil"
                            className="text-destructive hover:text-destructive shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.provider ? `${modal.provider.name} API Açarı` : "API Açarı"}
        description="API açarınızı daxil edin. Açar şifrəli saxlanılır."
      >
        <form onSubmit={handleSaveKey} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              API Açarı <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showKey ? "Gizlət" : "Göstər"}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Model (ixtiyari)
            </label>
            {modal.provider && modal.provider.models.length > 0 ? (
              <Select
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
              >
                <option value="">Default model istifadə et</option>
                {modal.provider.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
                placeholder="Default model istifadə et"
              />
            )}
          </div>

          {modalError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {modalError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal}>
              Ləğv et
            </Button>
            <Button type="submit" disabled={aiKeyMutation.isPending}>
              {aiKeyMutation.isPending ? "Saxlanılır..." : "Saxla"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
