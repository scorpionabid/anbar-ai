import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.domain.webhook import WebhookEvent

_VALID_EVENTS = {e.value for e in WebhookEvent}


class WebhookCreate(BaseModel):
    url: str
    events: list[str]
    secret: str | None = None
    description: str | None = None

    @field_validator("url")
    @classmethod
    def url_must_be_https(cls, v: str) -> str:
        if not v.startswith("https://"):
            raise ValueError("Webhook URL must start with https://")
        return v

    @field_validator("events")
    @classmethod
    def events_must_be_valid(cls, v: list[str]) -> list[str]:
        invalid = [e for e in v if e not in _VALID_EVENTS]
        if invalid:
            raise ValueError(
                f"Invalid event(s): {invalid}. Valid values: {sorted(_VALID_EVENTS)}"
            )
        return v


class WebhookUpdate(BaseModel):
    url: str | None = None
    events: list[str] | None = None
    is_active: bool | None = None
    description: str | None = None

    @field_validator("url")
    @classmethod
    def url_must_be_https(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith("https://"):
            raise ValueError("Webhook URL must start with https://")
        return v

    @field_validator("events")
    @classmethod
    def events_must_be_valid(cls, v: list[str] | None) -> list[str] | None:
        if v is not None:
            invalid = [e for e in v if e not in _VALID_EVENTS]
            if invalid:
                raise ValueError(
                    f"Invalid event(s): {invalid}. Valid values: {sorted(_VALID_EVENTS)}"
                )
        return v


class WebhookRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    url: str
    events: list[str]
    description: str | None
    is_active: bool
    created_at: datetime
