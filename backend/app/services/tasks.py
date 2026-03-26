from app.core.celery_app import celery_app


@celery_app.task
def send_low_stock_alert(tenant_id: str, variant_id: str, available: int):
    # TODO: integrate notification service (email/webhook)
    print(f"[ALERT] Low stock — tenant={tenant_id} variant={variant_id} available={available}")
