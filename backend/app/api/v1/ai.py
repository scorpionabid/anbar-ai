import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.database import get_db
from app.domain.user import User
from app.repositories.settings_repo import SettingsRepository
from app.schemas.ai import GenerateDescriptionRequest, ReorderSuggestion
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])

_settings_repo = SettingsRepository()
_ai_service = AIService(_settings_repo)


@router.post("/generate-description", summary="AI ilə məhsul açıqlaması yarat")
async def generate_description(
    data: GenerateDescriptionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Konfiqurasiya edilmiş LLM provayderindən istifadə edərək məhsul açıqlaması yaradır."""
    description = await _ai_service.generate_product_description(
        db,
        tenant_id=current_user.tenant_id,
        product_name=data.product_name,
        category=data.category,
        attributes=data.attributes,
    )
    return {"data": {"description": description}, "message": "ok"}


@router.get("/reorder-suggestions", summary="Yenidən sifariş tövsiyələri")
async def reorder_suggestions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stok məlumatlarına əsasən yenidən sifariş tövsiyələrini qaytarır (LLM çağrısı yoxdur)."""
    suggestions = await _ai_service.get_reorder_suggestions(db, current_user.tenant_id)
    validated = [ReorderSuggestion(**s) for s in suggestions]
    return {"data": [s.model_dump() for s in validated], "message": "ok"}
