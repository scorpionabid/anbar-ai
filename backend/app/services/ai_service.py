import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.inventory import Inventory, MovementType, StockMovement
from app.domain.product import ProductVariant
from app.domain.settings import AIProvider
from app.domain.warehouse import Warehouse
from app.repositories.settings_repo import SettingsRepository
from app.services.settings_service import _decrypt

# Priority order when selecting which AI key to use
_PROVIDER_PRIORITY = [
    AIProvider.ANTHROPIC,
    AIProvider.OPENAI,
    AIProvider.GEMINI,
    AIProvider.MISTRAL,
    AIProvider.AZURE_OPENAI,
]

# OpenAI-compatible base URLs for each provider
_OPENAI_COMPAT_BASE = {
    AIProvider.GEMINI: "https://generativelanguage.googleapis.com/v1beta/openai",
    AIProvider.MISTRAL: "https://api.mistral.ai/v1",
    AIProvider.AZURE_OPENAI: None,  # requires custom endpoint — not supported here
}

# Default model per provider when model_override is not set
_DEFAULT_MODEL = {
    AIProvider.ANTHROPIC: "claude-sonnet-4-6",
    AIProvider.OPENAI: "gpt-4o",
    AIProvider.GEMINI: "gemini-1.5-flash",
    AIProvider.MISTRAL: "mistral-small-latest",
}


class AIService:
    def __init__(self, settings_repo: SettingsRepository):
        self.settings_repo = settings_repo

    async def get_active_key(
        self, db: AsyncSession, tenant_id: uuid.UUID
    ) -> tuple[AIProvider, str, str | None]:
        """Return (provider, decrypted_api_key, model_override) for the first active key.

        Priority: anthropic > openai > gemini > mistral > azure_openai
        Raises HTTP 400 if no active AI key is configured for the tenant.
        """
        for provider in _PROVIDER_PRIORITY:
            key_record = await self.settings_repo.get_ai_key(db, tenant_id, provider)
            if key_record and key_record.is_active:
                decrypted = _decrypt(key_record.api_key_encrypted)
                return provider, decrypted, key_record.model_override

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "AI açarı konfiqurasiya edilməyib. "
                "Parametrlər → AI & İnteqrasiyalar bölməsindən açar əlavə edin."
            ),
        )

    async def _call_anthropic(
        self, api_key: str, model: str | None, prompt: str
    ) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model or _DEFAULT_MODEL[AIProvider.ANTHROPIC],
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=30.0,
            )
            response.raise_for_status()
            result = response.json()
            return result["content"][0]["text"]

    async def _call_openai_compat(
        self,
        api_key: str,
        model: str | None,
        prompt: str,
        provider: AIProvider,
        base_url: str = "https://api.openai.com/v1",
    ) -> str:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model or _DEFAULT_MODEL.get(provider, "gpt-4o"),
                    "max_tokens": 300,
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=30.0,
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]

    async def _call_llm(
        self,
        provider: AIProvider,
        api_key: str,
        model_override: str | None,
        prompt: str,
    ) -> str:
        try:
            if provider == AIProvider.ANTHROPIC:
                return await self._call_anthropic(api_key, model_override, prompt)

            if provider == AIProvider.OPENAI:
                return await self._call_openai_compat(
                    api_key, model_override, prompt, provider
                )

            if provider in (AIProvider.GEMINI, AIProvider.MISTRAL):
                base_url = _OPENAI_COMPAT_BASE[provider]
                return await self._call_openai_compat(
                    api_key, model_override, prompt, provider, base_url=base_url
                )

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Provider '{provider}' dəstəklənmir.",
            )

        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"LLM API xətası ({provider}): {exc.response.status_code} — {exc.response.text[:200]}",
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"LLM API bağlantı xətası ({provider}): {exc}",
            ) from exc

    async def generate_product_description(
        self,
        db: AsyncSession,
        tenant_id: uuid.UUID,
        product_name: str,
        category: str | None,
        attributes: dict | None,
    ) -> str:
        """Generate a product description using the tenant's configured LLM."""
        provider, api_key, model_override = await self.get_active_key(db, tenant_id)

        prompt = (
            "Aşağıdakı məhsul üçün cəlbedici Azərbaycan dilində qısa açıqlama yaz (2-3 cümlə):\n"
            f"Məhsul adı: {product_name}\n"
            f"Kateqoriya: {category or 'bilinmir'}\n"
            f"Xüsusiyyətlər: {attributes or 'yoxdur'}\n"
            "Yalnız açıqlamanı yaz, başqa heç nə əlavə etmə."
        )

        return await self._call_llm(provider, api_key, model_override, prompt)

    async def get_reorder_suggestions(
        self, db: AsyncSession, tenant_id: uuid.UUID
    ) -> list[dict]:
        """Analyze inventory and return reorder suggestions based on DB data.

        No LLM call — pure DB-driven calculation.
        Items qualify when: available <= reorder_point  OR  (reorder_point == 0 AND available <= 10).
        Suggested qty = max(20, avg_daily_consumption * 14)  (two weeks of stock).
        """
        # Fetch low-stock inventory rows with joined variant + warehouse
        result = await db.execute(
            select(Inventory, ProductVariant, Warehouse)
            .join(ProductVariant, Inventory.variant_id == ProductVariant.id)
            .join(Warehouse, Inventory.warehouse_id == Warehouse.id)
            .where(
                Inventory.tenant_id == tenant_id,
                # low-stock condition
                (
                    (Inventory.reorder_point > 0)
                    & ((Inventory.quantity - Inventory.reserved_quantity) <= Inventory.reorder_point)
                )
                | (
                    (Inventory.reorder_point == 0)
                    & ((Inventory.quantity - Inventory.reserved_quantity) <= 10)
                ),
            )
        )
        rows = result.all()

        if not rows:
            return []

        suggestions: list[dict] = []
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

        for inventory, variant, warehouse in rows:
            # Calculate average daily OUT consumption over the last 30 days
            consumption_result = await db.execute(
                select(func.coalesce(func.sum(StockMovement.quantity), 0)).where(
                    StockMovement.tenant_id == tenant_id,
                    StockMovement.inventory_id == inventory.id,
                    StockMovement.movement_type == MovementType.OUT,
                    StockMovement.created_at >= thirty_days_ago,
                )
            )
            total_consumed: int = consumption_result.scalar_one()
            avg_daily = round(total_consumed / 30, 2)
            suggested_qty = max(20, int(avg_daily * 14))

            available = inventory.quantity - inventory.reserved_quantity

            if inventory.reorder_point > 0:
                reason = (
                    f"Mövcud stok ({available}) yenidən sifariş həddindən "
                    f"({inventory.reorder_point}) aşağıdır"
                )
            else:
                reason = f"Mövcud stok ({available}) kritik hədd olan 10-dan aşağıdır"

            suggestions.append(
                {
                    "variant_id": str(variant.id),
                    "variant_name": variant.name,
                    "sku": variant.sku,
                    "warehouse_name": warehouse.name,
                    "current_stock": available,
                    "reorder_point": inventory.reorder_point,
                    "suggested_quantity": suggested_qty,
                    "avg_daily_consumption": avg_daily,
                    "reason": reason,
                }
            )

        return suggestions
